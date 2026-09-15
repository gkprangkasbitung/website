import Link from "next/link";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
import { TableDateRangeFilter } from "@/components/admin/table-date-range-filter";
import { TableSearchInput } from "@/components/admin/table-search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { parseSortDir, parseSortKey } from "@/lib/sort";
import { createClient } from "@/lib/supabase/server";

const SORT_COLUMNS = ["tanggal_kebaktian", "judul_kebaktian", "status"] as const;

export default async function WartaListPage({
  searchParams,
}: {
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
  const canCreate = hasPermission(currentUser, "warta", "create");

  const { page: pageParam, pageSize: pageSizeParam, sort, dir, q, from, to } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const sortKey = parseSortKey(sort, SORT_COLUMNS) ?? "tanggal_kebaktian";
  const sortDir = parseSortDir(dir);

  const supabase = await createClient();
  let query = supabase
    .from("warta")
    .select("id, slug, status, tanggal_kebaktian, judul_kebaktian", { count: "exact" });

  if (q) query = query.ilike("judul_kebaktian", `%${q}%`);
  if (from) query = query.gte("tanggal_kebaktian", from);
  if (to) query = query.lte("tanggal_kebaktian", to);

  const { data: wartaList, count } = await query
    .order(sortKey, { ascending: sortDir === "asc" })
    .range(rangeFrom, rangeTo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Warta</h1>
          <p className="text-muted-foreground">Buletin ibadah mingguan.</p>
        </div>
        {canCreate && (
          <Button render={<Link href="/admin/warta/new" />} nativeButton={false}>
            Buat Warta Baru
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TableSearchInput placeholder="Cari judul..." />
        <TableDateRangeFilter label="Tanggal Kebaktian" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="tanggal_kebaktian">Tanggal</SortableTableHead>
            <SortableTableHead sortKey="judul_kebaktian">Judul</SortableTableHead>
            <SortableTableHead sortKey="status">Status</SortableTableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(wartaList ?? []).map((warta) => (
            <TableRow key={warta.id}>
              <TableCell>{warta.tanggal_kebaktian}</TableCell>
              <TableCell>{warta.judul_kebaktian}</TableCell>
              <TableCell>
                <Badge variant={warta.status === "published" ? "default" : "secondary"}>
                  {warta.status === "published" ? "Published" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/admin/warta/${warta.id}`} />}
                  nativeButton={false}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(wartaList ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-sm text-muted-foreground">
                Tidak ada warta yang cocok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="warta" />
    </div>
  );
}
