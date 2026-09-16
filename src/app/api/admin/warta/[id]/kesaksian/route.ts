import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: wartaId } = await params;
  const body = await request.json().catch(() => null);
  const judul = body?.judul;

  if (typeof judul !== "string" || !judul.trim()) {
    return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("warta_kesaksian_items")
    .select("id", { count: "exact", head: true })
    .eq("warta_id", wartaId);

  const { data, error } = await supabase
    .from("warta_kesaksian_items")
    .insert({
      warta_id: wartaId,
      judul: judul.trim(),
      deskripsi: body?.deskripsi ?? null,
      sort_order: count ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "warta",
    activity: `Menambah Kesaksian "${data.judul}" pada warta`,
  });

  return NextResponse.json({ data }, { status: 201 });
}
