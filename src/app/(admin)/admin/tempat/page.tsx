import { PaginationBar } from "@/components/admin/pagination-bar";
import { TableSearchInput } from "@/components/admin/table-search-input";
import { TempatEditor } from "@/components/admin/tempat-editor";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { parseSortDir, parseSortKey } from "@/lib/sort";
import { createClient } from "@/lib/supabase/server";

const SORT_COLUMNS = ["nama", "keterangan"] as const;

export default async function TempatPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; sort?: string; dir?: string; q?: string }>;
}) {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const { page: pageParam, pageSize: pageSizeParam, sort, dir, q } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const sortKey = parseSortKey(sort, SORT_COLUMNS);
  const sortDir = parseSortDir(dir);

  const supabase = await createClient();
  let query = supabase.from("tempat").select("*", { count: "exact" });

  if (q) query = query.or(`nama.ilike.%${q}%,keterangan.ilike.%${q}%`);

  query = sortKey
    ? query.order(sortKey, { ascending: sortDir === "asc" })
    : query.order("sort_order");

  const { data: items, count } = await query.range(rangeFrom, rangeTo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tempat</h1>
        <p className="text-muted-foreground">
          Daftar lokasi yang bisa dipilih saat mengisi jadwal Bidang Peribadahan.
        </p>
      </div>
      <TableSearchInput placeholder="Cari nama/keterangan..." />
      <TempatEditor items={items ?? []} disabled={!canEdit} />
      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="tempat" />
    </div>
  );
}
