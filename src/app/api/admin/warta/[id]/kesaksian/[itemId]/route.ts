import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type WartaKesaksianItemUpdate = Database["public"]["Tables"]["warta_kesaksian_items"]["Update"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: wartaId, itemId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const update: WartaKesaksianItemUpdate = {};
  if ("judul" in body) update.judul = body.judul;
  if ("deskripsi" in body) update.deskripsi = body.deskripsi;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("warta_kesaksian_items")
    .update(update)
    .eq("id", itemId)
    .eq("warta_id", wartaId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: wartaId, itemId } = await params;
  const supabase = await createClient();
  const { error } = await supabase
    .from("warta_kesaksian_items")
    .delete()
    .eq("id", itemId)
    .eq("warta_id", wartaId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
