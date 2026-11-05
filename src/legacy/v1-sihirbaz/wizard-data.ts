// wizard-data.ts — Sihirli Kontrol Listesi veri modeli
// Not: İçerik bir rehberdir; okulun uygulamasına göre son kontrol okul idaresiyle yapılır.

export type Okul = "ilkokul" | "ortaokul" | "lise" | "okuloncesi";
export type Surec = "donembasi" | "sinav" | "bep" | "donemsonu";
export type Gorev = "brans" | "sinif" | "rehber" | "zumre";

/** arac = platform hazırlar · imza = ıslak imza/mühür gerekir · dis = dış kaynak (e-Okul, RAM…) */
export type KaynakTipi = "arac" | "imza" | "dis";

export interface Evrak {
  id: string;
  ad: string;
  tip: KaynakTipi;
  nereden: string;
  neden: string;
  /** Araç sayfası veya dış kaynak bağlantısı */
  href?: string;
}

export interface Secim {
  okul?: Okul;
  surec?: Surec;
  gorev?: Gorev;
}

export const OKUL: { id: Okul; label: string }[] = [
  { id: "ilkokul", label: "İlkokul" },
  { id: "ortaokul", label: "Ortaokul" },
  { id: "lise", label: "Lise" },
  { id: "okuloncesi", label: "Okul öncesi" },
];

export const SUREC: { id: Surec; label: string }[] = [
  { id: "donembasi", label: "Dönem başı" },
  { id: "sinav", label: "Yazılı sınav ve analiz" },
  { id: "bep", label: "BEP / Kaynaştırma" },
  { id: "donemsonu", label: "Dönem sonu" },
];

export const GOREV: { id: Gorev; label: string }[] = [
  { id: "brans", label: "Branş öğretmeni" },
  { id: "sinif", label: "Sınıf öğretmeni" },
  { id: "rehber", label: "Sınıf rehber öğretmeni" },
  { id: "zumre", label: "Zümre başkanı" },
];

const TEMEL: Record<Surec, Evrak[]> = {
  donembasi: [
    { id: "yillik", ad: "Yıllık Plan (ünitelendirilmiş)", tip: "arac", href: "/araclar/yillik-plan", nereden: "Yıllık Plan aracı → okul müdürü onayı", neden: "Dersin yıl boyunca hangi öğrenme çıktılarıyla ve hangi haftalarda işleneceğini gösterir. Ders denetiminde ilk istenen belgelerdendir." },
    { id: "zumre", ad: "Zümre Öğretmenler Kurulu Tutanağı", tip: "arac", href: "/sablonlar/zumre", nereden: "Zümre tutanağı şablonu · zümre başkanı imzası", neden: "Ortak ölçme-değerlendirme kararlarını ve yıllık planın zümrece benimsendiğini kayda geçirir." },
    { id: "sok", ad: "ŞÖK Tutanağı", tip: "imza", href: "/sablonlar/sok", nereden: "ŞÖK şablonu · ıslak imza ve okul mührü", neden: "Şube öğretmenler kurulunun sınıfa özel kararlarını belgeler. Katılan öğretmenlerin imzası ve müdür onayı olmadan geçerli sayılmaz." },
    { id: "program", ad: "Haftalık Ders Programı", tip: "dis", href: "https://e-okul.meb.gov.tr", nereden: "e-Okul · okul idaresi", neden: "Girdiğiniz derslerin gün ve saatlerini gösterir; nöbet ve ek ders hesaplarının dayanağıdır." },
    { id: "bgh", ad: "Belirli Gün ve Haftalar Planı", tip: "arac", href: "/araclar/belirli-gun-ve-haftalar", nereden: "Belirli Gün ve Haftalar aracı", neden: "Yıl içindeki anma ve kutlamalarda görev dağılımını ve tarihleri tek planda toplar." },
    { id: "olcme", ad: "Ortak Sınav ve Ölçme Takvimi", tip: "dis", nereden: "Zümre kararı · e-Okul sınav tarihleri", neden: "Yazılı sınav tarihlerinin zümrece ortaklaştırıldığını gösterir; öğrenci ve veliye duyurulur." },
  ],
  sinav: [
    { id: "kagit", ad: "Yazılı Sınav Kağıdı (A/B kitapçık)", tip: "arac", href: "/araclar/sinav-kagidi", nereden: "Sınav Kağıdı aracı", neden: "Kazanımlara göre hazırlanmış, puanları belirtilmiş sınav kağıdıdır. A/B kitapçık kopya riskini azaltır." },
    { id: "anahtar", ad: "Cevap Anahtarı ve Puanlama Tablosu", tip: "arac", href: "/araclar/sinav-kagidi", nereden: "Sınav Kağıdı aracı · cevap anahtarı çıktısı", neden: "Puanlamanın şeffaf ve itiraza açık biçimde yapıldığını gösterir." },
    { id: "optik", ad: "Optik Form", tip: "arac", href: "/araclar/optik-form", nereden: "Optik Form aracı", neden: "Çoktan seçmeli bölümlerin hızlı ve hatasız okunmasını sağlar." },
    { id: "analiz", ad: "Sınav Analizi Raporu", tip: "arac", href: "/araclar/sinav-analizi", nereden: "Sınav Analizi aracı · e-Okul not aktarımı", neden: "Soru ve konu bazında başarıyı gösterir; destek gerektiren öğrenci gruplarını belirler." },
    { id: "eokul", ad: "Notların e-Okul'a Girişi", tip: "dis", href: "https://e-okul.meb.gov.tr", nereden: "e-Okul", neden: "Notların resmî kayda geçmesi için süresi içinde girilmesi gerekir." },
    { id: "teslim", ad: "Sınav Evrakı Teslim Tutanağı", tip: "imza", nereden: "Okul idaresi · imza", neden: "Sınav kağıtlarının arşive teslim edildiğini kayda geçirir." },
  ],
  bep: [
    { id: "ram", ad: "RAM Eğitsel Değerlendirme Raporu", tip: "dis", nereden: "Rehberlik ve Araştırma Merkezi (RAM)", neden: "Öğrencinin kaynaştırma kapsamında olduğunu gösteren dayanak belgedir; BEP bu rapora göre hazırlanır." },
    { id: "birim", ad: "BEP Geliştirme Birimi Kararı", tip: "imza", nereden: "Okul BEP birimi · müdür onayı", neden: "Birim üyelerini ve öğrenci için alınan kararları resmîleştirir." },
    { id: "bepplan", ad: "BEP Planı (3 seviyeli)", tip: "arac", href: "/araclar/bep", nereden: "3 Seviyeli BEP Robotu", neden: "Öğrencinin performans düzeyine göre uzun ve kısa dönemli amaçları belirler." },
    { id: "kaba", ad: "Kaba Değerlendirme Formu", tip: "arac", href: "/araclar/bep", nereden: "BEP Robotu · değerlendirme formu", neden: "Öğrencinin mevcut performansını ölçer; BEP amaçlarının başlangıç noktasıdır." },
    { id: "veli", ad: "Veli Bilgilendirme ve Katılım Formu", tip: "imza", nereden: "Veli imzası", neden: "Velinin plan hakkında bilgilendirildiğini ve sürece katıldığını gösterir." },
    { id: "uyarlanmis", ad: "Uyarlanmış Sınav Kağıdı", tip: "arac", href: "/araclar/sinav-kagidi", nereden: "Sınav Kağıdı aracı · BEP seviyesi", neden: "Öğrencinin BEP amaçlarına göre uyarlanmış ölçme aracıdır." },
  ],
  donemsonu: [
    { id: "karne", ad: "Karne Görüşleri", tip: "arac", href: "/araclar/karne-gorusu", nereden: "Karne Görüşü Oluşturucu → e-Okul", neden: "Her öğrenci için yapıcı ve kişiye özel bir dönem değerlendirmesi sunar." },
    { id: "takdir", ad: "Teşekkür / Takdir Ön Listesi", tip: "arac", href: "/araclar/tesekkur-takdir", nereden: "Belge hesaplama aracı · son karar öğretmenler kurulunda", neden: "Belge alabilecek öğrencilerin ön listesini çıkarır." },
    { id: "zumresonu", ad: "Zümre Dönem Sonu Tutanağı", tip: "arac", href: "/sablonlar/zumre", nereden: "Zümre tutanağı şablonu", neden: "Dönem başı kararlarının ne ölçüde uygulandığını değerlendirir." },
    { id: "analizler", ad: "Dönem Sınav Analizleri", tip: "arac", href: "/araclar/sinav-analizi", nereden: "Sınav Analizi aracı", neden: "Dönem boyunca yapılan sınavların toplu başarı görünümünü verir." },
    { id: "soksonu", ad: "ŞÖK Dönem Sonu Tutanağı", tip: "imza", href: "/sablonlar/sok", nereden: "ŞÖK şablonu · ıslak imza ve okul mührü", neden: "Sınıfın dönem sonu durumunu ve alınan kararları kayda geçirir." },
    { id: "kulup", ad: "Kulüp Danışman Görüşü", tip: "arac", href: "/araclar/karne-gorusu", nereden: "Karne ve Kulüp Görüşü Oluşturucu", neden: "Öğrencinin kulüp çalışmalarına katılımını değerlendirir." },
  ],
};

/** Seçime göre filtrelenmiş liste. Saf fonksiyon: sunucuda da, istemcide de çalışır. */
export function buildChecklist({ surec, gorev }: Required<Secim>): Evrak[] {
  const list = [...TEMEL[surec]];
  const sinifRehber = gorev === "sinif" || gorev === "rehber";
  if (sinifRehber && surec === "donembasi") {
    list.push(
      { id: "rehberlik", ad: "Sınıf Rehberlik Planı", tip: "dis", nereden: "Okul rehberlik servisi", neden: "Sınıfınızın yıl boyu rehberlik etkinliklerini planlar." },
      { id: "velitop", ad: "Veli Toplantısı Tutanağı", tip: "imza", nereden: "Veli toplantısı şablonu · veli imzaları", neden: "Dönem başı veli toplantısında alınan kararları ve katılımı kayda geçirir." },
    );
  }
  if (sinifRehber && surec === "donemsonu") {
    list.push({ id: "rehberrapor", ad: "Sınıf Rehberlik Faaliyet Raporu", tip: "dis", nereden: "Okul rehberlik servisi", neden: "Yıl içinde yapılan rehberlik etkinliklerinin özetidir." });
  }
  if (gorev === "zumre") {
    list.push({ id: "zumrerapor", ad: "Zümre Başkanı Değerlendirme Raporu", tip: "imza", nereden: "Zümre tutanağı aracı · müdür onayı", neden: "Zümre kararlarının özetini okul müdürüne iletir." });
  }
  return list;
}

export const isComplete = (s: Secim): s is Required<Secim> => Boolean(s.okul && s.surec && s.gorev);

export const labelOf = <T extends string>(arr: { id: T; label: string }[], id?: T) =>
  arr.find((x) => x.id === id)?.label ?? "";
