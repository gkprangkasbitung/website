import { PaginationBar } from "@/components/admin/pagination-bar";
import { JemaatEditor } from "@/components/admin/jemaat-editor";
import { TableSearchInput } from "@/components/admin/table-search-input";
import { JEMAAT_SELECT_FULL, flattenJemaatLabels } from "@/lib/jemaat";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { parseSortDir } from "@/lib/sort";
import { createClient } from "@/lib/supabase/server";
import type { JemaatProfile } from "@/types/warta";

export default async function JemaatPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; dir?: string; q?: string }>;
}) {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const { page: pageParam, pageSize: pageSizeParam, dir, q } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const sortDir = parseSortDir(dir);

  const supabase = await createClient();
  let jemaatQuery = supabase.from("jemaat").select(JEMAAT_SELECT_FULL, { count: "exact" });

  if (q) jemaatQuery = jemaatQuery.ilike("nama", `%${q}%`);

  const [{ data: jemaat, count }, { data: allLabels }, { data: allWilayah }] = await Promise.all([
    jemaatQuery.order("nama", { ascending: sortDir === "asc" }).range(rangeFrom, rangeTo),
    supabase.from("label_jemaat").select("*").order("sort_order"),
    supabase.from("wilayah").select("*").order("sort_order"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Jemaat</h1>
        <p className="text-muted-foreground">
          Daftar nama yang bisa dipilih sebagai Petugas saat mengisi jadwal Bidang Peribadahan.
          Satu jemaat bisa punya lebih dari satu label - kelola daftar labelnya di halaman{" "}
          <span className="font-medium">Label Jemaat</span>.
        </p>
      </div>
      <TableSearchInput placeholder="Cari nama..." />
      <JemaatEditor
        items={flattenJemaatLabels(jemaat ?? []) as JemaatProfile[]}
        allLabels={allLabels ?? []}
        allWilayah={allWilayah ?? []}
        disabled={!canEdit}
      />
      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="jemaat" />
    </div>
  );
}
