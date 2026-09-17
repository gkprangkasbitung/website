import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type JemaatCatatanPastoralUpdate = Database["public"]["Tables"]["jemaat_catatan_pastoral"]["Update"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; catatanId: string }> },
) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: jemaatId, catatanId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  if ("jenis" in body && (typeof body.jenis !== "string" || !body.jenis.trim())) {
    return NextResponse.json({ error: "Jenis catatan wajib diisi" }, { status: 400 });
  }
  if ("isi" in body && (typeof body.isi !== "string" || !body.isi.trim())) {
    return NextResponse.json({ error: "Isi catatan wajib diisi" }, { status: 400 });
  }

  const update: JemaatCatatanPastoralUpdate = {};
  if ("jenis" in body) update.jenis = body.jenis.trim();
  if ("isi" in body) update.isi = body.isi.trim();
  if ("tanggal" in body) update.tanggal = body.tanggal;

  const supabase = await createClient();
  const [{ data: jemaat }, { data, error }] = await Promise.all([
    supabase.from("jemaat").select("nama").eq("id", jemaatId).maybeSingle(),
    supabase
      .from("jemaat_catatan_pastoral")
      .update(update)
      .eq("id", catatanId)
      .eq("jemaat_id", jemaatId)
      .select()
      .single(),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "jemaat",
    activity: `Mengubah catatan pastoral untuk "${jemaat?.nama ?? jemaatId}"`,
  });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; catatanId: string }> },
) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: jemaatId, catatanId } = await params;
  const supabase = await createClient();
  const { data: jemaat } = await supabase.from("jemaat").select("nama").eq("id", jemaatId).maybeSingle();
  const { error } = await supabase
    .from("jemaat_catatan_pastoral")
    .delete()
    .eq("id", catatanId)
    .eq("jemaat_id", jemaatId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "jemaat",
    activity: `Menghapus catatan pastoral untuk "${jemaat?.nama ?? jemaatId}"`,
  });

  return NextResponse.json({ ok: true });
}
