evraksihirbazi.com bir dosya arşivi değil, **üretken bir çalışma alanıdır**. Öğretmen dosya indirmez; komut yazar, ayarı değiştirir ve resmi evrakın A4 sayfada saniyeler içinde oluştuğunu izler. Bu sistemdeki her kural bu tek fikre hizmet eder.

## Ürün ilkeleri (tasarıma nasıl yansır)

1. **İndirme yok, canlı önizleme var.** Her araç ekranı `Workbench` ile kurulur: solda kontrol paneli, sağda `A4Sheet`. Bir ayar değiştiğinde sayfa yerinde yeniden oluşur (`busy` shimmer, ≤3 sn). İndirme yalnızca araç çubuğundaki dışa aktarma düğmelerindedir (Word = `navy`, PDF / Cevap anahtarı = `secondary`).
2. **Kategori değil, komut.** Ana ekranın merkezinde `OmniSearch` durur. Kullanıcı "4. Sınıf Fen Bilgisi Yer Kabuğu A/B Kitapçıklı Sınavı" yazdığında dosya listesi gösterilmez; `parseIntent` sonucu "Anladım:" satırında görünür ve Enter, alanları dolu bir Workbench açar. Ctrl/⌘ K her ekranda çubuğa odaklanır.
3. **2026 özellikleri gömülüdür.** `HorizonBar`'daki üç anahtar — Maarif Senaryo Eşleyici, 3 Seviyeli BEP Robotu, A/B Kitapçık & Optik QR — mevcut belgeyi tek tıkla dönüştürür. BEP açıkken `DifficultyTabs` (İleri · Standart · BEP/Kaynaştırma) görünür; A/B açıkken kitapçık seçici ve altbilgide `QrMark` belirir.
4. **Göz yormayan kurumsal SaaS.** Zemin her zaman `page-bg`, yüzeyler `surface-0`. Yapı `navy-900`, büyü `turquoise-500` + `royal-600`. Saatlerce çalışmaya uygun: düşük kontrastlı gölgeler, tek vurgu rengi, bol `space-6` boşluk.
5. **Hiçbir şey kaymaz, hiçbir şey bloklamaz.** Modal pencere yok; her şey satır içinde olur. A4 sayfa sabit 210:297 oranında ve `contain: layout paint` ile kilitlidir.

## İçerik ve dil

- Arayüz dili Türkçe; samimi ama resmi: kullanıcıya **"Öğretmenim"** diye hitap edilir, "siz" kullanılır ("Ayarları değiştirin, evrak sağda oluşsun.").
- Düğmeler fiille başlar, cümle düzeninde yazılır: "Evrakı Oluştur", "Word olarak indir", "Yeniden oluştur". Yükleniyor durumu ilerleme cümlesidir: "Sihirbaz yazıyor…".
- Örnek metinler gerçek MEB diliyle yazılır: "1. Dönem Fen Bilimleri 1. Yazılı Sınavı", "Türkiye Yüzyılı Maarif Modeli", "BEP / Kaynaştırma".
- Hata mesajı nedeni ve çözümü söyler, alanın altında durur: "Okul adı resmi başlıkta gerekli."
- Emoji kullanılmaz; ikonlar `Icon` bileşenindendir.

## Renk

- Sayfa zemini `page-bg`; kartlar, paneller, A4 kağıt `surface-0`; kart içi gömük alanlar `surface-50`.
- Ana metin `ink-900`, ikincil `ink-600`. `ink-500` yalnızca beyaz üzerinde altyazı (`page-bg` üstünde 4.3:1 — orada `ink-600` kullanın). `ink-300` yalnızca placeholder, pasif etiket ve cetvel çizgisi.
- `navy-900`: sidebar, sayfa başlıkları, wordmark, Word düğmesi. Hover/aktif `navy-800`.
- `royal-600`: tek "üret" düğmesi (`magic`), aktif sekme çizgisi, bağlantı. Hover `royal-700`. `royal-500` yalnızca odak kenarı, ilerleme ve grafik — küçük metin olarak kullanılmaz (3.7:1).
- `turquoise-500`: sihirbaz parıltısı — asa/kıvılcım ikonları, canlı nabız noktası, tarama çizgisi, navy zemin üstündeki ikonlar. **Beyaz üzerinde asla metin değildir** (2.4:1). Açık zemindeki büyü tonu `turquoise-100`, üzerindeki metin `navy-900`.
- `steel-500`: logodaki kitap sayfalarının mavisi — nötr bölüm ikonları ve beyaz üzerinde bağlantı.
- Durumlar: başarı `success-700` metin / `success-50` zemin / `success-500` nokta; hata `error-600` / `error-50`. Durum asla yalnızca renkle anlatılmaz — kelime veya ikon eşlik eder.
- Kenarlar: dekoratif çizgi ve kart kenarı `disabled-100`; form kontrolü kenarı `ink-500` (3:1).

## Tipografi

- Başlık ve marka **Lexend** (`--font-display`), arayüz metni **Plus Jakarta Sans** (`--font-text`); ikisi de Google Fonts'tan yüklenir (`bundle.css` içinde).
- Ekran başına bir `hero` (30px), araç başlıkları `heading` (28px), marka adı ve panel başlıkları `wordmark` (20px), hepsi `navy-900`.
- Gövde `body` 15/24, alan metni `input` 15/22 (500), etiketler `label` 13/18 (600), düğmeler `button` 15/20 (700), meta ve rozetler `caption` 12/16.
- A4 kağıdın içinde yalnızca `document` ailesi (Times New Roman) ve `doc-title` / `doc-body` stilleri kullanılır, metin siyahtır. Arayüz yazı tipleri kağıda girmez; belge yazı tipi arayüze çıkmaz.

## Boşluk, köşe, gölge

- Ölçek 4'ün katlarıdır: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-6` 24 · `space-8` 32 · `space-12` 48. Kart iç boşluğu `space-6`, alanlar arası `space-4`, iki tezgah bölmesi arası `space-6`.
- Köşeler: çip/küçük düğme `radius-sm`, düğme/girdi `radius-xl`, kart `radius-2xl`, Omni-Search ve hero `radius-3xl`, rozet `radius-full`.
- Gölgeler `ink-900` tonludur: kartlar `shadow-card`, A4 kağıt ve Omni-Search `shadow-lg`, yalnızca `magic` düğme `shadow-button`. Odak her zaman `royal-600` kenar + `shadow-focus`; hata `error-600` kenar + `shadow-error`. Halka tek başına yetmez — kenar rengi asıl göstergedir.

## Hareket

- Hover ve sekme geçişleri 120–200ms; hiçbir geçiş 300ms'yi aşmaz, sekmeler anında değişir.
- Üretim sırasında A4 içeriği solar, iskelet çubukları `disabled-100` → `turquoise-100` akar, `turquoise-500` tarama çizgisi sayfadan geçer; yeni eklenen bölümler (`doc-new`) kısa bir turkuaz vurguyla belirir.
- `prefers-reduced-motion` açıkken tüm animasyonlar kapanır (bundle.css bunu yapar).

## Düzen

- Uygulama: solda 264px `Sidebar` (navy-900), sağda üst bar (surface-0, `disabled-100` alt çizgi) ve `page-bg` üzerinde içerik.
- Ana ekran: ortada en fazla 880px genişlikte selamlama (`hero`) + `OmniSearch` + 3 örnek komut çipi.
- Araç ekranı: `Workbench` — sol panel 300–380px sabit (yapışkan), sağda araç çubuğu → `HorizonBar` → (BEP sekmeleri) → (kitapçık seçici) → `A4Sheet`. 860px altında alt alta.
- Mobil: sidebar çekmece olur, 16px kenar boşluğu, dokunma hedefleri en az 44px.

## İkonlar

- `Icon` bileşeni: 24px ızgara, 1.75 çizgi, yuvarlak uçlu Lucide tarzı çizgi ikonlar (mevcut sitedeki aileyle aynı). Boyutlar `sm` 16 · 18 · `lg` 22.
- Renk `currentColor`'dan gelir: nötr `steel-500`, büyü `turquoise-500`, `turquoise-100` üstünde `navy-900`.
- Dekoratif ikonlar `aria-hidden`; tek başına anlam taşıyan ikon `label` alır. Yalnız ikonlu düğme `aria-label` olmadan kullanılmaz.

## Logo

- `assets/Logos` grubundaki PNG'ler kullanılır, yeniden çizilmez veya renklendirilmez. Koyu zeminde logo `surface-0` bir `radius-sm` karonun üzerinde durur.
- Wordmark yazıyla dizilir: "evraksihirbazi" + turkuaz ".com", Lexend 600.

## Ekranlar

`WorkbenchScreen` önizlemesi stratejinin tamamını tek ekranda oynatır: komut yaz → tezgah açılır → anahtarlar belgeyi dönüştürür → dışa aktar.
