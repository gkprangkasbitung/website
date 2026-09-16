import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePermissionApi("roles", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const { name, description } = body ?? {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .update({
      ...(typeof name === "string" ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "roles",
    activity: `Mengubah role "${data.name}"`,
  });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePermissionApi("roles", "delete");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: existing } = await supabase.from("roles").select("name").eq("id", id).maybeSingle();
  const { error } = await supabase.from("roles").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "roles",
    activity: `Menghapus role "${existing?.name ?? id}"`,
  });

  return NextResponse.json({ ok: true });
}
