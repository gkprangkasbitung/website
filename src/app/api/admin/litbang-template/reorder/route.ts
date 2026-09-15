import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Persists a new drag-and-drop order: `ids` is the full list of category
 * ids in their new order, and each one's sort_order becomes its index.
 */
export async function POST(request: Request) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const ids = body?.ids;

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "ids wajib berupa array" }, { status: 400 });
  }

  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id: string, index: number) =>
      supabase.from("litbang_categories").update({ sort_order: index }).eq("id", id),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
