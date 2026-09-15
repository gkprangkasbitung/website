export type WartaStatus = "draft" | "published";

export interface Warta {
  id: string;
  slug: string;
  status: WartaStatus;
  tanggal_kebaktian: string;
  judul_kebaktian: string;
  tema_kebaktian: string | null;
  renungan_judul: string | null;
  renungan_kitab: string | null;
  renungan_isi: string | null;
  renungan_sumber: string | null;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PeribadahanCategory {
  id: string;
  key: string;
  name: string;
  sort_order: number;
  updated_at: string;
}

export interface Tempat {
  id: string;
  nama: string;
  keterangan: string | null;
  sort_order: number;
}

export interface Wilayah {
  id: string;
  nama: string;
  sort_order: number;
}

export interface LabelJemaat {
  id: string;
  nama: string;
  sort_order: number;
}

export interface Jemaat {
  id: string;
  nama: string;
}

/** Jemaat with its assigned labels embedded - a person can hold more than one. */
export interface JemaatWithLabels extends Jemaat {
  labels: LabelJemaat[];
}

export interface PeribadahanItem {
  id: string;
  category_id: string;
  tanggal: string;
  jam: string | null;
  tempat_id: string | null;
  pelayan_firman_id: string | null;
  liturgos_id: string | null;
  wilayah_id: string | null;
  tema: string | null;
  dpa: string | null;
  catatan: string | null;
  kehadiran_laki_laki: number | null;
  kehadiran_perempuan: number | null;
  kehadiran_anak: number | null;
  /** Kebaktian SMKA only. */
  pemusik_id: string | null;
  bahan_alkitab: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** The 8 fixed attendance groups tracked for Kebaktian SMKA. The last two
 * (Guru Sekolah Minggu, Orang Tua) have no PF - only attendance counts. */
export const SMKA_KELOMPOK_OPTIONS = [
  { value: "batita", label: "Kelas Batita", hasPf: true },
  { value: "balita", label: "Kelas Balita", hasPf: true },
  { value: "kecil", label: "Kelas Kecil", hasPf: true },
  { value: "tanggung", label: "Kelas Tanggung", hasPf: true },
  { value: "besar", label: "Kelas Besar", hasPf: true },
  { value: "tunas_remaja", label: "Kelas Tunas Remaja", hasPf: true },
  { value: "guru_sekolah_minggu", label: "Guru Sekolah Minggu", hasPf: false },
  { value: "orang_tua", label: "Orang Tua", hasPf: false },
] as const;

export type SmkaKelompokKey = (typeof SMKA_KELOMPOK_OPTIONS)[number]["value"];

export interface SmkaKelompok {
  id: string;
  item_id: string;
  /** One of SmkaKelompokKey at runtime (enforced by a DB check constraint) -
   * left as a plain string here since it comes straight off a Supabase
   * query, which can't statically narrow it. */
  kelompok: string;
  pf_id: string | null;
  laki_laki: number | null;
  perempuan: number | null;
}

export interface SmkaKelompokWithPf extends SmkaKelompok {
  pf: Pick<Jemaat, "id" | "nama"> | null;
}

/** Item with its relations embedded, for display and editing. Which fields
 * are actually shown depends on the category - see peribadahan-editor.tsx. */
export interface PeribadahanItemWithRelations extends PeribadahanItem {
  category: Pick<PeribadahanCategory, "id" | "key" | "name" | "sort_order"> | null;
  tempat: Pick<Tempat, "id" | "nama"> | null;
  pelayan_firman: Pick<Jemaat, "id" | "nama"> | null;
  liturgos: Pick<Jemaat, "id" | "nama"> | null;
  wilayah: Pick<Wilayah, "id" | "nama"> | null;
  pemusik: Pick<Jemaat, "id" | "nama"> | null;
  /** Only populated for Kebaktian SMKA items. */
  smka_kelompok?: SmkaKelompokWithPf[];
}

export interface LitbangCategory {
  id: string;
  key: string;
  name: string;
  deskripsi: string | null;
  sort_order: number;
  updated_at: string;
}

export interface WartaLitbangItem {
  id: string;
  warta_id: string;
  litbang_category_id: string | null;
  name: string;
  deskripsi: string | null;
  sort_order: number;
}

export interface SaranaDanaItem {
  id: string;
  key: string;
  name: string;
  saldo_awal: number;
  keterangan: string | null;
  updated_at: string;
}

export type SaranaDanaTransactionType = "masuk" | "keluar";

export interface SaranaDanaTransaction {
  id: string;
  item_id: string;
  tanggal: string;
  tipe: SaranaDanaTransactionType;
  jumlah: number;
  keterangan: string | null;
  created_by: string | null;
  created_at: string;
}

/** Computed saldo_awal + sum(masuk) - sum(keluar), from the sarana_dana_balances view. */
export interface SaranaDanaBalance {
  id: string;
  key: string;
  name: string;
  keterangan: string | null;
  saldo: number;
}

export interface WartaKesaksianItem {
  id: string;
  warta_id: string;
  judul: string;
  deskripsi: string | null;
  sort_order: number;
}

export interface WartaWithChildren extends Warta {
  litbangItems: WartaLitbangItem[];
  kesaksianItems: WartaKesaksianItem[];
}
