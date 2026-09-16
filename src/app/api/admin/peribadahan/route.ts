import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { PERIBADAHAN_ITEM_SELECT } from "@/lib/peribadahan";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Lists Peribadahan items, optionally filtered to one date (`?tanggal=`).
 * This is the same table read by /admin/peribadahan and by every warta's
 * Peribadahan section - there is no per-warta copy.
 */
export async function GET(request: Request) {
  const auth = await requirePermissionApi("warta", "read");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const tanggal = searchParams.get("tanggal");

  const supabase = await createClient();
  let query = supabase
    .from("peribadahan_items")
    .select(PERIBADAHAN_ITEM_SELECT)
    .order("sort_order");

  if (tanggal) query = query.eq("tanggal", tanggal);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const categoryId = body?.category_id;
  const tanggal = body?.tanggal;

  if (typeof categoryId !== "string" || !categoryId) {
    return NextResponse.json({ error: "Jenis wajib dipilih" }, { status: 400 });
  }
  if (typeof tanggal !== "string" || !tanggal) {
    return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("peribadahan_items")
    .select("id", { count: "exact", head: true })
    .eq("tanggal", tanggal);

  const { data, error } = await supabase
    .from("peribadahan_items")
    .insert({
      category_id: categoryId,
      tanggal,
      jam: body?.jam ?? null,
      tempat_id: body?.tempat_id ?? null,
      pelayan_firman_id: body?.pelayan_firman_id ?? null,
      liturgos_id: body?.liturgos_id ?? null,
      wilayah_id: body?.wilayah_id ?? null,
      tema: body?.tema ?? null,
      dpa: body?.dpa ?? null,
      catatan: body?.catatan ?? null,
      kehadiran_laki_laki: body?.kehadiran_laki_laki ?? null,
      kehadiran_perempuan: body?.kehadiran_perempuan ?? null,
      kehadiran_anak: body?.kehadiran_anak ?? null,
      pemusik_id: body?.pemusik_id ?? null,
      bahan_alkitab: body?.bahan_alkitab ?? null,
      sort_order: count ?? 0,
    })
    .select(PERIBADAHAN_ITEM_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "peribadahan",
    activity: `Menambah jadwal ${data.category?.name ?? "Peribadahan"} tanggal ${tanggal}`,
  });

  return NextResponse.json({ data }, { status: 201 });
}
