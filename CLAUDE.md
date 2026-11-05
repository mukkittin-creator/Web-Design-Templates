# evraksihirbazi.com — Claude Code rehberi

Öğretmenler için evrak asistanı. Öğretmen iki soruya cevap verir (hangi dönem/süreç, hangi görev); site dosyasında neyin eksik olduğunu gösterir ve platformun hazırlayabildiklerini tek tıkla hazırlar.

## Komutlar
- `npm install` → `npm run dev` (http://localhost:3000)
- `npm run build` — üretim derlemesi (tip kontrolü dahil)
- `npm run typecheck`

## Yığın
Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind 3 · framer-motion · lucide-react.
Renk, gölge ve yazı tipleri `tailwind-tokens.ts` içindeki `es-*` ölçeğinden gelir (kaynak: `docs/tasarim/ds/tokens.json`). Sabit hex yazmak yerine bu token'ları kullan.

## Klasörler
| Yol | İçerik |
|---|---|
| `src/components/v2/dossier.ts` | İş mantığı: `Evrak` soyut sınıfı, `AracEvrak` / `ImzaEvrak` / `DisEvrak`, `Dosya` (kapsüllü durum + geri al), `katalog()` |
| `src/components/v2/EvrakV2.tsx` | Arayüz: `Ekran` taban iskeleti, `Sihirbaz`, `EvrakSatiri` |
| `src/components/auth/` | Giriş/kayıt/e-posta kodu (`AuthFlow`, `OtpInput`, `FloatingField`) |
| `src/components/system/SystemPages.tsx` | 404 ve bakım sayfaları |
| `src/app/` | Rotalar: `/`, `/giris`, `/bakim`, 404 |
| `src/lib/demo-servis.ts` | Sahte servisler — arka uç bağlanınca değiştirilecek |
| `src/legacy/v1-sihirbaz/` | v1 sihirbazı (shadcn/ui, Tremor, React PDF, TipTap kullanır). Derlemeye dahil DEĞİL (`tsconfig` exclude). Yalnızca referans. |
| `docs/tasarim/*.dc.html` | Tasarım tuvalinin kaynak dosyaları (v1, v2, v3). Tarayıcıda tek başına çalışmazlar; HTML/CSS ve davranış referansı olarak oku. |
| `docs/KARARLAR.md` | v1 → v2 → v3 tasarım kararları ve gerekçeleri |

## Tasarım ilkeleri (bozma)
1. **Soyutlama:** Satırda yalnızca evrak adı + tek düğme + "?" var. Neden/nereden bilgisi "?" arkasında.
2. **Kapsülleme:** Durum yalnızca `Dosya` metotlarıyla değişir (`yap`, `hepsiniHazirla`, `isaretle`, `geriAl`). Bileşenler durumu doğrudan değiştirmez.
3. **Kalıtım:** Her ekran `Ekran` iskeletinden türer: logo · ≤6 kelimelik başlık · tek cümle · TEK birincil düğme · tek bağlantı.
4. **Çok biçimlilik:** Yeni evrak türü = `Evrak`'tan yeni alt sınıf. `EvrakSatiri` türü bilmez; `etiket()` ve `yap()` çağırır. `if (tip === …)` dalları yazma.

Kurallar: ekranda 1 birincil düğme · ekranda 1 soru · gövde 17px · dokunma hedefi ≥ 44px · her eylem 6 sn geri alınabilir (onay penceresi yok) · `prefers-reduced-motion` desteklenir.

## Dil ve içerik
- Arayüz Türkçe, "siz" hitabı, düğmeler fiille başlar ("Hazırla", "Yazdır").
- Örnekler okul evraklarıdır (Yıllık Plan, Zümre/ŞÖK tutanağı, BEP…). MEB ile bağlantı iması yok; "MEB ile bağlantılı değildir" ifadesi korunur.
- Uydurma istatistik, yorum veya güvenlik iddiası yazma ("uçtan uca şifreli", "KVKK uyumlu" gibi). Bilinmeyen değer = `[YER TUTUCU]`.
- Turkuaz (`es-turquoise-500`) beyaz üstünde metin olarak kullanılmaz (kontrast 2.4:1).

## Yer tutucular (gerçek veriyle doldurulmalı)
- Okul paketi fiyatı `[FİYAT]` (V3Home tasarımı)
- `whatsappHref`, `supportEmail` (`src/app/bakim/page.tsx`)
- Google ve Apple giriş logoları (`AuthFlow` → `googleLogo`, `appleLogo`; resmî marka varlıkları)
- Öğretmen yorumu ve kullanıcı sayıları (v1 tasarımlarında)

## Sıradaki işler (öncelik sırasıyla)
1. **v3 açılış sayfası:** `docs/tasarim/V3Home.dc.html` → `src/app/page.tsx`. Sihirbazı `Ekran` yerine kart içinde gösterecek bir `variant` ekle; altında 3 adım, güven satırı, "Öğretmene ücretsiz. Okula tek panel.", SSS.
2. **Okul idare paneli:** `docs/tasarim/V3School.dc.html` → `/okul`. Zümre bazında durum, "Eksiği olan N öğretmene hatırlat", geri al. Panel evrak içeriğine ve öğrenci verisine erişmez.
3. **Arka uç:** `Servisler.uret(ids)` gerçek evrak üretimi + tek .docx/.zip indirme; tanınan cihazda kodsuz giriş (`onLogin` → `{ requiresVerification: false }`).
4. Giriş akışını v2'deki şifresiz modele (e-posta + kod) sadeleştirme kararı.
5. Bakım modu için middleware bayrağı.
