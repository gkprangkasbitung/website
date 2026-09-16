import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";
import type { Database } from "@/types/database";

type SaranaDanaTransactionUpdate = Database["public"]["Tables"]["sarana_dana_transactions"]["Update"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; transactionId: string }> },
) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: itemId, transactionId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const update: SaranaDanaTransactionUpdate = {};
  if ("tanggal" in body) update.tanggal = body.tanggal;
  if ("keterangan" in body) update.keterangan = body.keterangan;
  if ("tipe" in body) {
    if (body.tipe !== "masuk" && body.tipe !== "keluar") {
      return NextResponse.json({ error: "Tipe harus 'masuk' atau 'keluar'" }, { status: 400 });
    }
    update.tipe = body.tipe;
  }
  if ("jumlah" in body) {
    const jumlah = Number(body.jumlah);
    if (!Number.isFinite(jumlah) || jumlah < 0) {
      return NextResponse.json({ error: "Jumlah tidak valid" }, { status: 400 });
    }
    update.jumlah = jumlah;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sarana_dana_transactions")
    .update(update)
    .eq("id", transactionId)
    .eq("item_id", itemId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "sarana_dana",
    activity: `Mengubah transaksi ${data.tipe === "masuk" ? "pemasukan" : "pengeluaran"} ${formatRupiah(data.jumlah)}`,
  });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; transactionId: string }> },
) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: itemId, transactionId } = await params;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("sarana_dana_transactions")
    .select("tipe, jumlah")
    .eq("id", transactionId)
    .eq("item_id", itemId)
    .maybeSingle();
  const { error } = await supabase
    .from("sarana_dana_transactions")
    .delete()
    .eq("id", transactionId)
    .eq("item_id", itemId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    userId: auth.user.id,
    userEmail: auth.user.email,
    module: "sarana_dana",
    activity: existing
      ? `Menghapus transaksi ${existing.tipe === "masuk" ? "pemasukan" : "pengeluaran"} ${formatRupiah(existing.jumlah)}`
      : "Menghapus transaksi",
  });

  return NextResponse.json({ ok: true });
}
