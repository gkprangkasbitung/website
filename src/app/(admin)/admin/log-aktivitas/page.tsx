import { PaginationBar } from "@/components/admin/pagination-bar";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
import { TableDateRangeFilter } from "@/components/admin/table-date-range-filter";
import { TableEmptyState } from "@/components/admin/table-empty-state";
import { TableSearchInput } from "@/components/admin/table-search-input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatWaktu } from "@/lib/date";
import { parsePageSize } from "@/lib/pagination";
import { requirePermission } from "@/lib/rbac/dal";
import { parseSortDir, parseSortKey } from "@/lib/sort";
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_MODULE_LABEL, type ActivityModule } from "@/types/activity-log";

const SORT_COLUMNS = ["created_at", "module"] as const;

function moduleLabel(module: string): string {
  return ACTIVITY_MODULE_LABEL[module as ActivityModule] ?? module;
}

export default async function ActivityLogPage({
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
  await requirePermission("activity_log", "read");

  const { page: pageParam, pageSize: pageSizeParam, sort, dir, q, from, to } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const sortKey = parseSortKey(sort, SORT_COLUMNS) ?? "created_at";
  // Unlike other admin tables, "unsorted" here should mean "newest first",
  // not the ascending default parseSortDir() falls back to.
  const sortDir = dir === undefined ? "desc" : parseSortDir(dir);

  const supabase = await createClient();
  let query = supabase.from("activity_logs").select("*", { count: "exact" });

  if (q) {
    query = query.or(`activity.ilike.%${q}%,user_email.ilike.%${q}%`);
  }
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const { data: logs, count } = await query
    .order(sortKey, { ascending: sortDir === "asc" })
    .range(rangeFrom, rangeTo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Log Aktivitas</h1>
        <p className="text-muted-foreground">
          Riwayat aktivitas yang tercatat otomatis setiap ada perubahan data di admin - siapa yang
          melakukan, apa yang dilakukan, dan dari mana. Catatan ini tidak bisa diedit atau dihapus.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <TableSearchInput placeholder="Cari aktivitas atau email..." />
        <TableDateRangeFilter />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="created_at" align="right">Waktu</SortableTableHead>
            <TableHead>Pengguna</TableHead>
            <SortableTableHead sortKey="module">Modul</SortableTableHead>
            <TableHead>Aktivitas</TableHead>
            <TableHead>IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(logs ?? []).map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-right whitespace-nowrap tabular-nums">{formatWaktu(log.created_at)}</TableCell>
              <TableCell>{log.user_email ?? "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary">{moduleLabel(log.module)}</Badge>
              </TableCell>
              <TableCell>{log.activity}</TableCell>
              <TableCell className="whitespace-nowrap">{log.ip_address ?? "-"}</TableCell>
            </TableRow>
          ))}
          {(logs ?? []).length === 0 && <TableEmptyState colSpan={5}>Belum ada aktivitas.</TableEmptyState>}
        </TableBody>
      </Table>

      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="aktivitas" />
    </div>
  );
}
