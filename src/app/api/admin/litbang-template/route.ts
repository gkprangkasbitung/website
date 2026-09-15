import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Adds a new card to the Litbang template. New warta created afterwards
 * will include it (as long as it's active) - see the copy-on-create logic
 * in POST /api/admin/warta.
 */
export async function POST(request: Request) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("litbang_categories")
    .select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("litbang_categories")
    .insert({
      name: name.trim(),
      deskripsi: body?.deskripsi ?? null,
      sort_order: count ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
