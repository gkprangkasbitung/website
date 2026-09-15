import { LabelJemaatEditor } from "@/components/admin/label-jemaat-editor";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function LabelJemaatPage() {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const supabase = await createClient();
  const { data: items } = await supabase.from("label_jemaat").select("*").order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Label Jemaat</h1>
        <p className="text-muted-foreground">
          Jabatan/label yang bisa dipilih (lebih dari satu) untuk tiap jemaat di halaman Jemaat,
          dan dipakai untuk mengelompokkan dropdown Petugas.
        </p>
      </div>
      <LabelJemaatEditor items={items ?? []} disabled={!canEdit} />
    </div>
  );
}
