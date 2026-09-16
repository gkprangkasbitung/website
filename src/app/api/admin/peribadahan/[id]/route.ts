import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { PERIBADAHAN_ITEM_SELECT } from "@/lib/peribadahan";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type PeribadahanItemUpdate = Database["public"]["Tables"]["peribadahan_items"]["Update"];
type SmkaKelompokUpsert = Database["public"]["Tables"]["peribadahan_smka_kelompok"]["Insert"];

const FIELDS = [
  "category_id",
  "jam",
  "tempat_id",
  "pelayan_firman_id",
  "liturgos_id",
  "wilayah_id",
  "tema",
  "dpa",
  "catatan",
  "kehadiran_laki_laki",
  "kehadiran_perempuan",
  "kehadiran_anak",
  "pemusik_id",
  "bahan_alkitab",
] as const;

/**
 * Updates or removes one Peribadahan item. Shared row - editable from
 * /admin/peribadahan or inline from a warta, both hitting the same table.
 * For Kebaktian SMKA, the body may also include `smka_kelompok`: an array
 * of {kelompok, pf_id, laki_laki, perempuan} rows to upsert alongside it.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const update: PeribadahanItemUpdate = { updated_at: new Date().toISOString() };
  for (const field of FIELDS) {
    if (field in body) update[field] = body[field];
  }

  const supabase = await createClient();
  const { error } = await supabase.from("peribadahan_items").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (Array.isArray(body.smka_kelompok)) {
    const rows: SmkaKelompokUpsert[] = body.smka_kelompok.map((row: SmkaKelompokUpsert) => ({
      item_id: id,
      kelompok: row.kelompok,
      pf_id: row.pf_id ?? null,
      laki_laki: row.laki_laki ?? null,
      perempuan: row.perempuan ?? null,
    }));

    const { error: kelompokError } = await supabase
      .from("peribadahan_smka_kelompok")
      .upsert(rows, { onConflict: "item_id,kelompok" });

    if (kelompokError) {
      return NextResponse.json(
        { error: `Tersimpan, tapi gagal simpan data kelompok: ${kelompokError.message}` },
        { status: 207 },
      );
    }
  }

  const { data, error: fetchError } = await supabase
    .from("peribadahan_items")
    .select(PERIBADAHAN_ITEM_SELECT)
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "peribadahan",
    activity: `Mengubah jadwal ${data.category?.name ?? "Peribadahan"} tanggal ${data.tanggal}`,
  });

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("peribadahan_items")
    .select(PERIBADAHAN_ITEM_SELECT)
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("peribadahan_items").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "peribadahan",
    activity: `Menghapus jadwal ${existing?.category?.name ?? "Peribadahan"} tanggal ${existing?.tanggal ?? id}`,
  });

  return NextResponse.json({ ok: true });
}
