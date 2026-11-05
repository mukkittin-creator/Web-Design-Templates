"use client";
/**
 * WizardPanel — Sihirli Kontrol Listesi çekirdek bileşeni
 *
 * Yığın:
 *  - shadcn/ui      → Button, Badge, Select, Collapsible, Tooltip, Skeleton
 *  - framer-motion  → kart girişleri (stagger), check "pop", layout geçişleri
 *  - @tremor/react  → ProgressCircle (hazır olma ölçeri)
 *  - @react-pdf     → ChecklistPdf (tembel yüklenir, yalnızca "PDF olarak indir"de)
 *  - TipTap         → ItemNote (evrak başına kişisel not; tembel yüklenir)
 *
 * Durumlar: empty → loading (≈900 ms iskelet) → ready. Seçim değişince liste
 * yeniden üretilir; işaretler localStorage'da seçim anahtarıyla saklanır
 * (sunucuya hiçbir şey gitmez).
 *
 * Tailwind renkleri tailwind.config.ts'deki `es` paletinden gelir (aşağıdaki
 * tailwind-tokens.ts dosyasına bakın).
 */
import * as React from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ProgressCircle } from "@tremor/react";
import {
  Check, ChevronDown, Download, ExternalLink, Loader2, MapPin, Printer,
  RotateCcw, Sparkles, TriangleAlert, WandSparkles, ArrowRight, ClipboardList, NotebookPen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  GOREV, OKUL, SUREC, buildChecklist, isComplete, labelOf,
  type Evrak, type Gorev, type KaynakTipi, type Okul, type Secim, type Surec,
} from "./wizard-data";

const ItemNote = dynamic(() => import("./ItemNote"), { ssr: false, loading: () => <Skeleton className="h-20 rounded-xl" /> });

const EASE = [0.2, 0.9, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/* Hook: seçim → liste üretimi + işaret durumu                         */
/* ------------------------------------------------------------------ */
type Phase = "empty" | "loading" | "ready";

function useChecklist(initial: Secim = {}) {
  const [secim, setSecim] = React.useState<Secim>(initial);
  const [phase, setPhase] = React.useState<Phase>(isComplete(initial) ? "ready" : "empty");
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const key = isComplete(secim) ? `es:list:${secim.okul}:${secim.surec}:${secim.gorev}` : null;

  // Seçim tamamlanınca kısa bir "sihirbaz yazıyor" iskeleti göster
  React.useEffect(() => {
    if (!isComplete(secim)) { setPhase("empty"); return; }
    setPhase("loading");
    const t = setTimeout(() => setPhase("ready"), 900);
    return () => clearTimeout(t);
  }, [secim.okul, secim.surec, secim.gorev]); // eslint-disable-line react-hooks/exhaustive-deps

  // İşaretleri yalnızca bu tarayıcıda sakla
  React.useEffect(() => {
    if (!key) return setChecked({});
    try { setChecked(JSON.parse(localStorage.getItem(key) ?? "{}")); } catch { setChecked({}); }
  }, [key]);
  React.useEffect(() => {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(checked)); } catch { /* gizli sekme vb. */ }
  }, [key, checked]);

  const items = React.useMemo(() => (isComplete(secim) ? buildChecklist(secim) : []), [secim]);
  const done = items.filter((i) => checked[i.id]).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return {
    secim, phase, items, checked, done, pct,
    set: <K extends keyof Secim>(k: K, v: Secim[K]) => setSecim((s) => ({ ...s, [k]: v })),
    toggle: (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] })),
    reset: () => { setSecim({}); setChecked({}); },
  };
}

/* ------------------------------------------------------------------ */
/* Bileşen                                                             */
/* ------------------------------------------------------------------ */
export interface WizardPanelProps {
  initial?: Secim;
  /**
   * "Eksik N evrakı tek tıkla hazırla" — platformun hazırlayabildiği (tip: "arac") ve
   * henüz işaretlenmemiş evrakları üretir, tek Word paketi (ZIP/.docx) olarak indirir.
   * Başarılı dönen id'ler listede otomatik işaretlenir.
   */
  onBulkGenerate?: (evraklar: Evrak[], secim: Required<Secim>) => Promise<string[]>;
}

export function WizardPanel({ initial, onBulkGenerate }: WizardPanelProps) {
  const w = useChecklist(initial);
  const reduce = useReducedMotion();
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const [bulk, setBulk] = React.useState<{ busy: boolean; msg?: string }>({ busy: false });
  const aracEksik = w.items.filter((i) => i.tip === "arac" && !w.checked[i.id]);

  async function runBulk() {
    if (!onBulkGenerate || !isComplete(w.secim) || !aracEksik.length) return;
    setBulk({ busy: true });
    try {
      const ids = await onBulkGenerate(aracEksik, w.secim);
      ids.forEach((id) => { if (!w.checked[id]) w.toggle(id); });
      setBulk({ busy: false, msg: `${ids.length} evrak hazırlandı, Word paketi indirildi.` });
    } catch {
      setBulk({ busy: false, msg: "Paket hazırlanamadı. Bağlantınızı kontrol edip tekrar deneyin." });
    }
  }

  const summary = isComplete(w.secim)
    ? `${labelOf(OKUL, w.secim.okul)} · ${labelOf(SUREC, w.secim.surec)} · ${labelOf(GOREV, w.secim.gorev)}`
    : "";
  const eksikler = w.items.filter((i) => !w.checked[i.id]);

  async function downloadPdf() {
    if (!isComplete(w.secim)) return;
    setPdfBusy(true);
    try {
      const [{ pdf }, { ChecklistPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ChecklistPdf"),
      ]);
      const blob = await pdf(
        <ChecklistPdf title={summary} items={w.items} checked={w.checked} pct={w.pct} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: "evrak-kontrol-listesi.pdf" });
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <section
        id="sihirbaz"
        className="flex flex-wrap gap-2 rounded-[28px] border border-es-line bg-white p-2 shadow-es-card"
      >
        {/* ---------- Seçim paneli ---------- */}
        <aside aria-label="Seçimler" className="flex min-w-0 flex-[1_1_280px] flex-col gap-5 rounded-[22px] bg-es-surface-50 p-6">
          <ChipGroup step={1} label="Okul türü" options={OKUL} value={w.secim.okul} onChange={(v) => w.set("okul", v as Okul)} />
          <ChipGroup step={2} label="Süreç" options={SUREC} value={w.secim.surec} onChange={(v) => w.set("surec", v as Surec)} />
          <ChipGroup step={3} label="Görev" options={GOREV} value={w.secim.gorev} onChange={(v) => w.set("gorev", v as Gorev)} />
          <div className="flex-1" />
          <p className="rounded-2xl border border-es-line bg-white p-3.5 text-[13px] leading-5 text-es-ink-600">
            Liste bir rehberdir. Son kontrolü okul idarenizle yapın.
          </p>
          <Button variant="ghost" size="sm" onClick={w.reset} className="self-start font-bold text-es-navy-900">
            <RotateCcw className="size-4" aria-hidden /> Seçimleri sıfırla
          </Button>
        </aside>

        {/* ---------- Sonuç alanı ---------- */}
        <div aria-live="polite" className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 p-6">
          <AnimatePresence mode="wait" initial={false}>
            {w.phase === "empty" && (
              <motion.div key="empty" {...fade(reduce)}>
                <EmptyState secim={w.secim} />
              </motion.div>
            )}

            {w.phase === "loading" && (
              <motion.div key="loading" {...fade(reduce)} aria-busy="true">
                <LoadingState />
              </motion.div>
            )}

            {w.phase === "ready" && (
              <motion.div key="ready" {...fade(reduce)} className="flex flex-col gap-5">
                {/* Başlık + ölçer */}
                <header className="flex flex-wrap items-center justify-between gap-5">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-es-ink-500">Kişisel listeniz</p>
                    <h3 className="font-display text-[22px] font-semibold leading-[30px] text-es-navy-900">{summary}</h3>
                    <p className="text-sm text-es-ink-600">{w.items.length} evrak · {eksikler.length} eksik</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressCircle value={w.pct} size="md" color={w.pct === 100 ? "emerald" : "blue"}>
                      <span className="font-display text-sm font-semibold text-es-navy-900">%{w.pct}</span>
                    </ProgressCircle>
                    <span className="text-sm font-semibold text-es-ink-600">hazır</span>
                  </div>
                </header>

                {/* Kart ızgarası */}
                <motion.ul
                  className="grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] items-start gap-4 p-0"
                  initial="hidden"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.06 } } }}
                >
                  {w.items.map((item) => (
                    <ChecklistCard
                      key={item.id}
                      item={item}
                      done={!!w.checked[item.id]}
                      onToggle={() => w.toggle(item.id)}
                      reduce={!!reduce}
                    />
                  ))}
                </motion.ul>

                {/* Aksiyon çubuğu */}
                <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-[18px] border border-es-line bg-white/85 p-3.5 pl-5 shadow-es-lg backdrop-blur-md">
                  <p className="min-w-0 flex-[1_1_220px] text-sm text-es-ink-600">
                    {eksikler.length === 0 ? (
                      <span className="inline-flex items-center gap-2 font-bold text-es-success-700">
                        <Check className="size-4" aria-hidden /> Dosyanız eksiksiz. Denetime hazırsınız.
                      </span>
                    ) : (
                      <>
                        {bulk.msg && <b className="text-es-success-700">{bulk.msg} </b>}
                        <b className="text-es-ink-900">{eksikler.length} evrak eksik.</b>{" "}
                        {aracEksik.length > 0
                          ? `${aracEksik.length} tanesini sihirbaz tek tıkla hazırlar.`
                          : "Kalanlar ıslak imza veya dış kaynak bekliyor; çıktısını alıp imzaya götürün."}
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={downloadPdf} disabled={pdfBusy}>
                      {pdfBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
                      {pdfBusy ? "PDF hazırlanıyor…" : "PDF olarak indir"}
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="size-4" aria-hidden /> Listeyi yazdır
                    </Button>
                    {aracEksik.length > 0 && (
                      <Button variant="magic" onClick={runBulk} disabled={bulk.busy} aria-busy={bulk.busy}>
                        {bulk.busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <WandSparkles className="size-4 text-es-turquoise-100" aria-hidden />}
                        {bulk.busy ? "Sihirbaz hazırlıyor…" : `Eksik ${aracEksik.length} evrakı tek tıkla hazırla`}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Alt bileşenler                                                      */
/* ------------------------------------------------------------------ */
const fade = (reduce: boolean | null) => ({
  initial: { opacity: 0, y: reduce ? 0 : 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
});

function ChipGroup<T extends string>({
  step, label, options, value, onChange,
}: { step: number; label: string; options: { id: T; label: string }[]; value?: T; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-[13px] font-semibold text-es-ink-600">{step} · {label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const sel = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={sel}
              onClick={() => onChange(o.id)}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border px-3.5 text-sm font-semibold transition-colors duration-150",
                "focus-visible:border-es-royal-600 focus-visible:shadow-es-focus focus-visible:outline-none",
                sel ? "border-es-navy-900 bg-es-navy-900 text-white" : "border-[#D5DCE7] bg-white text-es-ink-900 hover:border-es-navy-900",
              )}
            >
              <AnimatePresence initial={false}>
                {sel && (
                  <motion.span initial={{ scale: 0.4, width: 0 }} animate={{ scale: 1, width: "auto" }} exit={{ scale: 0.4, width: 0 }}>
                    <Check className="size-3.5 text-es-turquoise-500" strokeWidth={2.5} aria-hidden />
                  </motion.span>
                )}
              </AnimatePresence>
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const BADGE: Record<KaynakTipi, { label: string; className: string; icon: React.ReactNode; cta: string }> = {
  arac: { label: "Sihirbaz hazırlar", className: "bg-es-turquoise-100 text-es-navy-900 border-transparent", icon: <Sparkles className="size-3" aria-hidden />, cta: "Şimdi hazırla" },
  imza: { label: "Islak imza · mühür", className: "bg-amber-50 text-amber-700 border-amber-200", icon: <TriangleAlert className="size-3" aria-hidden />, cta: "Şablonu aç" },
  dis: { label: "Dış kaynak", className: "bg-es-surface-50 text-es-ink-600 border-es-line", icon: <ExternalLink className="size-3" aria-hidden />, cta: "Kaynağa git" },
};

function ChecklistCard({ item, done, onToggle, reduce }: { item: Evrak; done: boolean; onToggle: () => void; reduce: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const b = BADGE[item.tip];
  const external = item.tip === "dis";

  return (
    <motion.li
      layout={!reduce}
      variants={{ hidden: { opacity: 0, y: reduce ? 0 : 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } } }}
      whileHover={reduce ? undefined : { y: -2 }}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border bg-white p-[18px] shadow-sm transition-shadow hover:shadow-es-card",
        done ? "border-green-200" : "border-es-line",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Animasyonlu onay kutusu */}
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`${done ? "İşareti kaldır" : "Tamamlandı olarak işaretle"}: ${item.ad}`}
          onClick={onToggle}
          className={cn(
            "-mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border-[1.5px] transition-colors duration-150",
            "focus-visible:shadow-es-focus focus-visible:outline-none",
            done ? "border-es-success-700 bg-es-success-700 text-white" : "border-es-ink-500 bg-white group-hover:border-es-royal-600",
          )}
        >
          <AnimatePresence initial={false}>
            {done && (
              <motion.span
                key="tick"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.15, 1], opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
              >
                <Check className="size-4" strokeWidth={2.5} aria-hidden />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h4 className="text-[15px] font-bold leading-[22px] text-es-ink-900">{item.ad}</h4>
          <span className={cn("text-xs font-bold", done ? "text-es-success-700" : item.tip === "imza" ? "text-amber-700" : "text-es-ink-500")}>
            {done ? "Tamamlandı" : item.tip === "imza" ? "İmza / mühür bekliyor" : "Bekliyor"}
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn("shrink-0 gap-1 rounded-full px-2 py-0.5 text-xs font-bold", b.className)}>
              {b.icon}{b.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-56 text-xs">
            {item.tip === "arac" && "Bu evrakı platformdaki araçla saniyeler içinde hazırlayabilirsiniz."}
            {item.tip === "imza" && "Çıktı aldıktan sonra ıslak imza ve okul mührü gerekir."}
            {item.tip === "dis" && "Bu belge platform dışındaki bir kurumdan veya sistemden alınır."}
          </TooltipContent>
        </Tooltip>
      </div>

      <p className="flex items-start gap-2 pl-10 text-[13px] leading-[19px] text-es-ink-600">
        <MapPin className="mt-0.5 size-[15px] shrink-0 text-es-steel-500" aria-hidden />
        <span><b className="text-es-ink-900">Nereden: </b>{item.nereden}</span>
      </p>

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* Radix Collapsible durumu yönetir; yükseklik animasyonunu framer-motion yapar */}
        <AnimatePresence initial={false}>
          {open && (
            <CollapsibleContent forceMount asChild>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="mb-3 ml-10 overflow-hidden"
              >
                <div className="rounded-xl border border-es-line bg-es-surface-50 px-3.5 py-3 text-[13px] leading-5 text-es-ink-900">
                  {item.neden}
                </div>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-between gap-2 pl-10">
          <div className="-ml-2.5 flex items-center">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5 text-[13px] font-bold text-es-navy-900">
                Neden gerekli?
                <ChevronDown className={cn("size-[15px] transition-transform duration-200", open && "rotate-180")} aria-hidden />
              </Button>
            </CollapsibleTrigger>
            <Button
              variant="ghost" size="icon" className="size-9 text-es-ink-500"
              aria-label={`${item.ad} için not ekle`} aria-expanded={noteOpen}
              onClick={() => setNoteOpen((v) => !v)}
            >
              <NotebookPen className="size-4" aria-hidden />
            </Button>
          </div>
          {item.href && (
            <a
              href={item.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-es-royal-600 hover:text-es-royal-700 hover:underline"
            >
              {b.cta}
              {external ? <ExternalLink className="size-3.5" aria-hidden /> : <ArrowRight className="size-3.5" aria-hidden />}
            </a>
          )}
        </div>
      </Collapsible>

      {noteOpen && <ItemNote storageKey={`es:note:${item.id}`} />}
    </motion.li>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-3 w-28 bg-es-line" />
          <Skeleton className="h-5 w-80 max-w-full bg-es-line" />
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-es-turquoise-100 px-3.5 py-2 text-[13px] font-bold text-es-navy-900">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Sihirbaz listenizi hazırlıyor…
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex min-h-[170px] flex-col gap-3 rounded-2xl border border-es-line p-[18px]">
            <div className="flex items-center gap-3">
              <Skeleton className="size-[26px] rounded-lg bg-es-line" />
              <Skeleton className="h-4 flex-1 bg-es-line" />
              <Skeleton className="h-[22px] w-24 rounded-full bg-es-line" />
            </div>
            <Skeleton className="h-3 w-[70%] bg-es-line" />
            <Skeleton className="h-3 w-1/2 bg-es-line" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ secim }: { secim: Secim }) {
  const steps = [
    { n: 1, label: "Okul türü", done: !!secim.okul },
    { n: 2, label: "Süreç", done: !!secim.surec },
    { n: 3, label: "Görev", done: !!secim.gorev },
  ];
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center gap-[18px] rounded-[20px] border-[1.5px] border-dashed border-[#D5DCE7] px-6 py-10 text-center">
      <span className="grid size-[72px] place-items-center rounded-full bg-es-turquoise-100 text-es-navy-900">
        <ClipboardList className="size-8" aria-hidden />
      </span>
      <div className="max-w-[420px]">
        <h3 className="font-display text-[22px] font-semibold leading-[30px] text-es-navy-900">Listeniz üç seçim uzağınızda</h3>
        <p className="mt-1.5 text-[15px] leading-6 text-es-ink-600">
          Okul türünüzü, sürecinizi ve görevinizi seçin. Üçüncü seçimde liste kendiliğinden oluşur.
        </p>
      </div>
      <ol className="flex flex-wrap justify-center gap-2.5">
        {steps.map((s) => (
          <li
            key={s.n}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border py-2 pl-2 pr-3.5 text-[13px] font-bold",
              s.done ? "border-green-200 bg-es-success-50 text-es-success-700" : "border-es-line bg-white text-es-ink-600",
            )}
          >
            <span className={cn("grid size-[22px] place-items-center rounded-full text-[11px] text-white", s.done ? "bg-es-success-700" : "bg-es-ink-300")}>
              {s.done ? <Check className="size-3" strokeWidth={2.5} aria-hidden /> : s.n}
            </span>
            {s.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero'daki 3'lü açılır seçici — aynı hook'u paylaşmak için bağlam ile */
/* kullanılabilir; burada bağımsız bir örnek:                          */
/* ------------------------------------------------------------------ */
export function HeroSelector({ value, onChange, onSubmit, busy }: {
  value: Secim; onChange: <K extends keyof Secim>(k: K, v: Secim[K]) => void; onSubmit: () => void; busy?: boolean;
}) {
  const [error, setError] = React.useState(false);
  const fields = [
    { k: "okul" as const, label: "Okul türü", opts: OKUL },
    { k: "surec" as const, label: "Süreç", opts: SUREC },
    { k: "gorev" as const, label: "Görev", opts: GOREV },
  ];
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!isComplete(value)) return setError(true); setError(false); onSubmit(); }}
      className="flex flex-col gap-2 rounded-[28px] border border-es-line bg-white p-2 shadow-es-lg"
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
        {fields.map((f, i) => (
          <label key={f.k} className="flex flex-col gap-1.5 rounded-[20px] bg-es-surface-50 p-3">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-es-ink-600">
              <span className="grid size-[18px] place-items-center rounded-full bg-es-navy-900 text-[11px] font-bold text-white">{i + 1}</span>
              {f.label}
            </span>
            <Select value={value[f.k] ?? ""} onValueChange={(v) => onChange(f.k, v as never)}>
              <SelectTrigger
                aria-invalid={error && !value[f.k]}
                className="h-11 rounded-xl border-es-ink-500 bg-white text-[15px] font-medium aria-[invalid=true]:border-es-error-600 aria-[invalid=true]:shadow-es-error"
              >
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {f.opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
        ))}
      </div>
      <Button type="submit" variant="magic" size="xl" disabled={busy}>
        {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Sparkles className="size-5 text-es-turquoise-100" aria-hidden />}
        {busy ? "Sihirbaz yazıyor…" : "Sihirli listeyi oluştur"}
      </Button>
      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-es-error-50 px-3 py-2.5 text-sm font-semibold text-es-error-600">
          <TriangleAlert className="size-4" aria-hidden /> Listeyi oluşturmak için üç alanı da seçin.
        </p>
      )}
    </form>
  );
}

export default WizardPanel;
