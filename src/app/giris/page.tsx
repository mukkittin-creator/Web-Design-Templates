"use client";
/**
 * Giriş / kayıt / e-posta kodu.
 * TODO(arka-uç): demo işleyicileri gerçek kimlik doğrulamaya bağla.
 * TODO(v2-sadeleştirme): docs/tasarim/V2Screens.dc.html'deki şifresiz akışa (yalnızca e-posta + kod) geçilecek mi? Karar verilmeli.
 */
import { useRouter } from "next/navigation";
import { AuthFlow } from "@/components/auth/AuthFlow";

const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function GirisPage() {
  const router = useRouter();
  return (
    <AuthFlow
      onLogin={async ({ remember }) => { await bekle(900); return { requiresVerification: !remember }; }}
      onSignup={async () => { await bekle(900); }}
      onVerifyCode={async ({ code }) => { await bekle(700); return code === "123456"; }}
      onResendCode={async () => { await bekle(300); }}
      onSuccess={() => router.push("/")}
    />
  );
}
