import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: itemId } = await params;
  const body = await request.json().catch(() => null);
  const tanggal = body?.tanggal;
  let tipe = body?.tipe;
  const jumlah = Number(body?.jumlah);
  const jemaatId = body?.jemaat_id;

  if (typeof tanggal !== "string" || !tanggal) {
    return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });
  }
  if (!Number.isFinite(jumlah) || jumlah < 0) {
    return NextResponse.json({ error: "Jumlah tidak valid" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("sarana_dana_items")
    .select("key, name")
    .eq("id", itemId)
    .maybeSingle();

  // Persembahan Bulanan only ever records income - enforced server-side so
  // the client-side restriction can't be bypassed.
  const isPersembahan = item?.key === "persembahan_bulanan";
  if (isPersembahan) {
    tipe = "masuk";
  }

  if (tipe !== "masuk" && tipe !== "keluar") {
    return NextResponse.json({ error: "Tipe harus 'masuk' atau 'keluar'" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sarana_dana_transactions")
    .insert({
      item_id: itemId,
      tanggal,
      tipe,
      jumlah,
      keterangan: body?.keterangan ?? null,
      jemaat_id: isPersembahan && typeof jemaatId === "string" ? jemaatId : null,
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "sarana_dana",
    activity: `Menambah transaksi ${tipe === "masuk" ? "pemasukan" : "pengeluaran"} ${formatRupiah(jumlah)} pada "${item?.name ?? itemId}"`,
  });

  return NextResponse.json({ data }, { status: 201 });
}
