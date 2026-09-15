import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { JEMAAT_SELECT_WITH_LABELS, flattenJemaatLabels } from "@/lib/jemaat";
import type { Database } from "@/types/database";

type JemaatUpdate = Database["public"]["Tables"]["jemaat"]["Update"];

/**
 * Updates a jemaat's name and/or their full set of labels. `label_ids`, when
 * present, replaces every existing label assignment for this person (not a
 * transaction - see the same caveat on PATCH /api/admin/users/[id]/role).
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

  const supabase = await createClient();

  if ("nama" in body) {
    const update: JemaatUpdate = { nama: body.nama };
    const { error } = await supabase.from("jemaat").update(update).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  const labelIds: unknown = body?.label_ids;
  if (Array.isArray(labelIds)) {
    const { error: deleteError } = await supabase.from("jemaat_labels").delete().eq("jemaat_id", id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    if (labelIds.length > 0) {
      const { error: insertError } = await supabase
        .from("jemaat_labels")
        .insert(labelIds.map((labelId) => ({ jemaat_id: id, label_id: labelId })));
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
    }
  }

  const { data, error } = await supabase
    .from("jemaat")
    .select(JEMAAT_SELECT_WITH_LABELS)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: flattenJemaatLabels([data])[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("jemaat").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
