import { JadwalEditor } from "@/components/admin/jadwal-editor";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function PeribadahanPage() {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("peribadahan_categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bidang Peribadahan</h1>
        <p className="text-muted-foreground">
          Jadwal ini ditampilkan langsung di setiap warta - perubahan di sini otomatis muncul di
          warta yang sudah maupun akan diterbitkan.
        </p>
      </div>
      <JadwalEditor
        rows={categories ?? []}
        patchUrlBase="/api/admin/peribadahan"
        disabled={!canEdit}
      />
    </div>
  );
}
