import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Adds a pastoral care note to one jemaat. Notes are an append-only log
 * (no PATCH/DELETE) - a wrong entry should be corrected by adding a new
 * note, not by editing history.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: jemaatId } = await params;
  const body = await request.json().catch(() => null);
  const jenis = body?.jenis;
  const isi = body?.isi;
  const tanggal = body?.tanggal;

  if (typeof jenis !== "string" || !jenis.trim()) {
    return NextResponse.json({ error: "Jenis catatan wajib diisi" }, { status: 400 });
  }
  if (typeof isi !== "string" || !isi.trim()) {
    return NextResponse.json({ error: "Isi catatan wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: jemaat } = await supabase.from("jemaat").select("nama").eq("id", jemaatId).maybeSingle();

  const { data, error } = await supabase
    .from("jemaat_catatan_pastoral")
    .insert({
      jemaat_id: jemaatId,
      jenis: jenis.trim(),
      isi: isi.trim(),
      tanggal: typeof tanggal === "string" && tanggal ? tanggal : new Date().toISOString().slice(0, 10),
      penulis_id: auth.user.id,
      penulis_nama: auth.user.profile?.full_name ?? auth.user.email,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "jemaat",
    activity: `Menambah catatan pastoral untuk "${jemaat?.nama ?? jemaatId}"`,
  });

  return NextResponse.json({ data }, { status: 201 });
}
