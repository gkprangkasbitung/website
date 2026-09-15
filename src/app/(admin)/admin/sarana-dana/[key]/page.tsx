import { notFound } from "next/navigation";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { SaranaDanaLedger } from "@/components/admin/sarana-dana-ledger";
import { formatRupiah } from "@/lib/format";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { SaldoAwalForm } from "./saldo-awal-form";

export default async function SaranaDanaLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const { key } = await params;
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("sarana_dana_items")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (!item) {
    notFound();
  }

  const [{ data: balance }, { data: transactions, count }] = await Promise.all([
    supabase.from("sarana_dana_balances").select("*").eq("id", item.id).single(),
    supabase
      .from("sarana_dana_transactions")
      .select("*", { count: "exact" })
      .eq("item_id", item.id)
      .order("tanggal", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to),
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

      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="transaksi" />
    </div>
  );
}
