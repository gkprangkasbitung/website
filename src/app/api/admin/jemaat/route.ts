import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { JEMAAT_SELECT_WITH_LABELS, flattenJemaatLabels } from "@/lib/jemaat";
import type { Database } from "@/types/database";

type JemaatInsert = Database["public"]["Tables"]["jemaat"]["Insert"];

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
  const update: Partial<JemaatInsert> = {};
  for (const field of PROFILE_FIELDS) {
    if (field in body) {
      // @ts-expect-error - narrow whitelist of known Jemaat columns, value shape matches Insert/Update
      update[field] = body[field];
    }
  }
  return update;
}

export async function GET() {
  const auth = await requirePermissionApi("warta", "read");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jemaat")
    .select(JEMAAT_SELECT_WITH_LABELS)
    .order("nama");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: flattenJemaatLabels(data ?? []) });
}

export async function POST(request: Request) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const nama = body?.nama;
  const labelIds: unknown = body?.label_ids;

  if (typeof nama !== "string" || !nama.trim()) {
    return NextResponse.json({ error: "Nama jemaat wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: jemaat, error: insertError } = await supabase
    .from("jemaat")
    .insert({ nama: nama.trim(), ...pickProfileFields(body ?? {}) })
    .select()
    .single();

  if (insertError || !jemaat) {
    return NextResponse.json({ error: insertError?.message ?? "Gagal menambah jemaat" }, { status: 400 });
  }

  if (Array.isArray(labelIds) && labelIds.length > 0) {
    const { error: labelsError } = await supabase
      .from("jemaat_labels")
      .insert(labelIds.map((labelId) => ({ jemaat_id: jemaat.id, label_id: labelId })));

    if (labelsError) {
      return NextResponse.json(
        { error: `Jemaat dibuat, tapi gagal menyimpan label: ${labelsError.message}` },
        { status: 207 },
      );
    }
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "jemaat",
    activity: `Menambah jemaat "${jemaat.nama}"`,
  });

  return NextResponse.json({ data: jemaat }, { status: 201 });
}
