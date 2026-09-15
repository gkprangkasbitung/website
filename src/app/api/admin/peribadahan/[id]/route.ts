import { NextResponse } from "next/server";
import { PERIBADAHAN_ITEM_SELECT } from "@/lib/peribadahan";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type PeribadahanItemUpdate = Database["public"]["Tables"]["peribadahan_items"]["Update"];

const FIELDS = ["category_id", "label", "hari", "jam", "tempat_id", "petugas_id"] as const;

/**
 * Updates or removes one Peribadahan item. Shared row - editable from
 * /admin/peribadahan or inline from a warta, both hitting the same table.
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
  const { data, error } = await supabase
    .from("peribadahan_items")
    .update(update)
    .eq("id", id)
    .select(PERIBADAHAN_ITEM_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("peribadahan_items").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
