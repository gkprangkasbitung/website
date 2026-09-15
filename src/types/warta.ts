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
  label: string | null;
  hari: string | null;
  jam: string | null;
  tempat_id: string | null;
  petugas_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Item with its category/tempat/petugas embedded, for display and editing. */
export interface PeribadahanItemWithRelations extends PeribadahanItem {
  category: Pick<PeribadahanCategory, "id" | "name" | "sort_order"> | null;
  tempat: Pick<Tempat, "id" | "nama"> | null;
  petugas: Pick<Jemaat, "id" | "nama"> | null;
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
