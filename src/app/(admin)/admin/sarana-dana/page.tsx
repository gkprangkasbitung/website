import { SaranaDanaEditor } from "@/components/admin/sarana-dana-editor";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function SaranaDanaPage() {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const supabase = await createClient();
  const { data: items } = await supabase.from("sarana_dana_items").select("*").order("key");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bidang Sarana dan Dana</h1>
        <p className="text-muted-foreground">
          Nilai ini ditampilkan langsung di setiap warta - perubahan di sini otomatis muncul di
          warta yang sudah maupun akan diterbitkan.
        </p>
      </div>
      <SaranaDanaEditor items={items ?? []} disabled={!canEdit} />
    </div>
  );
}
