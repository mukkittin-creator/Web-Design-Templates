"use client";
/**
 * Ana sayfa — şimdilik v2 sihirbazı.
 * TODO(v3): docs/tasarim/V3Home.dc.html'deki birleşik açılış sayfasına çevir
 * (sol: vaat + güven maddeleri, sağ: bu sihirbaz kart içinde; altında 3 adım, güven, okul paketi, SSS).
 */
import * as React from "react";
import { Sihirbaz } from "@/components/v2/EvrakV2";
import { demoServis } from "@/lib/demo-servis";
import type { Durum, Gorev, Surec } from "@/components/v2/dossier";

type Kayit = { surec: Surec; gorev: Gorev; durum: Record<string, Durum> };
const ANAHTAR = "es:v2:dosya";

export default function Page() {
  const [kayitli, setKayitli] = React.useState<Kayit | undefined>(undefined);
  const [hazir, setHazir] = React.useState(false);

  React.useEffect(() => {
    try { const v = localStorage.getItem(ANAHTAR); if (v) setKayitli(JSON.parse(v)); } catch { /* gizli sekme */ }
    setHazir(true);
  }, []);

  if (!hazir) return null;
  return (
    <Sihirbaz
      servis={demoServis}
      kayitli={kayitli}
      onKaydet={(v) => { try { localStorage.setItem(ANAHTAR, JSON.stringify(v)); } catch { /* yok say */ } }}
    />
  );
}
