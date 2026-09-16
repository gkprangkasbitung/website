import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const nama = body?.nama;

  if (typeof nama !== "string" || !nama.trim()) {
    return NextResponse.json({ error: "Nama keluarga wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("keluarga")
    .select("id")
    .ilike("nama", nama.trim())
    .neq("id", id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Nama keluarga sudah digunakan" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("keluarga")
    .update({ nama: nama.trim() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "jemaat",
    activity: `Mengubah nama keluarga menjadi "${data.nama}"`,
  });

  return NextResponse.json({ data });
}

/**
 * Deleting a keluarga leaves its members behind (the FK is `on delete set
 * null`) - their `hubungan_keluarga` is cleared too here since a relation
 * label without the family it was relative to is meaningless.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: existing } = await supabase.from("keluarga").select("nama").eq("id", id).maybeSingle();

  await supabase.from("jemaat").update({ hubungan_keluarga: null }).eq("keluarga_id", id);
  const { error } = await supabase.from("keluarga").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "jemaat",
    activity: `Menghapus keluarga "${existing?.nama ?? id}"`,
  });

  return NextResponse.json({ ok: true });
}
