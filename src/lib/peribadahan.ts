import "server-only";

export const PERIBADAHAN_ITEM_SELECT =
  "*, category:peribadahan_categories(id, name, sort_order), tempat:tempat(id, nama), petugas:jemaat(id, nama)";
