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

export interface JadwalFields {
  hari: string | null;
  jam: string | null;
  tempat: string | null;
  petugas: string | null;
}

export interface PeribadahanCategory extends JadwalFields {
  id: string;
  key: string;
  name: string;
  sort_order: number;
  updated_at: string;
}

export interface LitbangCategory extends JadwalFields {
  id: string;
  key: string;
  name: string;
  sort_order: number;
  updated_at: string;
}

export interface WartaLitbangItem extends JadwalFields {
  id: string;
  warta_id: string;
  litbang_category_id: string | null;
  name: string;
  sort_order: number;
}

export interface SaranaDanaItem {
  id: string;
  key: string;
  name: string;
  nominal: number;
  keterangan: string | null;
  updated_at: string;
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
