import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Reassigns a single user to exactly one role. Not wrapped in a DB
 * transaction (supabase-js doesn't expose multi-statement transactions) -
 * for a production app move this into a Postgres RPC function instead.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePermissionApi("users", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: userId } = await params;
  const body = await request.json().catch(() => null);
  const roleId = body?.roleId;

  if (typeof roleId !== "string" || !roleId) {
    return NextResponse.json({ error: "roleId wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role_id: roleId });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
