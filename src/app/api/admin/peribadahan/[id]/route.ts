import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type PeribadahanUpdate = Database["public"]["Tables"]["peribadahan_categories"]["Update"];

const FIELDS = ["hari", "jam", "tempat", "petugas"] as const;

/**
 * Updates one Peribadahan category. This is the single shared row read by
 * both the standalone /admin/peribadahan page and every warta - there is no
 * per-warta copy, so an edit here is visible everywhere immediately.
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

  const update: PeribadahanUpdate = { updated_at: new Date().toISOString() };
  for (const field of FIELDS) {
    if (field in body) update[field] = body[field];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("peribadahan_categories")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
