import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionApi("warta", "update");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const { id: itemId } = await params;
  const body = await request.json().catch(() => null);
  const tanggal = body?.tanggal;
  const tipe = body?.tipe;
  const jumlah = Number(body?.jumlah);

  if (typeof tanggal !== "string" || !tanggal) {
    return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });
  }
  if (tipe !== "masuk" && tipe !== "keluar") {
    return NextResponse.json({ error: "Tipe harus 'masuk' atau 'keluar'" }, { status: 400 });
  }
  if (!Number.isFinite(jumlah) || jumlah < 0) {
    return NextResponse.json({ error: "Jumlah tidak valid" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sarana_dana_transactions")
    .insert({
      item_id: itemId,
      tanggal,
      tipe,
      jumlah,
      keterangan: body?.keterangan ?? null,
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
