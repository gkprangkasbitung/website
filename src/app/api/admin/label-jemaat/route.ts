import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requirePermissionApi("warta", "read");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("label_jemaat").select("*").order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const nama = body?.nama;

  if (typeof nama !== "string" || !nama.trim()) {
    return NextResponse.json({ error: "Nama label wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();
  const { count } = await supabase.from("label_jemaat").select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("label_jemaat")
    .insert({ nama: nama.trim(), sort_order: count ?? 0 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
