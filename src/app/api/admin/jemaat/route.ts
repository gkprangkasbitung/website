import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { JEMAAT_SELECT_WITH_LABELS, flattenJemaatLabels } from "@/lib/jemaat";

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
    .insert({ nama: nama.trim() })
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

  return NextResponse.json({ data: jemaat }, { status: 201 });
}
