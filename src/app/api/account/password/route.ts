import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

/** Self-service password change - any signed-in user may change their own password. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const password = body?.password;
  const confirm = body?.confirm;

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }
  if (password !== confirm) {
    return NextResponse.json({ error: "Konfirmasi password tidak cocok" }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: user.id,
    userEmail: user.email ?? null,
    module: "akun",
    activity: "Mengganti password",
  });

  return NextResponse.json({ ok: true });
}
