"use client";
/**
 * FloatingField — yüzen etiketli alan (CSS :placeholder-shown ile, JS gerekmez).
 * Odak: 1px royal-600 kenar + yumuşak mavi parıltı. Hata: kırmızı kenar, açık kırmızı zemin, aria-describedby.
 */
import * as React from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FloatingFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string;
  icon: React.ReactNode;
  error?: string;
  hint?: string;
  /** type="password" ise göster/gizle düğmesi eklenir */
  revealable?: boolean;
}

export const FloatingField = React.forwardRef<HTMLInputElement, FloatingFieldProps>(function FloatingField(
  { label, icon, error, hint, revealable, type = "text", id, className, ...rest }, ref,
) {
  const autoId = React.useId();
  const fid = id ?? autoId;
  const [show, setShow] = React.useState(false);
  const descId = error ? `${fid}-err` : hint ? `${fid}-hint` : undefined;
  const inputType = revealable ? (show ? "text" : "password") : type;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="group relative">
        <input
          ref={ref}
          id={fid}
          type={inputType}
          placeholder=" "
          aria-invalid={!!error}
          aria-describedby={descId}
          className={cn(
            "peer h-14 w-full rounded-xl border bg-white pb-1.5 pl-11 pt-[22px] text-[15px] font-medium text-es-ink-900 outline-none",
            "transition-[border-color,box-shadow,background-color] duration-150",
            "hover:border-slate-400 focus:border-es-royal-600 focus:shadow-es-focus",
            revealable && "pr-[52px]",
            error ? "border-es-error-600 bg-es-error-50 shadow-es-error" : "border-[#CBD5E1]",
          )}
          {...rest}
        />
        <label
          htmlFor={fid}
          className={cn(
            "pointer-events-none absolute left-11 top-[18px] text-[15px] font-medium text-es-ink-500 transition-all duration-150 ease-[cubic-bezier(.2,.9,.3,1)]",
            "peer-focus:top-2 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-es-royal-600",
            "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold",
            error && "!text-es-error-600",
          )}
        >
          {label}
        </label>
        <span className={cn("pointer-events-none absolute left-3.5 top-[18px] text-es-ink-500 peer-focus:text-es-royal-600 [&>svg]:size-[18px]", error && "!text-es-error-600")}>
          {icon}
        </span>
        {revealable && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
            aria-pressed={show}
            className="absolute right-1.5 top-1.5 grid size-11 place-items-center rounded-[10px] text-es-ink-500 transition-colors hover:bg-slate-100 hover:text-es-ink-900 focus-visible:shadow-es-focus focus-visible:outline-none"
          >
            {show ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${fid}-err`} role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-es-error-600">
          <AlertCircle className="size-3.5" aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="text-xs text-es-ink-500">{hint}</p>
      ) : null}
    </div>
  );
});
