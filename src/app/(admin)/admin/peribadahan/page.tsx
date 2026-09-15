import { PeribadahanEditor } from "@/components/admin/peribadahan-editor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { nextSundayIso } from "@/lib/date";
import { JEMAAT_SELECT_WITH_LABELS, flattenJemaatLabels } from "@/lib/jemaat";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function PeribadahanPage({
  searchParams,
}: {
  searchParams: Promise<{ tanggal?: string }>;
}) {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const { tanggal } = await searchParams;
  const activeTanggal = tanggal || nextSundayIso();

  const supabase = await createClient();
  const [{ data: categories }, { data: items }, { data: tempatList }, { data: jemaatList }] = await Promise.all([
    supabase.from("peribadahan_categories").select("*").order("sort_order"),
    supabase
      .from("peribadahan_items")
      .select(
        "*, category:peribadahan_categories(id, name, sort_order), tempat:tempat(id, nama), petugas:jemaat(id, nama)",
      )
      .eq("tanggal", activeTanggal)
      .order("sort_order"),
    supabase.from("tempat").select("*").order("sort_order"),
    supabase.from("jemaat").select(JEMAAT_SELECT_WITH_LABELS).order("nama"),
  ]);

  const jemaatWithLabels = flattenJemaatLabels(jemaatList ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bidang Peribadahan</h1>
        <p className="text-muted-foreground">
          Jadwal per tanggal - baris yang sama juga muncul dan bisa diedit langsung dari warta
          untuk tanggal yang sama, dan sebaliknya.
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
        categories={categories ?? []}
        tempatList={tempatList ?? []}
        jemaatList={jemaatWithLabels}
        disabled={!canEdit}
      />
    </div>
  );
}
