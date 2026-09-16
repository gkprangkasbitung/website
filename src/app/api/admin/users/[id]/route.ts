import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Deletes an auth user outright. profiles/user_roles rows cascade via their
 * FKs (on delete cascade) - nothing else to clean up here.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePermissionApi("users", "delete");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: userId } = await params;

  if (userId === auth.user.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "users",
    activity: `Menghapus pengguna "${existing?.email ?? userId}"`,
  });

  return NextResponse.json({ ok: true });
}
