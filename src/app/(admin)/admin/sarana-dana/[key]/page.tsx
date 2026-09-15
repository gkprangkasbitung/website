import { notFound } from "next/navigation";
import { SaranaDanaLedger } from "@/components/admin/sarana-dana-ledger";
import { formatRupiah } from "@/lib/format";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { SaldoAwalForm } from "./saldo-awal-form";

export default async function SaranaDanaLedgerPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const { key } = await params;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("sarana_dana_items")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (!item) {
    notFound();
  }

  const [{ data: balance }, { data: transactions }] = await Promise.all([
    supabase.from("sarana_dana_balances").select("*").eq("id", item.id).single(),
    supabase
      .from("sarana_dana_transactions")
      .select("*")
      .eq("item_id", item.id)
      .order("tanggal", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{item.name}</h1>
        <p className="text-muted-foreground">
          Catatan pemasukan dan pengeluaran. Saldo saat ini dihitung otomatis dari saldo awal
          ditambah semua transaksi di bawah.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">Saldo Saat Ini</p>
        <p className="text-2xl font-semibold">{formatRupiah(balance?.saldo ?? item.saldo_awal)}</p>
      </div>

      {canEdit && <SaldoAwalForm itemId={item.id} saldoAwal={item.saldo_awal} />}

      <SaranaDanaLedger itemId={item.id} transactions={transactions ?? []} disabled={!canEdit} />
    </div>
  );
}
