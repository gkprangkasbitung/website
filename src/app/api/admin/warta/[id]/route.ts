import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type WartaUpdate = Database["public"]["Tables"]["warta"]["Update"];

const CORE_FIELDS = [
  "tanggal_kebaktian",
  "judul_kebaktian",
  "tema_kebaktian",
  "renungan_judul",
  "renungan_kitab",
  "renungan_isi",
  "renungan_sumber",
] as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "read");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("warta").select("*").eq("id", id).single();

  if (error || !data) {
    return NextResponse.json({ error: "Warta tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

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

  const update: WartaUpdate = { updated_at: new Date().toISOString() };
  for (const field of CORE_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  if ("status" in body) {
    if (body.status !== "draft" && body.status !== "published") {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }
    update.status = body.status;
    update.published_at = body.status === "published" ? new Date().toISOString() : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("warta")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const activity =
    "status" in body
      ? `${body.status === "published" ? "Mempublikasikan" : "Membatalkan publikasi"} warta "${data.judul_kebaktian}"`
      : `Mengubah warta "${data.judul_kebaktian}"`;

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "warta",
    activity,
  });

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "delete");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("warta")
    .select("judul_kebaktian")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("warta").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "warta",
    activity: `Menghapus warta "${existing?.judul_kebaktian ?? id}"`,
  });

  return NextResponse.json({ ok: true });
}
