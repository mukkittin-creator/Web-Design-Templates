# Tasarım kararları

## v1 — İlk tasarım (`Main`, `Mobile`, `States`, `Auth*`, `NotFound`, `Maintenance`)
- Split hero (vaat + 3 açılır menü / yüzen kontrol listesi), sihirbaz paneli (etiketler + kart ızgarası), aksiyon çubuğu, güven, SSS.
- Giriş: 60/40 bölünmüş ekran, yüzen etiketli alanlar, Google/Apple, 6 haneli kod (3+3), sallanma/yeşil tik.
- 404 (uçan kağıtlar, arama) ve bakım (amber halka, ilerleme, haber ver) sayfaları.
- "Sabırsız öğretmen" turunda eklenenler: geri dönen bandı, tek tık hazır seçimler, "Eksik N evrakı tek tıkla hazırla", tanınan cihazda kodsuz giriş, 45 sn tekrar gönder, Gmail/Outlook kısayolu, 404 arama, bakımda açık araçlar.
- Sorunları: sayfa 3.660 px; aynı seçim iki yerde; kartta 9 parça bilgi; birden çok "ana" düğme; 15 px gövde.

## v2 — Sade (`V2Home`, `V2Mobile`, `V2Screens`, `V2System`)
- Her ekranda tek soru (2 adım), tek büyük düğme, satırda ad + tek düğme + "?".
- Çok biçimli satır düğmesi: Hazırla / Yazdır → İmzalandı / Aç ↗ → Aldım.
- 6 sn "Geri al", onay penceresi yok. Gövde 17 px.
- Tüm ekranlar aynı iskelet (logo, başlık, tek cümle, tek düğme, tek bağlantı).
- Giriş şifresiz önerildi (e-posta + kod; tanınan cihazda 30 gün kod yok).

## v3 — Birleşik (`V3Home`, `V3Mobile`, `V3School`) ← hedef
- Açılış sayfasının sağ yarısı gerçek, çalışan sihirbaz (v1'in sahte mockup'ı yerine).
- v1'den: marka dili, split düzen, yüzen kart + nokta ızgarası, güven satırı, SSS.
- v2'den: tek soru, tek düğme, çok biçimli satırlar, geri al, okunabilirlik.
- Yatırımcı için: "Öğretmene ücretsiz. Okula tek panel." gelir modeli ve okul idare paneli (zümre bazında durum + toplu hatırlatma).
- Kaldırılanlar: akan şerit, sahte istatistikler, "uzmana kontrol ettir" vaadi.

## Değişmeyen ilkeler
- Renkler "Evrak Sihirbazı" tasarım sisteminden (navy-900 yapı, royal-600 eylem, turquoise sihir vurgusu, success durum). Amber yalnızca "imza/mühür bekliyor" için eklendi.
- Uydurma veri yok; bilinmeyen = yer tutucu.
