"use client";
/**
 * AuthFlow — Birleşik giriş / kayıt / e-posta kodu akışı (60/40 bölünmüş ekran).
 *
 * Adımlar: "form" → "otp" → "success". Sayfa yenilenmez; geçişler framer-motion ile kayar.
 * Sekme sırası DOM sırasıdır: sekme anahtarı → Google → Apple → alanlar → gönder → yasal bağlantılar.
 * 960px altında sol güven paneli gizlenir, form nokta ızgaralı zeminde yüzen cam karta dönüşür.
 *
 * Arka uç sözleşmesi (eski Login bileşeniyle aynı isimler):
 *   onLogin({email,password,remember})  → Promise<void>   (sunucu kodu e-postaya gönderir)
 *   onSignup({name,email,password})     → Promise<void>
 *   onVerifyCode({email,code})          → Promise<boolean>
 *   onResendCode(email)                 → Promise<void>
 *   onSuccess()                         → yönlendirme
 *   onSocial("google" | "apple")
 */
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, ExternalLink, Loader2, Lock, Mail, MailCheck, ShieldCheck, User, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingField } from "./FloatingField";
import { OtpInput, useCountdown, type OtpStatus } from "./OtpInput";

type Mode = "login" | "signup";
type Step = "form" | "otp" | "success";

export interface AuthFlowProps {
  /** Tanınan cihazda { requiresVerification: false } döndürün → kod adımı atlanır */
  onLogin: (d: { email: string; password: string; remember: boolean }) => Promise<{ requiresVerification?: boolean } | void>;
  onSignup: (d: { name: string; email: string; password: string }) => Promise<void>;
  onVerifyCode: (d: { email: string; code: string }) => Promise<boolean>;
  onResendCode: (email: string) => Promise<void>;
  onSuccess: () => void;
  onSocial?: (p: "google" | "apple") => void;
  resendSeconds?: number; // varsayılan 45 → "00:45" (sabırsız kullanıcı için kısa tutuldu)
  /** Resmî marka varlıkları (Google / Apple yönergelerine uygun SVG) */
  googleLogo?: React.ReactNode;
  appleLogo?: React.ReactNode;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EASE = [0.2, 0.9, 0.3, 1] as const;

export function AuthFlow(props: AuthFlowProps) {
  const [step, setStep] = React.useState<Step>("form");
  const [dir, setDir] = React.useState<1 | -1>(1);
  const [email, setEmail] = React.useState("");

  const go = (s: Step, d: 1 | -1 = 1) => { setDir(d); setStep(s); };

  return (
    <div className="flex min-h-dvh bg-white font-sans text-es-ink-900 max-[960px]:bg-es-page-bg max-[960px]:bg-[radial-gradient(#C3CEDF_1px,transparent_1.2px)] max-[960px]:[background-size:22px_22px] max-[960px]:px-4 max-[960px]:py-6">
      <TrustPanel />
      <main className="flex min-w-0 flex-[2_1_0] flex-col justify-center px-14 py-12 max-[960px]:mx-auto max-[960px]:w-full max-[960px]:max-w-[460px] max-[960px]:flex-none max-[960px]:self-center max-[960px]:rounded-3xl max-[960px]:border max-[960px]:border-white max-[960px]:bg-white/85 max-[960px]:px-5 max-[960px]:py-7 max-[960px]:shadow-[0_24px_48px_-16px_rgba(15,30,54,.28)] max-[960px]:backdrop-blur-xl lg:min-w-[420px]">
        <div className="mx-auto w-full max-w-[400px]">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            {step === "form" && (
              <Slide key="form" dir={dir}>
                <AuthForm {...props} onSent={(e, needsCode) => { setEmail(e); go(needsCode ? "otp" : "success"); }} />
              </Slide>
            )}
            {step === "otp" && (
              <Slide key="otp" dir={dir}>
                <OtpStep {...props} email={email} onBack={() => go("form", -1)} onVerified={() => go("success")} />
              </Slide>
            )}
            {step === "success" && (
              <Slide key="success" dir={dir}>
                <SuccessStep onSuccess={props.onSuccess} />
              </Slide>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function Slide({ dir, children }: { dir: 1 | -1; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const x = reduce ? 0 : 28 * dir;
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.38, ease: EASE } }}
      exit={{ opacity: 0, x: -x, transition: { duration: 0.18 } }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------ FORM ------------------------------ */
function AuthForm({ onLogin, onSignup, onSocial, googleLogo, appleLogo, onSent }: AuthFlowProps & { onSent: (email: string, needsCode: boolean) => void }) {
  const [mode, setMode] = React.useState<Mode>("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [kvkk, setKvkk] = React.useState(false);
  const [err, setErr] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const isLogin = mode === "login";

  const clear = (k: string) => setErr(({ [k]: _, ...rest }) => rest);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n: Record<string, string> = {};
    if (!isLogin && !name.trim()) n.name = "Ad soyad, evraklardaki imza alanında kullanılır.";
    if (!EMAIL_RE.test(email.trim())) n.email = "Geçerli bir e-posta adresi girin (ör. ad@okul.k12.tr).";
    if (password.length < 8) n.password = isLogin ? "Şifreniz en az 8 karakterden oluşur." : "Şifre en az 8 karakter olmalı.";
    if (!isLogin && !kvkk) n.kvkk = "Devam etmek için aydınlatma metnini onaylayın.";
    setErr(n);
    if (Object.keys(n).length) {
      document.getElementById(`auth-${Object.keys(n)[0]}`)?.focus();
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const r = await onLogin({ email: email.trim(), password, remember });
        onSent(email.trim(), r?.requiresVerification !== false);
      } else {
        await onSignup({ name: name.trim(), email: email.trim(), password });
        onSent(email.trim(), true);
      }
    } catch (x) {
      setErr({ email: x instanceof Error ? x.message : "Bir şeyler ters gitti. Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <header className="flex flex-col gap-1.5">
        <img src="/brand/evraksihirbazi-mark.png" alt="" className="mb-2.5 size-[52px] object-contain" />
        <h1 className="font-display text-[28px] font-semibold leading-9 tracking-[-0.02em] text-es-navy-900">
          {isLogin ? "Yeniden Merhaba!" : "Hesabınızı oluşturun"}
        </h1>
        <p className="text-[15px] leading-[23px] text-es-ink-600">
          {isLogin ? "Kaldığınız yerden devam etmek için giriş yapın." : "Okul bilgileriniz her evraka otomatik işlensin."}
        </p>
      </header>

      {/* Sekme anahtarı — sayfa yenilemeden */}
      <div role="tablist" aria-label="Hesap" className="relative grid grid-cols-2 rounded-xl border border-es-line bg-slate-100 p-1">
        <motion.span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-[9px] bg-white shadow-[0_1px_2px_rgba(15,30,54,.08),0_2px_6px_-2px_rgba(15,30,54,.14)]"
          animate={{ x: isLogin ? "0%" : "100%" }}
          transition={{ duration: 0.25, ease: EASE }}
        />
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setErr({}); }}
            className={cn(
              "relative min-h-10 rounded-[9px] text-sm font-bold transition-colors focus-visible:shadow-es-focus focus-visible:outline-none",
              mode === m ? "text-es-navy-900" : "text-es-ink-500 hover:text-es-ink-900",
            )}
          >
            {m === "login" ? "Giriş Yap" : "Hesap Oluştur"}
          </button>
        ))}
      </div>

      {/* Sosyal giriş */}
      <div className="grid grid-cols-2 gap-3">
        {([["google", "Google", googleLogo], ["apple", "Apple", appleLogo]] as const).map(([id, label, logo]) => (
          <button
            key={id}
            type="button"
            onClick={() => onSocial?.(id)}
            className="flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold transition-[border-color,background-color,transform] hover:border-slate-400 hover:bg-es-surface-50 active:translate-y-px focus-visible:border-es-royal-600 focus-visible:shadow-es-focus focus-visible:outline-none"
          >
            <span className="grid size-5 place-items-center" aria-hidden>{logo}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs font-semibold text-es-ink-500">
        <span className="h-px flex-1 bg-slate-200" /> VEYA E-POSTA İLE <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form noValidate onSubmit={submit} className="flex flex-col gap-3.5">
        <AnimatePresence initial={false}>
          {!isLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: EASE }}>
              <FloatingField id="auth-name" label="Ad Soyad" icon={<User />} autoComplete="name" value={name}
                onChange={(e) => { setName(e.target.value); clear("name"); }} error={err.name} />
            </motion.div>
          )}
        </AnimatePresence>
        <FloatingField id="auth-email" label="E-posta adresi" icon={<Mail />} type="email" inputMode="email" autoComplete="email"
          value={email} onChange={(e) => { setEmail(e.target.value); clear("email"); }} error={err.email} />
        <FloatingField id="auth-password" label="Şifre" icon={<Lock />} type="password" revealable
          autoComplete={isLogin ? "current-password" : "new-password"} value={password}
          onChange={(e) => { setPassword(e.target.value); clear("password"); }} error={err.password}
          hint={isLogin ? undefined : "En az 8 karakter; bir rakam eklemeniz önerilir."} />

        {isLogin ? (
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-[18px] accent-es-royal-600" />
              Bu cihazda hatırla (30 gün)
            </label>
            <a href="/sifremi-unuttum" className="text-sm font-bold text-es-royal-600 hover:underline">Şifremi unuttum</a>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5 text-es-ink-600">
              <input id="auth-kvkk" type="checkbox" checked={kvkk} aria-invalid={!!err.kvkk}
                onChange={(e) => { setKvkk(e.target.checked); clear("kvkk"); }} className="mt-0.5 size-[18px] shrink-0 accent-es-royal-600" />
              <span>
                <a href="/kvkk" className="font-bold text-es-royal-600 hover:underline">KVKK Aydınlatma Metni</a>'ni ve{" "}
                <a href="/kullanim-sartlari" className="font-bold text-es-royal-600 hover:underline">Kullanım Şartları</a>'nı okudum, kabul ediyorum.
              </span>
            </label>
            {err.kvkk && <p role="alert" className="pl-7 text-xs font-semibold text-es-error-600">{err.kvkk}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="mt-1 flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-es-royal-600 text-[15px] font-bold text-white shadow-es-button transition-[background-color,box-shadow,transform] hover:bg-es-royal-700 active:translate-y-px active:scale-[.99] disabled:cursor-progress focus-visible:shadow-es-focus focus-visible:outline-none"
        >
          {loading ? (
            <><Loader2 className="size-[18px] animate-spin" aria-hidden />{isLogin ? "Kontrol ediliyor…" : "Hesap oluşturuluyor…"}</>
          ) : (
            <>{isLogin ? "Giriş Yap" : "Hesap Oluştur"}<ArrowRight className="size-[18px]" aria-hidden /></>
          )}
        </button>
      </form>

      <p className="text-center text-xs leading-[18px] text-es-ink-500">
        Giriş yaparak <a href="/kullanim-sartlari" className="font-bold text-es-ink-600 hover:underline">Kullanım Şartları</a> ve{" "}
        <a href="/gizlilik" className="font-bold text-es-ink-600 hover:underline">Gizlilik Politikası</a>'nı kabul etmiş olursunuz.
      </p>
    </div>
  );
}

/* ------------------------------ OTP ------------------------------ */
function OtpStep({ email, onVerifyCode, onResendCode, onBack, onVerified, resendSeconds = 45 }:
  AuthFlowProps & { email: string; onBack: () => void; onVerified: () => void }) {
  const [code, setCode] = React.useState<string[]>(Array(6).fill(""));
  const [status, setStatus] = React.useState<OtpStatus>("idle");
  const [sent, setSent] = React.useState(false);
  const timer = useCountdown(resendSeconds);

  async function verify(c: string) {
    setStatus("verifying");
    const ok = await onVerifyCode({ email, code: c }).catch(() => false);
    if (!ok) return setStatus("error");
    setStatus("success");
    setTimeout(onVerified, 1200);
  }

  async function resend() {
    if (!timer.done) return;
    await onResendCode(email);
    setCode(Array(6).fill("")); setStatus("idle"); setSent(true); timer.restart();
    setTimeout(() => setSent(false), 3500);
  }

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={onBack}
        className="-ml-2.5 inline-flex min-h-10 items-center gap-1.5 self-start rounded-[10px] px-2.5 text-sm font-bold text-es-ink-600 transition-colors hover:bg-slate-100 hover:text-es-ink-900 focus-visible:shadow-es-focus focus-visible:outline-none">
        <ArrowLeft className="size-4" aria-hidden /> Geri
      </button>
      <header className="flex flex-col gap-2.5">
        <span className="mb-1.5 grid size-[52px] place-items-center rounded-[14px] bg-es-turquoise-100 text-es-navy-900"><MailCheck className="size-6" aria-hidden /></span>
        <h1 className="font-display text-[28px] font-semibold leading-9 tracking-[-0.02em] text-es-navy-900">E-posta Adresinizi Doğrulayın</h1>
        <p className="text-[15px] leading-[23px] text-es-ink-600">
          <b className="font-bold text-es-ink-900">{email}</b> adresine 6 haneli bir sihirli doğrulama kodu gönderdik.
        </p>
      </header>

      <OtpInput value={code} onChange={(c) => { setCode(c); if (status === "error") setStatus("idle"); }} onComplete={verify} status={status} />

      <div className="flex items-center justify-between gap-3 rounded-[14px] border border-es-line bg-es-surface-50 px-4 py-3.5">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-es-ink-600">
          <Clock className="size-4" aria-hidden />
          <span role="timer" className={cn("font-mono text-sm font-semibold", timer.done ? "text-es-ink-300" : "text-es-ink-900")}>{timer.label}</span>
        </span>
        <button type="button" onClick={resend} disabled={!timer.done}
          className="min-h-9 rounded-lg px-2.5 text-sm font-bold text-es-royal-600 hover:underline disabled:cursor-not-allowed disabled:text-es-ink-300 disabled:no-underline focus-visible:shadow-es-focus focus-visible:outline-none">
          Kodu Tekrar Gönder
        </button>
      </div>
      {/* Sabırsız kullanıcı için: posta kutusuna tek dokunuşla geç */}
      <div className="-mt-2 grid grid-cols-2 gap-2.5">
        {[["Gmail'i aç", "https://mail.google.com"], ["Outlook'u aç", "https://outlook.live.com/mail"]].map(([l, h]) => (
          <a key={h} href={h} target="_blank" rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold transition-colors hover:border-slate-400 hover:bg-es-surface-50 focus-visible:shadow-es-focus focus-visible:outline-none">
            {l} <ExternalLink className="size-3.5 text-es-ink-500" aria-hidden />
          </a>
        ))}
      </div>
      {sent && <p role="status" className="-mt-3 text-[13px] font-semibold text-es-success-700">Yeni kod e-postanıza gönderildi.</p>}
      <p className="text-[13px] leading-5 text-es-ink-500">
        E-posta gelmediyse spam veya “Diğer” klasörünü kontrol edin. Adres yanlışsa{" "}
        <button type="button" onClick={onBack} className="font-bold text-es-royal-600 hover:underline">e-postayı değiştirin</button>.
      </p>
    </div>
  );
}

/* ------------------------------ SUCCESS ------------------------------ */
function SuccessStep({ onSuccess }: { onSuccess: () => void }) {
  React.useEffect(() => { const t = setTimeout(onSuccess, 2900); return () => clearTimeout(t); }, [onSuccess]);
  return (
    <div role="status" className="flex flex-col items-center gap-[18px] text-center">
      <motion.span className="grid size-[88px] place-items-center bg-es-success-700 text-white"
        initial={{ scale: 0.6, borderRadius: 18 }} animate={{ scale: [0.6, 1.08, 1], borderRadius: 999 }} transition={{ duration: 0.45, ease: EASE }}>
        <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <motion.path d="M20 6 9 17l-5-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.35 }} />
        </svg>
      </motion.span>
      <span className="rounded-full bg-es-success-50 px-2.5 py-1 text-xs font-bold text-es-success-700">E-posta adresiniz doğrulandı</span>
      <h1 className="font-display text-[28px] font-semibold leading-9 text-es-navy-900">Hoş geldiniz, Öğretmenim!</h1>
      <p className="text-es-ink-600">Panelinize yönlendiriliyorsunuz.</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-es-line">
        <motion.div className="h-full rounded-full bg-es-success-700" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.6, delay: 0.3, ease: "linear" }} />
      </div>
      <button type="button" onClick={onSuccess}
        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-es-royal-600 px-5 font-bold text-white transition-colors hover:bg-es-royal-700 focus-visible:shadow-es-focus focus-visible:outline-none">
        Hemen git <ArrowRight className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}

/* ------------------------------ TRUST PANEL ------------------------------ */
function TrustPanel() {
  return (
    <aside aria-label="evraksihirbazi.com hakkında"
      className="relative hidden min-w-0 flex-[3_1_0] flex-col gap-9 overflow-hidden border-r border-es-line bg-es-surface-50 bg-[radial-gradient(#D3DCE9_1px,transparent_1.2px)] px-16 py-12 [background-size:24px_24px] min-[961px]:flex">
      <img src="/brand/evraksihirbazi-wordmark.png" alt="evraksihirbazi.com" className="h-[26px] w-auto self-start" />
      <div className="max-w-[560px]">
        <h2 className="font-display text-[40px] font-semibold leading-[48px] tracking-[-0.025em] text-es-navy-900">Evraklarınız, sihirli bir dokunuşla hazır.</h2>
        <p className="mt-3 text-[17px] leading-[27px] text-es-ink-600">Okulunuzu ve görevinizi bir kez tanıtın; Yıllık Plan'dan ŞÖK tutanağına kadar her evrak sizin bilgilerinizle oluşsun.</p>
      </div>
      {/* Canlı önizleme: bulanık A4 + keskin kontrol listesi kartı. Uygulamada <WizardPanel> küçültülmüş hali de konabilir. */}
      <div aria-hidden className="relative h-[330px] max-w-[640px]">
        <div className="absolute left-0 top-[18px] h-[300px] w-[300px] rounded-[14px] border border-es-line bg-white opacity-80 shadow-es-lg blur-[2.5px]" />
        <motion.div className="absolute left-[190px] top-0 w-[380px] rounded-[18px] border border-white bg-white/80 p-[18px] shadow-[0_24px_48px_-16px_rgba(15,30,54,.28)] backdrop-blur-xl"
          animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <div className="h-2 overflow-hidden rounded-full bg-es-line">
            <motion.div className="h-full rounded-full bg-es-royal-500" initial={{ width: "20%" }} animate={{ width: "80%" }} transition={{ duration: 2.2, delay: 0.4 }} />
          </div>
          {["Yıllık Plan", "Zümre Tutanağı", "Belirli Gün ve Haftalar"].map((d, i) => (
            <div key={d} className="mt-3 flex items-center gap-2.5 text-[13px] font-semibold">
              <motion.span className="grid size-5 place-items-center rounded-md bg-es-success-700 text-white"
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.6, type: "spring", stiffness: 400, damping: 18 }}>
                <ShieldCheck className="size-3" />
              </motion.span>
              <span className="flex-1">{d}</span>
              <span className="text-xs font-bold text-es-success-700">Hazır</span>
            </div>
          ))}
        </motion.div>
      </div>
      {/* Yalnızca gerçek, izinli kullanıcı yorumları */}
      <figure className="max-w-[560px] rounded-2xl border border-es-line bg-white px-[22px] py-5">
        <blockquote className="text-base font-medium leading-[26px]">“[Gerçek bir öğretmen yorumu]”</blockquote>
        <figcaption className="mt-3.5 text-sm"><b>[Ad Soyad]</b> · <span className="text-es-ink-600">[Branş] Öğretmeni · [İl]</span></figcaption>
      </figure>
      <ul className="mt-auto flex flex-wrap gap-x-6 gap-y-2.5 text-[13px] font-semibold text-es-ink-600">
        <li className="flex items-center gap-1.5"><Lock className="size-4 text-es-success-700" aria-hidden />TLS ile şifreli bağlantı</li>
        <li className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-es-success-700" aria-hidden />KVKK aydınlatma metni</li>
        <li className="flex items-center gap-1.5"><UserX className="size-4 text-es-success-700" aria-hidden />Öğrenci verisi yapay zekâya gönderilmez</li>
      </ul>
    </aside>
  );
}

export default AuthFlow;
