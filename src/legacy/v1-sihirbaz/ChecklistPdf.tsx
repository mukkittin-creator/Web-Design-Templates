/**
 * ChecklistPdf — @react-pdf/renderer ile A4 kontrol listesi çıktısı.
 * WizardPanel bu dosyayı yalnızca "PDF olarak indir"e basılınca tembel yükler.
 *
 * Türkçe karakterler (ğ, ş, İ, ı) için Unicode kapsayan bir yazı tipi gerekir;
 * Plus Jakarta Sans'ı /public/fonts altına koyup aşağıda kaydedin.
 */
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Evrak } from "./wizard-data";

Font.register({
  family: "Jakarta",
  fonts: [
    { src: "/fonts/PlusJakartaSans-Regular.ttf" },
    { src: "/fonts/PlusJakartaSans-Bold.ttf", fontWeight: 700 },
  ],
});

const C = { navy: "#1A365D", ink: "#0F1E36", ink6: "#4B5563", line: "#E8EDF5", ok: "#15803D", warn: "#B45309", royal: "#2563EB" };

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Jakarta", fontSize: 10, color: C.ink },
  brand: { fontSize: 11, fontWeight: 700, color: C.navy },
  title: { fontSize: 16, fontWeight: 700, color: C.navy, marginTop: 14 },
  meta: { color: C.ink6, marginTop: 4 },
  bar: { height: 6, backgroundColor: C.line, borderRadius: 3, marginTop: 12 },
  fill: { height: 6, borderRadius: 3 },
  row: { flexDirection: "row", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  box: { width: 12, height: 12, borderWidth: 1.2, borderRadius: 3, marginTop: 1, alignItems: "center", justifyContent: "center" },
  name: { fontWeight: 700, fontSize: 11 },
  small: { color: C.ink6, marginTop: 2, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 8, color: C.ink6, lineHeight: 1.4 },
});

export function ChecklistPdf({ title, items, checked, pct }: {
  title: string; items: Evrak[]; checked: Record<string, boolean>; pct: number;
}) {
  const tarih = new Date().toLocaleDateString("tr-TR");
  return (
    <Document title={`Evrak kontrol listesi — ${title}`} author="evraksihirbazi.com" language="tr">
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>evraksihirbazi.com</Text>
        <Text style={s.title}>Evrak Kontrol Listesi</Text>
        <Text style={s.meta}>{title} · {tarih} · Dosyanız %{pct} hazır</Text>
        <View style={s.bar}>
          <View style={[s.fill, { width: `${pct}%`, backgroundColor: pct === 100 ? C.ok : C.royal }]} />
        </View>

        <View style={{ marginTop: 16 }}>
          {items.map((it) => {
            const done = !!checked[it.id];
            return (
              <View key={it.id} style={s.row} wrap={false}>
                <View style={[s.box, { borderColor: done ? C.ok : C.ink6, backgroundColor: done ? C.ok : "#fff" }]}>
                  {done && <Text style={{ color: "#fff", fontSize: 8 }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{it.ad}</Text>
                  <Text style={s.small}>Nereden: {it.nereden}</Text>
                  <Text style={s.small}>Neden: {it.neden}</Text>
                  {it.tip === "imza" && !done && (
                    <Text style={[s.small, { color: C.warn, fontWeight: 700 }]}>Islak imza ve okul mührü gerekir.</Text>
                  )}
                </View>
                <Text style={{ fontWeight: 700, color: done ? C.ok : C.ink6 }}>{done ? "Tamam" : "Eksik"}</Text>
              </View>
            );
          })}
        </View>

        <Text style={s.footer} fixed>
          Bu liste kişisel takip içindir; resmî belge yerine geçmez. evraksihirbazi.com, MEB veya başka bir kamu kurumuyla bağlantılı değildir.
          Son kontrolü okul idarenizle yapın.
        </Text>
      </Page>
    </Document>
  );
}
