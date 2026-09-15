import "server-only";

export const JEMAAT_SELECT_WITH_LABELS =
  "id, nama, created_at, jemaat_labels(label:label_jemaat(id, nama, sort_order))";

export const JEMAAT_SELECT_FULL = `
  id, nama, created_at,
  jenis_kelamin, alamat, wilayah_id, no_hp, tanggal_lahir, tanggal_masuk, sudah_baptis, sudah_sidi,
  jemaat_labels(label:label_jemaat(id, nama, sort_order)),
  wilayah(id, nama)
`;

type WithJemaatLabels = {
  jemaat_labels: { label: { id: string; nama: string; sort_order: number } | null }[];
};

/** Flattens the `jemaat_labels(label:label_jemaat(...))` embed into `labels: [...]`. */
export function flattenJemaatLabels<T extends WithJemaatLabels>(rows: T[]) {
  return rows.map(({ jemaat_labels, ...jemaat }) => ({
    ...jemaat,
    labels: jemaat_labels.map((jl) => jl.label).filter((l): l is NonNullable<typeof l> => Boolean(l)),
  }));
}
