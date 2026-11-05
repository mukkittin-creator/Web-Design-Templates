import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "evraksihirbazi.com — Eksik evrakınızı tek tıkla hazırlayın",
  description: "Öğretmenler için evrak asistanı. İki soruya cevap verin, eksik evraklarınızı tek tıkla hazırlayın.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
