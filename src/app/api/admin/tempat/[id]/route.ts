import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type TempatUpdate = Database["public"]["Tables"]["tempat"]["Update"];

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

  const update: TempatUpdate = {};
  if ("nama" in body) update.nama = body.nama;
  if ("keterangan" in body) update.keterangan = body.keterangan;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tempat")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "tempat",
    activity: `Mengubah tempat "${data.nama}"`,
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
  const { data: existing } = await supabase.from("tempat").select("nama").eq("id", id).maybeSingle();
  const { error } = await supabase.from("tempat").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "tempat",
    activity: `Menghapus tempat "${existing?.nama ?? id}"`,
  });

  return NextResponse.json({ ok: true });
}
