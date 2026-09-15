import { notFound } from "next/navigation";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { PeribadahanEditor } from "@/components/admin/peribadahan-editor";
import { JEMAAT_SELECT_WITH_LABELS, flattenJemaatLabels } from "@/lib/jemaat";
import { parsePageSize } from "@/lib/pagination";
import { PERIBADAHAN_ITEM_SELECT } from "@/lib/peribadahan";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function PeribadahanCategoryPage({
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
  const { data: category } = await supabase
    .from("peribadahan_categories")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (!category) {
    notFound();
  }

  const [{ data: items, count }, { data: tempatList }, { data: wilayahList }, { data: jemaatList }] =
    await Promise.all([
      supabase
        .from("peribadahan_items")
        .select(PERIBADAHAN_ITEM_SELECT, { count: "exact" })
        .eq("category_id", category.id)
        .order("tanggal", { ascending: false })
        .order("sort_order")
        .range(from, to),
      supabase.from("tempat").select("*").order("sort_order"),
      supabase.from("wilayah").select("*").order("sort_order"),
      supabase.from("jemaat").select(JEMAAT_SELECT_WITH_LABELS).order("nama"),
    ]);

  const jemaatWithLabels = flattenJemaatLabels(jemaatList ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{category.name}</h1>
        <p className="text-muted-foreground">
          Semua jadwal {category.name}, tanggal terbaru di atas - baris yang sama juga muncul di
          halaman Peribadahan (semua bidang) dan di warta untuk tanggal yang sama, dan sebaliknya.
        </p>
      </div>

      <PeribadahanEditor
        items={items ?? []}
        categories={[category]}
        lockedCategoryId={category.id}
        tempatList={tempatList ?? []}
        wilayahList={wilayahList ?? []}
        jemaatList={jemaatWithLabels}
        disabled={!canEdit}
      />

      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="jadwal" />
    </div>
  );
}
