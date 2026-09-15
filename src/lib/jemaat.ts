import "server-only";

export const JEMAAT_SELECT_WITH_LABELS =
  "id, nama, created_at, jemaat_labels(label:label_jemaat(id, nama, sort_order))";

type RawJemaatRow = {
  id: string;
  nama: string;
  created_at: string;
  jemaat_labels: { label: { id: string; nama: string; sort_order: number } | null }[];
};

/** Flattens the `jemaat_labels(label:label_jemaat(...))` embed into `labels: [...]`. */
export function flattenJemaatLabels(rows: RawJemaatRow[]) {
  return rows.map(({ jemaat_labels, ...jemaat }) => ({
    ...jemaat,
    labels: jemaat_labels.map((jl) => jl.label).filter((l): l is NonNullable<typeof l> => Boolean(l)),
  }));
}
