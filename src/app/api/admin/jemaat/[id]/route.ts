import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { JEMAAT_SELECT_FULL, flattenJemaatLabels } from "@/lib/jemaat";
import type { Database } from "@/types/database";

type JemaatUpdate = Database["public"]["Tables"]["jemaat"]["Update"];

const PROFILE_FIELDS = [
  "jenis_kelamin",
  "alamat",
  "wilayah_id",
  "no_hp",
  "tanggal_lahir",
  "tanggal_masuk",
  "sudah_baptis",
  "sudah_sidi",
] as const;

function pickProfileFields(body: Record<string, unknown>) {
  const update: JemaatUpdate = {};
  for (const field of PROFILE_FIELDS) {
    if (field in body) {
      // @ts-expect-error - narrow whitelist of known Jemaat columns, value shape matches Update
      update[field] = body[field];
    }
  }
  return update;
}

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

  const update: JemaatUpdate = pickProfileFields(body);
  if ("nama" in body) {
    update.nama = body.nama;
  }
  if (Object.keys(update).length > 0) {
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
    .select(JEMAAT_SELECT_FULL)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "jemaat",
    activity: `Mengubah jemaat "${data.nama}"`,
  });

  return NextResponse.json({ data: flattenJemaatLabels([data])[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: existing } = await supabase.from("jemaat").select("nama").eq("id", id).maybeSingle();
  const { error } = await supabase.from("jemaat").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "jemaat",
    activity: `Menghapus jemaat "${existing?.nama ?? id}"`,
  });

  return NextResponse.json({ ok: true });
}
