"use client";
/**
 * OtpInput — 6 ayrı kutu, 3+3 gruplu, monospace.
 * - İlk kutu otomatik odak; rakam girilince sonrakine geçer
 * - Backspace boş kutuda öncekine döner; ← → ile gezinme
 * - Yapıştırma ve iOS/Android `one-time-code` otomatik doldurma
 * - status: "idle" | "verifying" | "error" | "success"
 *   error → sallanma + kırmızı kenar; success → kutular yeşil tike dönüşür
 */
import * as React from "react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type OtpStatus = "idle" | "verifying" | "error" | "success";

export interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (next: string[]) => void;
  onComplete: (code: string) => void;
  status: OtpStatus;
  autoFocus?: boolean;
}

export function OtpInput({ length = 6, value, onChange, onComplete, status, autoFocus = true }: OtpInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const shake = useAnimationControls();
  const reduce = useReducedMotion();

  const focus = (i: number) => requestAnimationFrame(() => refs.current[Math.max(0, Math.min(i, length - 1))]?.select());

  React.useEffect(() => { if (autoFocus) focus(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (status !== "error") return;
    if (!reduce) shake.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.45 } });
    const t = setTimeout(() => { onChange(Array(length).fill("")); focus(0); }, 600);
    return () => clearTimeout(t);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  function write(start: number, digits: string[]) {
    const next = status === "error" ? Array(length).fill("") : [...value];
    const from = status === "error" ? 0 : start;
    digits.forEach((d, k) => { if (from + k < length) next[from + k] = d; });
    onChange(next);
    if (next.every(Boolean)) return onComplete(next.join(""));
    const after = next.findIndex((d, j) => j >= from + digits.length && !d);
    focus(after === -1 ? next.indexOf("") : after);
  }

  if (status === "success") {
    return (
      <div role="status" className="flex h-[60px] items-center gap-4">
        <span className="relative size-[60px]">
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-es-success-500"
            initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 1, delay: 0.2 }}
          />
          <motion.span
            className="absolute inset-0 grid place-items-center bg-es-success-700 text-white"
            initial={{ scale: 0.6, borderRadius: 14, opacity: 0.4 }}
            animate={{ scale: [0.6, 1.08, 1], borderRadius: 999, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.2, 0.9, 0.3, 1] }}
          >
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <motion.path d="M20 6 9 17l-5-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.35 }} />
            </svg>
          </motion.span>
        </span>
        <span>
          <span className="block font-bold text-es-success-700">Kod doğrulandı</span>
          <span className="text-[13px] text-es-ink-600">Hesabınız açılıyor…</span>
        </span>
      </div>
    );
  }

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-[13px] font-semibold text-es-ink-600">Doğrulama kodu</legend>
      <motion.div animate={shake} className="flex items-center gap-2">
        {value.map((v, i) => (
          <React.Fragment key={i}>
            {i === length / 2 && <span aria-hidden className="mx-0.5 h-0.5 w-2.5 rounded bg-[#CBD5E1]" />}
            <input
              ref={(el) => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={length}
              aria-label={`Kod hanesi ${i + 1} / ${length}`}
              aria-invalid={status === "error"}
              disabled={status === "verifying"}
              value={v}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "");
                if (!d) { const n = [...value]; n[i] = ""; return onChange(n); }
                if (d.length > 2) return write(0, d.slice(0, length).split("")); // otomatik doldurma
                write(i, [d.slice(-1)]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !value[i] && i > 0) { e.preventDefault(); const n = [...value]; n[i - 1] = ""; onChange(n); focus(i - 1); }
                if (e.key === "ArrowLeft") { e.preventDefault(); focus(i - 1); }
                if (e.key === "ArrowRight") { e.preventDefault(); focus(i + 1); }
              }}
              onPaste={(e) => {
                const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
                if (!t) return;
                e.preventDefault();
                write(t.length === length ? 0 : i, t.split(""));
              }}
              className={cn(
                "h-[60px] w-[52px] rounded-xl border bg-white text-center font-mono text-[26px] font-semibold text-es-ink-900 caret-es-royal-600 outline-none",
                "transition-[border-color,box-shadow,transform,background-color] duration-150",
                "hover:border-slate-400 focus:-translate-y-px focus:border-es-royal-600 focus:shadow-es-focus",
                "disabled:opacity-60 max-[400px]:h-[54px] max-[400px]:w-11 max-[400px]:text-[22px]",
                status === "error" ? "border-es-error-600 bg-es-error-50" : v ? "border-es-navy-900" : "border-[#CBD5E1]",
              )}
            />
          </React.Fragment>
        ))}
        <AnimatePresence>
          {status === "verifying" && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="ml-1.5 size-5 animate-spin text-es-royal-600" aria-label="Doğrulanıyor" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      {status === "error" && (
        <p role="alert" className="flex items-center gap-1.5 text-[13px] font-semibold text-es-error-600">
          Kod hatalı veya süresi dolmuş. Tekrar deneyin.
        </p>
      )}
    </fieldset>
  );
}

/** mm:ss geri sayım; `restart()` ile yeniden başlar. */
export function useCountdown(seconds: number) {
  const [left, setLeft] = React.useState(seconds);
  const [epoch, setEpoch] = React.useState(0);
  React.useEffect(() => {
    setLeft(seconds);
    const id = setInterval(() => setLeft((s) => (s <= 1 ? (clearInterval(id), 0) : s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds, epoch]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return { left, label: `${mm}:${ss}`, done: left === 0, restart: () => setEpoch((e) => e + 1) };
}
