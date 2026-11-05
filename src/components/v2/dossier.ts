/**
 * dossier.ts — v2'nin iş mantığı. UI'dan bağımsız, test edilebilir.
 *
 *  KALITIM      : AracEvrak / ImzaEvrak / DisEvrak  ←  Evrak (soyut taban)
 *  ÇOK BİÇİMLİLİK: evrak.yap() her türde farklı çalışır; UI yalnızca yap() çağırır
 *  KAPSÜLLEME   : Dosya sınıfının durumu #private alanlarda; dışarıya salt-okunur
 *                 anlık görüntü ve birkaç public metot açılır; her değişiklik geri alınabilir
 *  SOYUTLAMA    : UI'ın bildiği tek şey: etiket(), yap(), hepsiniHazirla(), geriAl()
 */

export type Durum = "bekliyor" | "arada" | "hazir";

export interface Servisler {
  /** Platform evrakını üretip indirir (tek veya toplu) */
  uret(ids: string[]): Promise<void>;
  yazdir(id: string): Promise<void>;
  disAc(url: string): void;
}

/* ----------------------------- KALITIM ----------------------------- */
export abstract class Evrak {
  constructor(
    readonly id: string,
    readonly ad: string,
    readonly neden: string,
    readonly nereden: string,
  ) {}

  /** Düğmede görünecek metin — her alt sınıf kendi metnini verir */
  abstract etiket(durum: Durum): string;
  /** Asıl iş — her alt sınıf kendi davranışını uygular (çok biçimlilik) */
  abstract yap(durum: Durum, s: Servisler): Promise<Durum>;
  /** "Ne oldu" bildirimi */
  abstract bildirim(yeni: Durum): string;
  /** Ara durumda satırın altında gösterilen yönerge */
  araMetni(): string { return ""; }
  /** Toplu "Hepsini hazırla" bu evrakı kapsıyor mu? */
  get topluHazirlanir(): boolean { return false; }
}

export class AracEvrak extends Evrak {
  etiket() { return "Hazırla"; }
  async yap(_d: Durum, s: Servisler): Promise<Durum> { await s.uret([this.id]); return "hazir"; }
  bildirim() { return `${this.ad} hazır, indirildi.`; }
  override get topluHazirlanir() { return true; }
}

export class ImzaEvrak extends Evrak {
  etiket(d: Durum) { return d === "arada" ? "İmzalandı" : "Yazdır"; }
  async yap(d: Durum, s: Servisler): Promise<Durum> {
    if (d === "arada") return "hazir";
    await s.yazdir(this.id);
    return "arada";
  }
  bildirim(y: Durum) { return y === "arada" ? `${this.ad} yazdırıldı. İmzadan sonra işaretleyin.` : `${this.ad} tamamlandı.`; }
  override araMetni() { return "Çıktıyı imzaya ve mühüre götürün."; }
}

export class DisEvrak extends Evrak {
  constructor(id: string, ad: string, neden: string, nereden: string, readonly url: string) { super(id, ad, neden, nereden); }
  etiket(d: Durum) { return d === "arada" ? "Aldım" : "Aç ↗"; }
  async yap(d: Durum, s: Servisler): Promise<Durum> {
    if (d === "arada") return "hazir";
    s.disAc(this.url);
    return "arada";
  }
  bildirim(y: Durum) { return y === "arada" ? `${this.nereden} yeni sekmede açıldı.` : `${this.ad} tamamlandı.`; }
  override araMetni() { return "Belgeyi aldıysanız işaretleyin."; }
}

/* ---------------------------- KAPSÜLLEME ---------------------------- */
export interface Goruntu {
  readonly evraklar: readonly Evrak[];
  readonly durum: Readonly<Record<string, Durum>>;
  readonly mesgul: ReadonlySet<string>;
  readonly topluMesgul: boolean;
  readonly bildirim: { mesaj: string; geriAlinabilir: boolean } | null;
  readonly eksik: number;
  readonly topluKalan: number;
  readonly yuzde: number;
}

export class Dosya {
  #evraklar: Evrak[];
  #durum: Record<string, Durum>;
  #onceki: Record<string, Durum> | null = null;
  #mesgul = new Set<string>();
  #topluMesgul = false;
  #bildirim: Goruntu["bildirim"] = null;
  #dinleyiciler = new Set<() => void>();
  #goruntu!: Goruntu;
  #zamanlayici?: ReturnType<typeof setTimeout>;

  constructor(evraklar: Evrak[], private readonly servis: Servisler, baslangic: Record<string, Durum> = {}) {
    this.#evraklar = evraklar;
    this.#durum = { ...baslangic };
    this.#yenile();
  }

  /* --- public, salt-okunur --- */
  abone(fn: () => void) { this.#dinleyiciler.add(fn); return () => { this.#dinleyiciler.delete(fn); }; }
  get goruntu(): Goruntu { return this.#goruntu; }

  /* --- public komutlar: durum YALNIZCA bunlarla değişir --- */
  async yap(id: string) {
    const e = this.#bul(id);
    const d = this.#durum[id] ?? "bekliyor";
    if (!e || d === "hazir" || this.#mesgul.has(id)) return;
    this.#mesgul.add(id); this.#yenile();
    try {
      const yeni = await e.yap(d, this.servis); // ← çok biçimli çağrı
      this.#degistir({ [id]: yeni }, e.bildirim(yeni));
    } catch {
      this.#bildir("Bir sorun oldu. Tekrar deneyin.", false);
    } finally {
      this.#mesgul.delete(id); this.#yenile();
    }
  }

  async hepsiniHazirla() {
    const hedef = this.#evraklar.filter((e) => e.topluHazirlanir && this.#durum[e.id] !== "hazir");
    if (!hedef.length || this.#topluMesgul) return;
    this.#topluMesgul = true; this.#yenile();
    try {
      await this.servis.uret(hedef.map((e) => e.id));
      this.#degistir(Object.fromEntries(hedef.map((e) => [e.id, "hazir" as Durum])), `${hedef.length} evrak hazır, tek Word dosyası olarak indirildi.`);
    } catch {
      this.#bildir("Paket hazırlanamadı. Bağlantınızı kontrol edin.", false);
    } finally {
      this.#topluMesgul = false; this.#yenile();
    }
  }

  isaretle(id: string) {
    const e = this.#bul(id); if (!e) return;
    const hazir = this.#durum[id] === "hazir";
    this.#degistir({ [id]: hazir ? "bekliyor" : "hazir" }, hazir ? null : `${e.ad} işaretlendi.`);
  }

  geriAl() {
    if (!this.#onceki) return;
    this.#durum = this.#onceki; this.#onceki = null; this.#bildirim = null;
    this.#yenile();
  }

  /* --- private --- */
  #bul(id: string) { return this.#evraklar.find((e) => e.id === id); }

  #degistir(yama: Record<string, Durum>, mesaj: string | null) {
    this.#onceki = { ...this.#durum };
    this.#durum = { ...this.#durum, ...yama };
    if (mesaj) this.#bildir(mesaj, true); else this.#yenile();
  }

  #bildir(mesaj: string, geriAlinabilir: boolean) {
    clearTimeout(this.#zamanlayici);
    this.#bildirim = { mesaj, geriAlinabilir };
    this.#yenile();
    this.#zamanlayici = setTimeout(() => { this.#bildirim = null; this.#onceki = null; this.#yenile(); }, 6000);
  }

  #yenile() {
    const durum = { ...this.#durum };
    const hazir = this.#evraklar.filter((e) => durum[e.id] === "hazir").length;
    this.#goruntu = Object.freeze({
      evraklar: this.#evraklar,
      durum: Object.freeze(durum),
      mesgul: new Set(this.#mesgul),
      topluMesgul: this.#topluMesgul,
      bildirim: this.#bildirim,
      eksik: this.#evraklar.length - hazir,
      topluKalan: this.#evraklar.filter((e) => e.topluHazirlanir && durum[e.id] !== "hazir").length,
      yuzde: this.#evraklar.length ? Math.round((hazir / this.#evraklar.length) * 100) : 0,
    });
    this.#dinleyiciler.forEach((f) => f());
  }
}

/* ------------------------------ Katalog ------------------------------ */
export type Surec = "donembasi" | "sinav" | "bep" | "donemsonu";
export type Gorev = "brans" | "sinif" | "rehber" | "zumre";

/** Fabrika: düz veriden doğru alt sınıfı üretir. UI hangi sınıf olduğunu bilmez. */
export function katalog(surec: Surec, gorev: Gorev): Evrak[] {
  const E = {
    arac: (id: string, ad: string, n: string, k: string) => new AracEvrak(id, ad, n, k),
    imza: (id: string, ad: string, n: string, k: string) => new ImzaEvrak(id, ad, n, k),
    dis: (id: string, ad: string, n: string, k: string, url = "https://e-okul.meb.gov.tr") => new DisEvrak(id, ad, n, k, url),
  };
  const L: Record<Surec, Evrak[]> = {
    donembasi: [
      E.arac("yillik", "Yıllık Plan", "Dersin yıl boyu nasıl işleneceğini gösterir; denetimde ilk istenir.", "Yıllık Plan aracı, müdür onayı"),
      E.arac("zumre", "Zümre Tutanağı", "Ortak ölçme kararlarını kayda geçirir.", "Zümre şablonu"),
      E.imza("sok", "ŞÖK Tutanağı", "Sınıfa özel kurul kararlarıdır; imza ve mühürle geçerli olur.", "ŞÖK şablonu, okul idaresi"),
      E.dis("program", "Ders Programı", "Girdiğiniz derslerin gün ve saatleri.", "e-Okul"),
      E.arac("bgh", "Belirli Gün ve Haftalar", "Anma ve kutlamalarda görev dağılımı.", "Belirli Gün ve Haftalar aracı"),
      E.dis("olcme", "Ortak Sınav Takvimi", "Yazılı tarihlerinin zümrece ortaklaştırıldığını gösterir.", "e-Okul"),
    ],
    sinav: [
      E.arac("kagit", "Sınav Kağıdı (A/B)", "Kazanımlara göre, puanları belirtilmiş sınav kağıdı.", "Sınav Kağıdı aracı"),
      E.arac("anahtar", "Cevap Anahtarı", "Puanlamanın şeffaf yapıldığını gösterir.", "Sınav Kağıdı aracı"),
      E.arac("optik", "Optik Form", "Çoktan seçmeli bölümün hızlı okunması için.", "Optik Form aracı"),
      E.arac("analiz", "Sınav Analizi", "Soru ve konu bazında başarıyı gösterir.", "Sınav Analizi aracı"),
      E.dis("eokul", "Notların e-Okul Girişi", "Notlar süresi içinde girilmelidir.", "e-Okul"),
      E.imza("teslim", "Sınav Teslim Tutanağı", "Kağıtların arşive teslimini kayda geçirir.", "Okul idaresi"),
    ],
    bep: [
      E.dis("ram", "RAM Raporu", "Öğrencinin kaynaştırma kapsamında olduğunu gösterir.", "Rehberlik ve Araştırma Merkezi", "#"),
      E.imza("birim", "BEP Birimi Kararı", "Birim üyelerini ve kararları resmîleştirir.", "Okul BEP birimi"),
      E.arac("bepplan", "BEP Planı", "Öğrencinin düzeyine göre amaçları belirler.", "BEP Robotu"),
      E.arac("kaba", "Kaba Değerlendirme Formu", "Mevcut performansı ölçer.", "BEP Robotu"),
      E.imza("veli", "Veli Bilgilendirme Formu", "Velinin bilgilendirildiğini gösterir.", "Veli imzası"),
    ],
    donemsonu: [
      E.arac("karne", "Karne Görüşleri", "Her öğrenci için kişiye özel değerlendirme.", "Karne Görüşü aracı"),
      E.arac("takdir", "Teşekkür / Takdir Listesi", "Belge alabilecek öğrencilerin ön listesi.", "Belge hesaplama aracı"),
      E.arac("zumresonu", "Zümre Dönem Sonu Tutanağı", "Dönem başı kararlarının değerlendirmesi.", "Zümre şablonu"),
      E.imza("soksonu", "ŞÖK Dönem Sonu Tutanağı", "Sınıfın dönem sonu kararları.", "ŞÖK şablonu, okul idaresi"),
    ],
  };
  const list = [...L[surec]];
  if ((gorev === "sinif" || gorev === "rehber") && surec === "donembasi")
    list.push(E.imza("velitop", "Veli Toplantısı Tutanağı", "Toplantı kararlarını ve katılımı kayda geçirir.", "Veli toplantısı şablonu"));
  if (gorev === "zumre")
    list.push(E.imza("zumrerapor", "Zümre Başkanı Raporu", "Zümre kararlarının özetini müdüre iletir.", "Zümre aracı, müdür onayı"));
  return list;
}
