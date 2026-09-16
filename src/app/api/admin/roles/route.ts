import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requirePermissionApi("roles", "read");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, description, role_permissions(permissions(id, resource, action))")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requirePermissionApi("roles", "create");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name;
  const description = body?.description ?? null;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nama role wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .insert({ name: name.trim(), description })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "roles",
    activity: `Menambah role "${data.name}"`,
  });

  return NextResponse.json({ data }, { status: 201 });
}
