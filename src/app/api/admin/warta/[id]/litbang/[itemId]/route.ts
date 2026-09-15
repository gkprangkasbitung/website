import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type WartaLitbangItemUpdate = Database["public"]["Tables"]["warta_litbang_items"]["Update"];

const FIELDS = ["name", "hari", "jam", "tempat", "petugas"] as const;

/**
 * Edits one litbang row that belongs to a single warta. This never touches
 * litbang_categories (the master template) or any other warta's rows.
 */
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

  const update: WartaLitbangItemUpdate = {};
  for (const field of FIELDS) {
    if (field in body) update[field] = body[field];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("warta_litbang_items")
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
