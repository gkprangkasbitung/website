import { AddKeluargaDialog, KeluargaEditor } from "@/components/admin/keluarga-editor";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { TableSearchInput } from "@/components/admin/table-search-input";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { parseSortDir, parseSortKey } from "@/lib/sort";
import { createClient } from "@/lib/supabase/server";

const SORT_COLUMNS = ["nama"] as const;

export default async function KeluargaPage({
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
  let query = supabase.from("keluarga").select("*", { count: "exact" });

  if (q) query = query.ilike("nama", `%${q}%`);

  query = sortKey ? query.order(sortKey, { ascending: sortDir === "asc" }) : query.order("nama");

  const [{ data: keluargaRows, count }, { count: totalKeluarga }] = await Promise.all([
    query.range(rangeFrom, rangeTo),
    supabase.from("keluarga").select("id", { count: "exact", head: true }),
  ]);

  const keluargaIds = (keluargaRows ?? []).map((k) => k.id);
  const { data: memberRows } = keluargaIds.length
    ? await supabase.from("jemaat").select("nama, keluarga_id").in("keluarga_id", keluargaIds)
    : { data: [] };

  const membersByKeluarga = new Map<string, string[]>();
  for (const row of memberRows ?? []) {
    if (!row.keluarga_id) continue;
    const list = membersByKeluarga.get(row.keluarga_id) ?? [];
    list.push(row.nama);
    membersByKeluarga.set(row.keluarga_id, list);
  }

  const items = (keluargaRows ?? []).map((k) => ({
    ...k,
    members: membersByKeluarga.get(k.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Keluarga</h1>
        <p className="text-muted-foreground">
          {totalKeluarga ?? 0} kartu keluarga. Setiap jemaat bisa dikaitkan ke satu keluarga dengan
          hubungannya masing-masing - atur relasinya di halaman detail keluarga.
        </p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TableSearchInput placeholder="Cari nama keluarga..." />
        {canEdit && <AddKeluargaDialog />}
      </div>
      <KeluargaEditor items={items} disabled={!canEdit} />
      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="keluarga" />
    </div>
  );
}
