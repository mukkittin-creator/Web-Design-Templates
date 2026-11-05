"use client";
/**
 * EvrakV2.tsx — v2 arayüzü. Tüm iş mantığı dossier.ts'te; burada yalnızca görünüm var.
 *
 *  <Ekran>      : taban iskelet (KALITIM). Sihirbaz, Giriş, 404 ve Bakım hepsi bunu kullanır.
 *  <EvrakSatiri>: tek satır bileşeni; hangi evrak türü olduğunu BİLMEZ,
 *                 yalnızca evrak.etiket() ve dosya.yap() çağırır (ÇOK BİÇİMLİLİK + SOYUTLAMA).
 *  useDosya()   : Dosya sınıfının salt-okunur görüntüsüne abone olur (KAPSÜLLEME).
 *
 * Gerekenler: React 18+, framer-motion, lucide-react, Tailwind (tailwind-tokens.ts).
 */
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Loader2, WandSparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dosya, katalog, type Durum, type Evrak, type Gorev, type Servisler, type Surec } from "./dossier";

const EASE = [0.2, 0.9, 0.3, 1] as const;

/* ============================ TABAN İSKELET ============================ */
export interface EkranProps {
  ust?: React.ReactNode;          // başlığın üstündeki küçük satır (adım, özet)
  simge?: React.ReactNode;
  baslik: string;                 // en fazla 6 kelime
  cumle?: string;                 // tek cümle
  children?: React.ReactNode;     // içerik (alanlar, liste)
  birincil?: React.ReactNode;     // ekranda TEK birincil düğme
  baglanti?: React.ReactNode;     // tek ikincil bağlantı
}

export function Ekran({ ust, simge, baslik, cumle, children, birincil, baglanti }: EkranProps) {
  const reduce = useReducedMotion();
  return (
    <div className="flex min-h-dvh flex-col bg-[#F7F9FC] font-sans text-[17px] leading-[26px] text-slate-900">
      <header className="mx-auto flex w-full max-w-[760px] items-center justify-between px-5 py-6">
        <img src="/brand/evraksihirbazi-wordmark.png" alt="evraksihirbazi.com" className="h-5 w-auto" />
        <a href="/giris" className="inline-flex min-h-11 items-center rounded-xl px-3.5 text-[15px] font-bold text-es-navy-900 hover:bg-slate-100">Giriş yap</a>
      </header>
      <motion.main
        initial={{ opacity: 0, y: reduce ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}
        className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-6 px-5 pb-20 pt-6"
      >
        <div className="flex flex-col gap-2.5">
          {ust && <div className="text-[15px] font-semibold text-slate-600">{ust}</div>}
          {simge && <span className="mb-2 grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-700">{simge}</span>}
          <h1 className="font-display text-[40px] font-semibold leading-[48px] tracking-[-0.02em] max-sm:text-[30px] max-sm:leading-9">{baslik}</h1>
          {cumle && <p className="text-slate-600">{cumle}</p>}
        </div>
        {children}
        {birincil}
        {baglanti && <div className="text-center">{baglanti}</div>}
      </motion.main>
      <footer className="mx-auto flex w-full max-w-[760px] flex-wrap gap-x-[18px] gap-y-1.5 px-5 pb-7 text-sm text-slate-600">
        <span>MEB ile bağlantılı değildir</span><a href="/kvkk">KVKK</a><a href="/gizlilik">Gizlilik</a><a href="/yardim">Yardım</a>
      </footer>
    </div>
  );
}

export function BirincilDugme({ children, mesgul, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { mesgul?: boolean }) {
  return (
    <button
      type="button" disabled={mesgul || rest.disabled} aria-busy={mesgul} {...rest}
      className="flex min-h-[68px] items-center justify-center gap-3 rounded-[18px] bg-blue-600 text-[19px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-[background-color,transform] hover:bg-blue-700 active:scale-[.99] disabled:cursor-progress focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-blue-300 max-sm:min-h-[60px] max-sm:text-lg"
    >
      {mesgul ? <Loader2 className="size-[22px] animate-spin" aria-hidden /> : <WandSparkles className="size-[22px]" aria-hidden />}
      {children}
    </button>
  );
}

/* ============================ KAPSÜLLÜ DURUM ============================ */
function useDosya(dosya: Dosya) {
  return React.useSyncExternalStore((cb) => dosya.abone(cb), () => dosya.goruntu, () => dosya.goruntu);
}

/* ============================ SİHİRBAZ ============================ */
const SUREC: [Surec, string, string][] = [
  ["donembasi", "Dönem başı", "Yıllık plan, tutanaklar"],
  ["sinav", "Yazılı sınav", "Sınav kağıdı, analiz"],
  ["bep", "BEP / Kaynaştırma", "BEP planı, formlar"],
  ["donemsonu", "Dönem sonu", "Karne, takdir, tutanaklar"],
];
const GOREV: [Gorev, string][] = [["brans", "Branş öğretmeni"], ["sinif", "Sınıf öğretmeni"], ["rehber", "Sınıf rehber öğretmeni"], ["zumre", "Zümre başkanı"]];

export interface SihirbazProps {
  servis: Servisler;
  /** Geri dönen öğretmen: kayıtlı seçim ve durumlarla doğrudan listeye gelir */
  kayitli?: { surec: Surec; gorev: Gorev; durum: Record<string, Durum> };
  onKaydet?: (v: { surec: Surec; gorev: Gorev; durum: Record<string, Durum> }) => void;
}

export function Sihirbaz({ servis, kayitli, onKaydet }: SihirbazProps) {
  const [surec, setSurec] = React.useState<Surec | null>(kayitli?.surec ?? null);
  const [gorev, setGorev] = React.useState<Gorev | null>(kayitli?.gorev ?? null);

  if (!surec)
    return (
      <Ekran ust="Adım 1 / 2" baslik="Hangi evrak işini bitirelim?" baglanti={<span className="text-[15px] text-slate-600">Kayıt gerekmez. Verileriniz bu tarayıcıda kalır.</span>}>
        <Karolar>
          {SUREC.map(([id, ad, ipucu], i) => (
            <Karo key={id} onClick={() => setSurec(id)}>
              <span className="grid size-[52px] shrink-0 place-items-center rounded-[14px] bg-blue-50 font-display text-xl font-semibold text-blue-700">{i + 1}</span>
              <span className="flex flex-col"><span className="text-[19px] font-bold">{ad}</span><span className="text-[15px] text-slate-600">{ipucu}</span></span>
            </Karo>
          ))}
        </Karolar>
      </Ekran>
    );

  if (!gorev)
    return (
      <Ekran
        ust={<button type="button" onClick={() => setSurec(null)} className="-ml-2.5 inline-flex min-h-10 items-center gap-1.5 rounded-[10px] px-2.5 font-bold hover:bg-slate-100"><ArrowLeft className="size-[18px]" aria-hidden />Adım 2 / 2 · {SUREC.find((s) => s[0] === surec)?.[1]}</button>}
        baslik="Göreviniz ne?"
      >
        <Karolar>
          {GOREV.map(([id, ad]) => (
            <Karo key={id} onClick={() => setGorev(id)} className="justify-between text-[19px] font-bold">
              {ad}<ArrowRight className="size-[22px] text-slate-400" aria-hidden />
            </Karo>
          ))}
        </Karolar>
      </Ekran>
    );

  return (
    <Liste
      key={`${surec}-${gorev}`}
      surec={surec} gorev={gorev} servis={servis}
      baslangic={kayitli && kayitli.surec === surec && kayitli.gorev === gorev ? kayitli.durum : {}}
      onDegistir={() => { setSurec(null); setGorev(null); }}
      onKaydet={onKaydet}
    />
  );
}

function Karolar({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-3.5">{children}</div>;
}
function Karo({ className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest}
      className={cn("flex min-h-[88px] items-center gap-4 rounded-[18px] border-[1.5px] border-slate-200 bg-white p-5 text-left shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-es-navy-900 hover:shadow-[0_10px_24px_-12px_rgba(15,30,54,.35)] active:scale-[.99] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-blue-300", className)} />
  );
}

function Liste({ surec, gorev, servis, baslangic, onDegistir, onKaydet }: {
  surec: Surec; gorev: Gorev; servis: Servisler; baslangic: Record<string, Durum>;
  onDegistir: () => void; onKaydet?: SihirbazProps["onKaydet"];
}) {
  const dosya = React.useMemo(() => new Dosya(katalog(surec, gorev), servis, baslangic), [surec, gorev]); // eslint-disable-line react-hooks/exhaustive-deps
  const g = useDosya(dosya);
  const [yardim, setYardim] = React.useState<string | null>(null);

  React.useEffect(() => { onKaydet?.({ surec, gorev, durum: { ...g.durum } }); }, [g.durum]); // eslint-disable-line react-hooks/exhaustive-deps

  const hepsi = g.eksik === 0;
  const digerKalan = g.eksik - g.topluKalan;

  return (
    <Ekran
      ust={<>{SUREC.find((s) => s[0] === surec)?.[1]} · {GOREV.find((x) => x[0] === gorev)?.[1]}
        <button type="button" onClick={onDegistir} className="ml-2 min-h-9 rounded-lg px-2 font-bold text-blue-700 hover:bg-slate-100">Değiştir</button></>}
      baslik={hepsi ? "Hepsi hazır." : `${g.eksik} evrak eksik.`}
      birincil={null}
    >
      <div role="progressbar" aria-label="Dosyanın hazır olma oranı" aria-valuemin={0} aria-valuemax={100} aria-valuenow={g.yuzde} className="-mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <motion.div className={cn("h-full rounded-full", hepsi ? "bg-green-700" : "bg-blue-600")} animate={{ width: `${g.yuzde}%` }} transition={{ duration: 0.5, ease: EASE }} />
      </div>

      {g.topluKalan > 0 && (
        <div className="flex flex-col gap-2.5">
          <BirincilDugme mesgul={g.topluMesgul} onClick={() => dosya.hepsiniHazirla()}>
            {g.topluMesgul ? "Hazırlanıyor…" : g.topluKalan === 1 ? "Bu evrakı tek tıkla hazırla" : `${g.topluKalan} evrakı tek tıkla hazırla`}
          </BirincilDugme>
          {digerKalan > 0 && <p className="text-center text-[15px] text-slate-600">Kalan {digerKalan} evrak imza veya e-Okul ister; aşağıdan tek düğmeyle ilerleyin.</p>}
        </div>
      )}
      {hepsi && (
        <div role="status" className="flex items-center gap-3.5 rounded-[18px] border border-green-200 bg-green-50 px-5 py-[18px]">
          <span className="grid size-10 place-items-center rounded-full bg-green-700 text-white"><Check className="size-5" strokeWidth={2.6} aria-hidden /></span>
          <span><b>Dosyanız tamam.</b> Gerisi sizin zamanınız.</span>
        </div>
      )}

      <ul aria-label="Evraklar" className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
        {g.evraklar.map((e, i) => (
          <EvrakSatiri
            key={e.id} evrak={e} durum={g.durum[e.id] ?? "bekliyor"} mesgul={g.mesgul.has(e.id)} ilk={i === 0}
            yardimAcik={yardim === e.id} onYardim={() => setYardim(yardim === e.id ? null : e.id)}
            onYap={() => dosya.yap(e.id)} onIsaretle={() => dosya.isaretle(e.id)}
          />
        ))}
      </ul>
      <p className="text-sm text-slate-600">Liste bir rehberdir; okulunuzun uygulaması farklı olabilir.</p>

      <AnimatePresence>
        {g.bildirim && (
          <motion.div role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 z-20 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-4 rounded-[14px] bg-slate-900 py-3 pl-[18px] pr-3 text-[15px] text-white shadow-[0_16px_32px_-12px_rgba(15,23,42,.5)]">
            <span>{g.bildirim.mesaj}</span>
            {g.bildirim.geriAlinabilir && (
              <button type="button" onClick={() => dosya.geriAl()} className="min-h-10 rounded-[10px] bg-white/10 px-3 font-bold hover:bg-white/20">Geri al</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Ekran>
  );
}

/* ====================== ÇOK BİÇİMLİ SATIR ====================== */
function EvrakSatiri({ evrak, durum, mesgul, ilk, yardimAcik, onYardim, onYap, onIsaretle }: {
  evrak: Evrak; durum: Durum; mesgul: boolean; ilk: boolean; yardimAcik: boolean;
  onYardim: () => void; onYap: () => void; onIsaretle: () => void;
}) {
  const hazir = durum === "hazir", arada = durum === "arada";
  return (
    <li className={cn("flex items-center gap-3.5 px-[18px] py-4", !ilk && "border-t border-slate-100")}>
      <button type="button" onClick={onIsaretle} aria-pressed={hazir} aria-label={`${hazir ? "İşareti kaldır" : "Hazır olarak işaretle"}: ${evrak.ad}`}
        className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors hover:border-es-navy-900",
          hazir ? "border-green-700 bg-green-700 text-white" : arada ? "border-amber-600 bg-white" : "border-slate-300 bg-white")}>
        {hazir && <motion.span initial={{ scale: 0.5 }} animate={{ scale: [0.5, 1.15, 1] }}><Check className="size-4" strokeWidth={2.6} aria-hidden /></motion.span>}
        {arada && <span className="size-2.5 rounded-full bg-amber-600" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className={cn("font-bold", hazir ? "text-slate-500" : "text-slate-900")}>{evrak.ad}</span>
          <button type="button" onClick={onYardim} aria-expanded={yardimAcik} aria-label={`${evrak.ad}: neden gerekli, nereden alınır?`}
            className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <CircleHelp className="size-[18px]" aria-hidden />
          </button>
        </div>
        {arada && <span className="text-[15px] font-semibold text-amber-700">{evrak.araMetni()}</span>}
        {yardimAcik && <p className="mt-1.5 text-[15px] leading-[23px] text-slate-700">{evrak.neden} <span className="text-slate-600">Nereden: {evrak.nereden}.</span></p>}
      </div>
      {hazir ? (
        <span className="min-w-[120px] shrink-0 text-center font-bold text-green-700">Hazır</span>
      ) : (
        <button type="button" onClick={onYap} disabled={mesgul} aria-busy={mesgul}
          className="inline-flex min-h-12 min-w-[120px] shrink-0 items-center justify-center rounded-xl border-[1.5px] border-slate-300 bg-white px-4 text-base font-bold transition-[border-color,background-color,transform] hover:border-es-navy-900 hover:bg-[#F7F9FC] active:scale-[.98] disabled:cursor-progress max-sm:min-w-0">
          {mesgul ? <Loader2 className="size-[18px] animate-spin" aria-label="İşleniyor" /> : evrak.etiket(durum) /* ← çok biçimli metin */}
        </button>
      )}
    </li>
  );
}

export default Sihirbaz;
