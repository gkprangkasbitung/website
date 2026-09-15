import "server-only";

export const PERIBADAHAN_ITEM_SELECT = `*,
  category:peribadahan_categories(id, key, name, sort_order),
  tempat:tempat(id, nama),
  pelayan_firman:jemaat!peribadahan_items_pelayan_firman_id_fkey(id, nama),
  liturgos:jemaat!peribadahan_items_liturgos_id_fkey(id, nama),
  pemusik:jemaat!peribadahan_items_pemusik_id_fkey(id, nama),
  wilayah:wilayah(id, nama),
  smka_kelompok:peribadahan_smka_kelompok(id, item_id, kelompok, pf_id, laki_laki, perempuan, pf:jemaat(id, nama))`;
