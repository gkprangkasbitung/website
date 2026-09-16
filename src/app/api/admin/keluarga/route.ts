import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const nama = body?.nama;

  if (typeof nama !== "string" || !nama.trim()) {
    return NextResponse.json({ error: "Nama keluarga wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("keluarga")
    .select("id")
    .ilike("nama", nama.trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Nama keluarga sudah digunakan" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("keluarga")
    .insert({ nama: nama.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "jemaat",
    activity: `Menambah keluarga "${data.nama}"`,
  });

  return NextResponse.json({ data }, { status: 201 });
}
