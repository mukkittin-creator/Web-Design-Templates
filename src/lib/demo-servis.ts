/**
 * demo-servis.ts — arka uç bağlanana kadar kullanılan sahte servisler.
 * TODO(arka-uç): uret() gerçek evrak üretim API'sine bağlanmalı ve tek .docx/.zip indirmeli.
 */
import type { Servisler } from "@/components/v2/dossier";

const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const demoServis: Servisler = {
  async uret(ids) { await bekle(ids.length > 1 ? 1300 : 900); },
  async yazdir() { await bekle(500); },
  disAc(url) { if (url && url !== "#") window.open(url, "_blank", "noopener,noreferrer"); },
};
