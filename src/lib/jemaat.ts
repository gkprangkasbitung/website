import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const JEMAAT_SELECT_WITH_LABELS =
  "id, nama, created_at, jemaat_labels(label:label_jemaat(id, nama, sort_order))";

export const JEMAAT_SELECT_FULL = `
  id, nama, created_at,
  jenis_kelamin, alamat, wilayah_id, no_hp, tanggal_lahir, tanggal_masuk, sudah_baptis, sudah_sidi,
  keluarga_id, hubungan_keluarga, status_keanggotaan, pekerjaan, nomor_anggota,
  jemaat_labels(label:label_jemaat(id, nama, sort_order)),
  wilayah(id, nama),
  keluarga(id, nama)
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

/**
 * Resolves a family name to a `keluarga` row, creating it if it doesn't
 * already exist (matched case-insensitively so "Kel. Saragih" and
 * "kel. saragih" reuse the same family instead of fragmenting it).
 */
export async function findOrCreateKeluarga(
  supabase: SupabaseClient<Database>,
  nama: string,
): Promise<{ id: string } | { error: string }> {
  const trimmed = nama.trim();
  if (!trimmed) return { error: "Nama keluarga wajib diisi" };

  const { data: existing } = await supabase
    .from("keluarga")
    .select("id")
    .ilike("nama", trimmed)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const { data: created, error } = await supabase
    .from("keluarga")
    .insert({ nama: trimmed })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "Gagal membuat keluarga" };
  }

  return { id: created.id };
}
