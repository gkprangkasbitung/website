import { PaginationBar } from "@/components/admin/pagination-bar";
import { JemaatEditor } from "@/components/admin/jemaat-editor";
import { JEMAAT_SELECT_WITH_LABELS, flattenJemaatLabels } from "@/lib/jemaat";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function JemaatPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const { page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const [{ data: jemaat, count }, { data: allLabels }] = await Promise.all([
    supabase
      .from("jemaat")
      .select(JEMAAT_SELECT_WITH_LABELS, { count: "exact" })
      .order("nama")
      .range(from, to),
    supabase.from("label_jemaat").select("*").order("sort_order"),
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
      <JemaatEditor items={flattenJemaatLabels(jemaat ?? [])} allLabels={allLabels ?? []} disabled={!canEdit} />
      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="jemaat" />
    </div>
  );
}
