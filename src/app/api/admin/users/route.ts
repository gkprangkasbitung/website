import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Invites a new admin/staff account by email (Supabase sends the invite
 * link). The profiles row is created automatically by the handle_new_user
 * trigger before this handler continues, so the role/jemaat assignment
 * below can rely on it already existing.
 */
export async function POST(request: Request) {
  const auth = await requirePermissionApi("users", "create");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
  }

  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const roleId = typeof body?.roleId === "string" && body.roleId ? body.roleId : null;
  const jemaatId = typeof body?.jemaatId === "string" && body.jemaatId ? body.jemaatId : null;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { origin } = new URL(request.url);

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: fullName ? { full_name: fullName } : undefined,
    redirectTo: `${origin}/auth/callback?next=/auth/set-password`,
  });

  if (inviteError || !invited.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "Gagal mengundang pengguna" },
      { status: 400 },
    );
  }

  const userId = invited.user.id;

  if (roleId) {
    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role_id: roleId });
    if (roleError) {
      return NextResponse.json(
        { error: `Pengguna diundang, tapi gagal set role: ${roleError.message}` },
        { status: 207 },
      );
    }
  }

  if (jemaatId) {
    const { error: jemaatError } = await admin
      .from("profiles")
      .update({ jemaat_id: jemaatId })
      .eq("id", userId);
    if (jemaatError) {
      return NextResponse.json(
        { error: `Pengguna diundang, tapi gagal hubungkan jemaat: ${jemaatError.message}` },
        { status: 207 },
      );
    }
  }

  return NextResponse.json({ data: { id: userId, email: invited.user.email } }, { status: 201 });
}
