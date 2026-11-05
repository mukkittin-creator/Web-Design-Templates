"use client";
/**
 * SystemPages — 404 (NotFoundPage) ve Bakım Modu (MaintenancePage).
 * Next.js: app/not-found.tsx → <NotFoundPage />, bakım için middleware'den /bakim'a yönlendirip <MaintenancePage />.
 * Girişler: fade-in + slide-up (stagger). prefers-reduced-motion'da hareket kapanır.
 */
import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Bell, Check, Clock, Loader2, Mail, MessageCircle, Search, WandSparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.2, 0.9, 0.3, 1] as const;

function useStagger() {
  const reduce = useReducedMotion();
  const container: Variants = { show: { transition: { staggerChildren: reduce ? 0 : 0.06 } } };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };
  return { container, item, reduce };
}

/** Izgara + merkezde yumuşak radyal parıltı. tone: indigo (404) | amber (bakım) */
function GridCanvas({ tone, children }: { tone: "indigo" | "amber"; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#F8FAFC] font-sans text-[#0F172A] [background-image:linear-gradient(#E9EEF5_1px,transparent_1px),linear-gradient(90deg,#E9EEF5_1px,transparent_1px)] [background-size:48px_48px]">
      <div aria-hidden className={cn(
        "pointer-events-none absolute inset-0",
        tone === "indigo"
          ? "bg-[radial-gradient(ellipse_at_50%_30%,rgba(59,130,246,.10)_0%,transparent_32%),radial-gradient(ellipse_at_50%_30%,transparent_0%,transparent_38%,#F8FAFC_76%)]"
          : "bg-[radial-gradient(ellipse_at_50%_28%,rgba(245,158,11,.10)_0%,transparent_32%),radial-gradient(ellipse_at_50%_30%,transparent_0%,transparent_38%,#F8FAFC_76%)]",
      )} />
      {children}
    </div>
  );
}

const btnPrimary =
  "inline-flex min-h-[52px] items-center gap-2.5 rounded-xl bg-es-royal-600 px-[22px] text-[15px] font-bold text-white shadow-es-button transition-[background-color,box-shadow,transform] hover:-translate-y-px hover:bg-es-royal-700 active:translate-y-px active:scale-[.99] focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,.3)] focus-visible:outline-none";
const btnSecondary =
  "inline-flex min-h-[52px] items-center gap-2.5 rounded-xl border border-slate-300 bg-white/70 px-[22px] text-[15px] font-bold text-[#0F172A] transition-[border-color,background-color,transform] hover:-translate-y-px hover:border-es-navy-900 hover:bg-white active:translate-y-px focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,.3)] focus-visible:outline-none";

/* ============================== 404 ============================== */
export function NotFoundPage() {
  const { container, item, reduce } = useStagger();
  const [p, setP] = React.useState({ x: 0, y: 0 });

  return (
    <GridCanvas tone="indigo">
      <div
        className="relative flex flex-1 flex-col"
        onMouseMove={(e) => {
          if (reduce) return;
          const r = e.currentTarget.getBoundingClientRect();
          setP({ x: ((e.clientX - r.left) / r.width - 0.5) * 16, y: ((e.clientY - r.top) / r.height - 0.5) * 12 });
        }}
      >
        <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-8 py-6 max-sm:px-4">
          <Link href="/" aria-label="evraksihirbazi.com ana sayfa"><img src="/brand/evraksihirbazi-wordmark.png" alt="evraksihirbazi.com" className="h-[22px] w-auto" /></Link>
          <Link href="/giris" className="text-sm font-bold text-es-royal-600 hover:underline">Giriş yap</Link>
        </header>

        <motion.main variants={container} initial="hidden" animate="show"
          className="mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center gap-[22px] px-6 pb-14 pt-2 text-center">
          <motion.div variants={item} aria-hidden className="relative h-[300px] w-[460px] max-w-full">
            {/* Paralaks ayrı katmanda: kendi animate'i girişin variant'ını ezmesin */}
            <motion.div className="absolute inset-0" animate={{ x: p.x, y: p.y }} transition={{ type: "spring", stiffness: 80, damping: 18 }}>
              <MissingDocArt />
            </motion.div>
          </motion.div>
          <motion.span variants={item} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold tracking-wider text-es-royal-700">HATA 404</motion.span>
          <motion.h1 variants={item} className="font-display text-[44px] font-semibold leading-[52px] tracking-[-0.025em] max-sm:text-[32px] max-sm:leading-10">
            Aradığınız Sayfa Bulunamadı <span className="font-medium text-[#475569]">(Veya Süresi Doldu)</span>
          </motion.h1>
          <motion.p variants={item} className="max-w-[560px] text-lg leading-7 text-[#475569]">
            Gitmek istediğiniz sayfa taşınmış veya silinmiş olabilir. Endişelenmeyin, sihirbazımız hala burada.
          </motion.p>
          <motion.div variants={item} className="mt-1.5 flex flex-wrap justify-center gap-3">
            <Link href="/" className={cn(btnPrimary, "group")}>
              <ArrowLeft className="size-[18px] transition-transform group-hover:-translate-x-[3px]" aria-hidden /> Ana Sayfaya Dön
            </Link>
            <Link href="/#sihirbaz" className={btnSecondary}>
              <WandSparkles className="size-[18px] text-es-turquoise-500" aria-hidden /> Evrak Listeni Oluştur
            </Link>
          </motion.div>
          <motion.nav variants={item} aria-label="Popüler araçlar" className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-[13px] text-[#475569]">
            <span className="mr-1 font-semibold">Belki bunlardan birini arıyordunuz:</span>
            {[["Yıllık Plan", "/araclar/yillik-plan"], ["Sınav Kağıdı", "/araclar/sinav-kagidi"], ["Zümre Tutanağı", "/sablonlar/zumre"], ["Sınav Analizi", "/araclar/sinav-analizi"]].map(([l, h]) => (
              <Link key={h} href={h} className="inline-flex min-h-[34px] items-center rounded-full border border-slate-200 bg-white/60 px-3 font-semibold transition-colors hover:border-es-navy-900 hover:bg-white hover:text-es-navy-900">{l}</Link>
            ))}
          </motion.nav>
        </motion.main>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.45 } }} className="px-6 pb-8 text-center text-[13px] text-[#475569]">
          Bir hata olduğunu mu düşünüyorsunuz? <Link href="/destek?konu=404" className="font-bold text-es-royal-600 hover:underline">Bize bildirin.</Link>
        </motion.footer>
      </div>
    </GridCanvas>
  );
}

function MissingDocArt() {
  const paper = "absolute rounded-lg border border-slate-200 bg-white/75 shadow-[0_10px_24px_-8px_rgba(15,30,54,.2)] backdrop-blur-sm";
  return (
    <>
      <div className="absolute inset-0 grid select-none place-items-center font-display text-[200px] font-bold leading-none tracking-[-0.06em] text-es-royal-600/[.08] [text-shadow:0_0_60px_rgba(59,130,246,.25)]">404</div>
      <motion.div className={cn(paper, "left-[34px] top-[52px] h-[112px] w-[86px]")} animate={{ x: [0, -10, 0], y: [0, -16, 0], rotate: [-14, -8, -14] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className={cn(paper, "right-[30px] top-[30px] h-24 w-[74px]")} animate={{ x: [0, 12, 0], y: [0, -12, 0], rotate: [12, 18, 12] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className={cn(paper, "bottom-[18px] right-[70px] h-20 w-[62px]")} animate={{ y: [0, -20, 0], rotate: [-4, 4, -4] }} transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div
        className="absolute left-1/2 top-1/2 -ml-[84px] -mt-28 h-56 w-[168px] overflow-hidden rounded-2xl border-[1.5px] border-dashed border-blue-300 bg-white/60 shadow-[0_24px_48px_-16px_rgba(37,99,235,.3)] backdrop-blur-md"
        animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.span className="absolute inset-x-0 h-0.5 bg-es-royal-500 shadow-[0_0_12px_2px_rgba(59,130,246,.55)]"
          animate={{ top: ["14%", "80%"] }} transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: [0.4, 0, 0.2, 1] }} />
        <span className="absolute left-1/2 top-1/2 -ml-[30px] -mt-[30px] grid size-[60px] place-items-center rounded-full border border-blue-100 bg-white text-es-royal-600 shadow-[0_8px_20px_-6px_rgba(37,99,235,.4)]">
          <Search className="size-7" />
        </span>
        <span className="absolute inset-x-0 bottom-[18px] text-[11px] font-bold tracking-[.06em] text-es-royal-600">EVRAK ARANIYOR…</span>
      </motion.div>
    </>
  );
}

/* ============================== BAKIM ============================== */
export interface MaintenancePageProps {
  /** 0–100; sunucudan gelen gerçek ilerleme */
  progress: number;
  /** "15 Dakika İçinde" gibi; sunucudan */
  eta: string;
  steps: { label: string; state: "done" | "active" | "todo" }[];
  onNotify: (email: string) => Promise<void>;
  whatsappHref: string; // "https://wa.me/90XXXXXXXXXX"
  supportEmail: string;
}

export function MaintenancePage({ progress, eta, steps, onNotify, whatsappHref, supportEmail }: MaintenancePageProps) {
  const { container, item, reduce } = useStagger();
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle" | "bad" | "loading" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setState("bad");
    setState("loading");
    try { await onNotify(email.trim()); setState("done"); } catch { setState("bad"); }
  }

  return (
    <GridCanvas tone="amber">
      <header className="relative mx-auto flex w-full max-w-[1200px] items-center justify-between px-8 py-6 max-sm:px-4">
        <img src="/brand/evraksihirbazi-wordmark.png" alt="evraksihirbazi.com" className="h-[22px] w-auto" />
        <span role="status" className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 py-1.5 pl-2.5 pr-3 text-xs font-bold text-amber-700">
          <span className="relative size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-amber-500 motion-reduce:animate-none" />
            <span className="absolute inset-0 rounded-full bg-amber-500" />
          </span>
          Sistem Güncelleniyor
        </span>
      </header>

      <motion.main variants={container} initial="hidden" animate="show"
        className="relative mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center gap-5 px-6 pb-12 text-center">
        <motion.div variants={item} aria-hidden className="relative h-[250px] w-[520px] max-w-full">
          <AssemblyLineArt reduce={!!reduce} />
        </motion.div>
        <motion.h1 variants={item} className="font-display text-[44px] font-semibold leading-[52px] tracking-[-0.025em] max-sm:text-[32px] max-sm:leading-10">
          Daha Güçlü Bir Sihirbaz İçin Güncelleniyoruz
        </motion.h1>
        <motion.p variants={item} className="max-w-[540px] text-lg leading-7 text-[#475569]">
          Evrak süreçlerinizi daha da hızlandıracak yeni özellikler ekliyoruz. Çok yakında buradayız.
        </motion.p>

        <motion.section variants={item} aria-label="Güncelleme durumu"
          className="flex w-full max-w-[520px] flex-col gap-3.5 rounded-[18px] border border-slate-200 bg-white/80 p-5 text-left shadow-[0_10px_24px_-10px_rgba(15,30,54,.18)] backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-3 py-1.5 text-[13px] font-bold text-white">
              <Clock className="size-[15px] text-amber-300" aria-hidden /> Tahmini Tamamlanma: {eta}
            </span>
            <span className="font-mono text-sm font-semibold">%{progress}</span>
          </div>
          <div role="progressbar" aria-label="Güncelleme ilerlemesi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div className="h-full rounded-full bg-amber-500 [background-image:linear-gradient(135deg,rgba(255,255,255,.28)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.28)_50%,rgba(255,255,255,.28)_75%,transparent_75%)] [background-size:28px_28px]"
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: EASE }} />
          </div>
          <ol className="flex flex-col gap-2 text-[13px] font-semibold">
            {steps.map((s) => (
              <li key={s.label} className={cn("flex items-center gap-2.5", s.state === "todo" && "text-[#475569]")}>
                {s.state === "done" && <span className="grid size-5 place-items-center rounded-full bg-es-success-700 text-white"><Check className="size-[11px]" strokeWidth={2.5} aria-hidden /></span>}
                {s.state === "active" && <span className="grid size-5 place-items-center rounded-full border-[1.5px] border-amber-500 bg-amber-50 text-amber-700"><Loader2 className="size-[11px] animate-spin" aria-hidden /></span>}
                {s.state === "todo" && <span className="size-5 rounded-full border-[1.5px] border-slate-300" />}
                {s.label}
                <span className={cn("ml-auto text-xs font-bold", s.state === "done" ? "text-es-success-700" : s.state === "active" ? "text-amber-700" : "text-slate-500")}>
                  {s.state === "done" ? "Tamam" : s.state === "active" ? "Sürüyor" : "Sırada"}
                </span>
              </li>
            ))}
          </ol>
        </motion.section>

        <motion.div variants={item} className="flex w-full max-w-[520px] flex-col gap-2">
          {state === "done" ? (
            <motion.div role="status" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-2xl border border-green-200 bg-es-success-50 px-4 py-3.5 text-left text-sm">
              <motion.span initial={{ scale: 0.5 }} animate={{ scale: [0.5, 1.15, 1] }} className="grid size-8 shrink-0 place-items-center rounded-full bg-es-success-700 text-white">
                <Check className="size-4" strokeWidth={2.5} aria-hidden />
              </motion.span>
              <span><b>Listeye eklendiniz.</b> Sihirbaz açılır açılmaz <b>{email}</b> adresine haber vereceğiz.</span>
            </motion.div>
          ) : (
            <>
              <form noValidate onSubmit={submit}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border bg-white py-1.5 pl-4 pr-1.5 shadow-[0_10px_24px_-10px_rgba(15,30,54,.18)] transition-[border-color,box-shadow]",
                  "focus-within:border-es-royal-600 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,.18)] max-sm:flex-wrap max-sm:pl-3",
                  state === "bad" ? "border-es-error-600 shadow-es-error" : "border-slate-300",
                )}>
                <Mail className="size-[18px] text-slate-500" aria-hidden />
                <label htmlFor="notify-email" className="sr-only">E-posta adresiniz</label>
                <input id="notify-email" type="email" autoComplete="email" placeholder="ornek@okul.k12.tr" value={email}
                  aria-invalid={state === "bad"} aria-describedby="notify-help"
                  onChange={(e) => { setEmail(e.target.value); if (state === "bad") setState("idle"); }}
                  className="h-11 min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-slate-400" />
                <button type="submit" disabled={state === "loading"} aria-busy={state === "loading"}
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[11px] bg-es-royal-600 px-4 text-sm font-bold text-white transition-[background-color,transform] hover:bg-es-royal-700 active:scale-[.98] disabled:cursor-progress focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,.3)] focus-visible:outline-none max-sm:w-full max-sm:justify-center">
                  {state === "loading" ? <><Loader2 className="size-4 animate-spin" aria-hidden />Kaydediliyor</> : <><Bell className="size-4" aria-hidden />Açıldığında E-posta ile Haber Ver</>}
                </button>
              </form>
              <p id="notify-help" role={state === "bad" ? "alert" : undefined}
                className={cn("pl-1 text-left text-xs", state === "bad" ? "text-[13px] font-semibold text-es-error-600" : "text-slate-500")}>
                {state === "bad" ? "Geçerli bir e-posta adresi girin." : "Yalnızca bu bildirim için kullanılır; tek bir e-posta gönderilir."}
              </p>
            </>
          )}
        </motion.div>

        <motion.div variants={item} className="mt-1 flex flex-wrap justify-center gap-2.5">
          {[
            { href: whatsappHref, icon: <MessageCircle className="size-[18px] text-es-success-700" aria-hidden />, label: "Acil Destek Hattı", ext: true },
            { href: `mailto:${supportEmail}`, icon: <Mail className="size-[18px] text-es-royal-600" aria-hidden />, label: supportEmail, ext: false },
          ].map((l) => (
            <a key={l.label} href={l.href} {...(l.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-white/60 px-4 text-sm font-bold transition-[border-color,background-color,transform] hover:-translate-y-px hover:border-es-navy-900 hover:bg-white focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,.3)] focus-visible:outline-none">
              {l.icon}{l.label}<ArrowRight className="size-4 text-slate-500 transition-transform group-hover:translate-x-[3px]" aria-hidden />
            </a>
          ))}
        </motion.div>
      </motion.main>

      <footer className="relative px-6 pb-7 text-center text-xs text-slate-500">Kaydettiğiniz evraklar ve ayarlarınız güncelleme sırasında korunur.</footer>
    </GridCanvas>
  );
}

function AssemblyLineArt({ reduce }: { reduce: boolean }) {
  const docs = Array.from({ length: 16 }, (_, i) => i % 3 === 2);
  return (
    <>
      <div className="absolute inset-x-0 bottom-[34px] h-[54px] overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
        <motion.div className="flex w-max gap-[34px] pt-1" animate={reduce ? undefined : { x: ["0%", "-50%"] }} transition={{ duration: 9, repeat: Infinity, ease: "linear" }}>
          {docs.map((blue, i) => (
            <span key={i} className={cn("h-[46px] w-9 rounded-md border", blue ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white shadow-[0_6px_14px_-6px_rgba(15,30,54,.2)]")} />
          ))}
        </motion.div>
      </div>
      <span className="absolute inset-x-[8%] bottom-[30px] h-1 rounded bg-slate-200" />
      {[0, 1.3].map((d) => (
        <motion.span key={d} className="absolute left-1/2 top-[22px] -ml-[95px] size-[190px] rounded-full border-2 border-amber-500"
          initial={{ scale: 0.9, opacity: 0.55 }} animate={reduce ? undefined : { scale: 1.35, opacity: 0 }} transition={{ duration: 2.6, delay: d, repeat: Infinity, ease: "easeOut" }} />
      ))}
      <div className="absolute left-1/2 top-10 -ml-[78px] flex size-[156px] flex-col justify-center gap-2.5 rounded-[32px] border border-white bg-white/70 p-[22px] shadow-[0_1px_0_#E2E8F0,0_24px_48px_-16px_rgba(15,30,54,.3)] backdrop-blur-md">
        {[["bg-amber-500", "bg-es-turquoise-500"], ["bg-es-success-500", "bg-es-turquoise-500"], ["bg-amber-500", "bg-white/30"]].map(([a, b], i) => (
          <div key={i} className={cn("flex h-[30px] items-center gap-2 rounded-lg px-2.5", i === 2 ? "bg-es-navy-800" : "bg-es-navy-900")}>
            <span className={cn("size-1.5 rounded-full motion-safe:animate-pulse", a)} />
            <span className={cn("size-1.5 rounded-full", b)} />
            <span className="h-[3px] flex-1 rounded bg-white/20" />
          </div>
        ))}
      </div>
    </>
  );
}

export default NotFoundPage;
