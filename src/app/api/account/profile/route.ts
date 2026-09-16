import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Self-service profile update - any signed-in user may edit their own name. */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fullName = body?.full_name;

  if (typeof fullName !== "string") {
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName.trim() || null })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
