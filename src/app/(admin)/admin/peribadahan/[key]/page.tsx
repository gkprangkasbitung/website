import { notFound } from "next/navigation";
import { PeribadahanEditor } from "@/components/admin/peribadahan-editor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { nextSundayIso } from "@/lib/date";
import { JEMAAT_SELECT_WITH_LABELS, flattenJemaatLabels } from "@/lib/jemaat";
import { PERIBADAHAN_ITEM_SELECT } from "@/lib/peribadahan";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function PeribadahanCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ tanggal?: string }>;
}) {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const { key } = await params;
  const { tanggal } = await searchParams;
  const activeTanggal = tanggal || nextSundayIso();

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("peribadahan_categories")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (!category) {
    notFound();
  }

  const [{ data: items }, { data: tempatList }, { data: jemaatList }] = await Promise.all([
    supabase
      .from("peribadahan_items")
      .select(PERIBADAHAN_ITEM_SELECT)
      .eq("tanggal", activeTanggal)
      .eq("category_id", category.id)
      .order("sort_order"),
    supabase.from("tempat").select("*").order("sort_order"),
    supabase.from("jemaat").select(JEMAAT_SELECT_WITH_LABELS).order("nama"),
  ]);

  const jemaatWithLabels = flattenJemaatLabels(jemaatList ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{category.name}</h1>
        <p className="text-muted-foreground">
          Jadwal khusus {category.name} per tanggal - baris yang sama juga muncul di halaman
          Peribadahan (semua bidang) dan di warta untuk tanggal yang sama, dan sebaliknya.
        </p>
      </div>

      <form className="flex items-end gap-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="tanggal">
            Tanggal
          </label>
          <Input id="tanggal" name="tanggal" type="date" defaultValue={activeTanggal} />
        </div>
        <Button type="submit" variant="outline">
          Tampilkan
        </Button>
      </form>

      <PeribadahanEditor
        tanggal={activeTanggal}
        items={items ?? []}
        categories={[category]}
        lockedCategoryId={category.id}
        tempatList={tempatList ?? []}
        jemaatList={jemaatWithLabels}
        disabled={!canEdit}
      />
    </div>
  );
}
