"use client";
/**
 * Bakım modu. Gerçekte middleware, bakım bayrağı açıkken tüm istekleri buraya yönlendirir.
 * TODO: progress, eta ve steps durum servisinden gelmeli; onNotify gerçek listeye yazmalı.
 * TODO: whatsappHref ve supportEmail gerçek değerlerle doldurulmalı.
 */
import { MaintenancePage } from "@/components/system/SystemPages";

export default function BakimPage() {
  return (
    <MaintenancePage
      progress={62}
      eta="15 Dakika İçinde"
      steps={[
        { label: "Verileriniz yedeklendi", state: "done" },
        { label: "Yeni şablonlar ve araçlar yükleniyor", state: "active" },
        { label: "Son kontroller", state: "todo" },
      ]}
      onNotify={async () => { await new Promise((r) => setTimeout(r, 900)); }}
      whatsappHref="https://wa.me/[NUMARA]"
      supportEmail="[destek@ornek.com]"
    />
  );
}
