import { notFound } from "next/navigation";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { SaranaDanaLedger } from "@/components/admin/sarana-dana-ledger";
import { TableDateRangeFilter } from "@/components/admin/table-date-range-filter";
import { TableSearchInput } from "@/components/admin/table-search-input";
import { flattenJemaatLabels, JEMAAT_SELECT_WITH_LABELS } from "@/lib/jemaat";
import { formatRupiah } from "@/lib/format";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { parseSortDir, parseSortKey } from "@/lib/sort";
import { createClient } from "@/lib/supabase/server";
import { SaldoAwalForm } from "./saldo-awal-form";

const SORT_COLUMNS = ["tanggal", "tipe", "jumlah", "keterangan"] as const;

export default async function SaranaDanaLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sort?: string;
    dir?: string;
    q?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const { key } = await params;
  const { page: pageParam, pageSize: pageSizeParam, sort, dir, q, from, to } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const sortKey = parseSortKey(sort, SORT_COLUMNS) ?? "tanggal";
  const sortDir = parseSortDir(dir);

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("sarana_dana_items")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (!item) {
    notFound();
  }

  let transactionsQuery = supabase
    .from("sarana_dana_transactions")
    .select("*, jemaat(id, nama)", { count: "exact" })
    .eq("item_id", item.id);

  if (q) transactionsQuery = transactionsQuery.ilike("keterangan", `%${q}%`);
  if (from) transactionsQuery = transactionsQuery.gte("tanggal", from);
  if (to) transactionsQuery = transactionsQuery.lte("tanggal", to);

  const [{ data: balance }, { data: transactions, count }, { data: jemaatList }] = await Promise.all([
    supabase.from("sarana_dana_balances").select("*").eq("id", item.id).single(),
    transactionsQuery
      .order(sortKey, { ascending: sortDir === "asc" })
      .order("created_at", { ascending: false })
      .range(rangeFrom, rangeTo),
    supabase.from("jemaat").select(JEMAAT_SELECT_WITH_LABELS).order("nama"),
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

      <div className="flex flex-wrap items-end justify-between gap-4">
        <TableSearchInput placeholder="Cari keterangan..." />
        <TableDateRangeFilter />
      </div>

      <SaranaDanaLedger
        itemId={item.id}
        itemKey={item.key}
        transactions={transactions ?? []}
        jemaatList={flattenJemaatLabels(jemaatList ?? [])}
        disabled={!canEdit}
      />

      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="transaksi" />
    </div>
  );
}
