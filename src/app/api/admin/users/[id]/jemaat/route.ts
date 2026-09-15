import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Links (or unlinks) a login account to a jemaat roster entry. jemaatId may
 * be null to remove the link - the account keeps working, it just no
 * longer represents a specific congregation member.
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
  if (!body || !("jemaatId" in body)) {
    return NextResponse.json({ error: "jemaatId wajib diisi" }, { status: 400 });
  }

  const jemaatId = body.jemaatId;
  if (jemaatId !== null && typeof jemaatId !== "string") {
    return NextResponse.json({ error: "jemaatId tidak valid" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ jemaat_id: jemaatId })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
