import { notFound } from "next/navigation";
import { PeribadahanEditor } from "@/components/admin/peribadahan-editor";
import { TableDateRangeFilter } from "@/components/admin/table-date-range-filter";
import { TableSearchInput } from "@/components/admin/table-search-input";
import { JEMAAT_SELECT_WITH_LABELS, flattenJemaatLabels } from "@/lib/jemaat";
import { PERIBADAHAN_ITEM_SELECT } from "@/lib/peribadahan";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function PeribadahanCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ q?: string; from?: string; to?: string }>;
}) {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const { key } = await params;
  const { q, from, to } = await searchParams;

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("peribadahan_categories")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (!category) {
    notFound();
  }

  let itemsQuery = supabase
    .from("peribadahan_items")
    .select(PERIBADAHAN_ITEM_SELECT)
    .eq("category_id", category.id);

  if (q) {
    itemsQuery = itemsQuery.or(
      `tema.ilike.%${q}%,dpa.ilike.%${q}%,catatan.ilike.%${q}%,bahan_alkitab.ilike.%${q}%`,
    );
  }
  if (from) itemsQuery = itemsQuery.gte("tanggal", from);
  if (to) itemsQuery = itemsQuery.lte("tanggal", to);

  const [{ data: items }, { data: tempatList }, { data: wilayahList }, { data: jemaatList }] =
    await Promise.all([
      itemsQuery.order("tanggal", { ascending: false }).order("sort_order"),
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

      <div className="flex flex-wrap items-end justify-between gap-4">
        <TableSearchInput placeholder="Cari tema/DPA/catatan..." />
        <TableDateRangeFilter />
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
    </div>
  );
}
