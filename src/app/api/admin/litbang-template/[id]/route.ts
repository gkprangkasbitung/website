import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type LitbangCategoryUpdate = Database["public"]["Tables"]["litbang_categories"]["Update"];

const FIELDS = ["hari", "jam", "tempat", "petugas"] as const;

/**
 * Updates the master Litbang template. This only affects new warta created
 * afterwards (via the copy-on-create in POST /api/admin/warta) - existing
 * warta_litbang_items rows are untouched.
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

  const update: LitbangCategoryUpdate = { updated_at: new Date().toISOString() };
  for (const field of FIELDS) {
    if (field in body) update[field] = body[field];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("litbang_categories")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
