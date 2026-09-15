import { TempatEditor } from "@/components/admin/tempat-editor";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function TempatPage() {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const supabase = await createClient();
  const { data: items } = await supabase.from("tempat").select("*").order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tempat</h1>
        <p className="text-muted-foreground">
          Daftar lokasi yang bisa dipilih saat mengisi jadwal Bidang Peribadahan.
        </p>
      </div>
      <TempatEditor items={items ?? []} disabled={!canEdit} />
    </div>
  );
}
