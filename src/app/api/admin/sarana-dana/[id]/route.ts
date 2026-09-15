import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SaranaDanaUpdate = Database["public"]["Tables"]["sarana_dana_items"]["Update"];

/**
 * Updates one Sarana & Dana item. Shared row, same live-sync model as
 * Peribadahan: editable from /admin/sarana-dana or inline from a warta.
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

  const update: SaranaDanaUpdate = { updated_at: new Date().toISOString() };
  if ("nominal" in body) {
    const nominal = Number(body.nominal);
    if (Number.isNaN(nominal)) {
      return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 });
    }
    update.nominal = nominal;
  }
  if ("keterangan" in body) update.keterangan = body.keterangan;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sarana_dana_items")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
