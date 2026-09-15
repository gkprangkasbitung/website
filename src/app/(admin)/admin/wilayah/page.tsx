import { PaginationBar } from "@/components/admin/pagination-bar";
import { WilayahEditor } from "@/components/admin/wilayah-editor";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function WilayahPage({
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
  const { data: items, count } = await supabase
    .from("wilayah")
    .select("*", { count: "exact" })
    .order("sort_order")
    .range(from, to);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Wilayah</h1>
        <p className="text-muted-foreground">
          Daftar wilayah yang bisa dipilih saat mengisi jadwal Kebaktian Rumah Tangga.
        </p>
      </div>
      <WilayahEditor items={items ?? []} disabled={!canEdit} />
      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="wilayah" />
    </div>
  );
}
