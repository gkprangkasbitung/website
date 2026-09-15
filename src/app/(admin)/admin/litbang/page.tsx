import { LitbangEditor } from "@/components/admin/litbang-editor";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function LitbangTemplatePage() {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("litbang_categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bidang Litbang (Template)</h1>
        <p className="text-muted-foreground">
          Ini adalah nilai default. Warta baru akan meng-copy nilai ini saat dibuat, tapi
          perubahan di sini <strong>tidak</strong> mengubah warta yang sudah ada - cek/sesuaikan
          langsung di tiap warta kalau perlu berbeda minggu itu.
        </p>
      </div>
      <LitbangEditor
        rows={categories ?? []}
        patchUrlBase="/api/admin/litbang-template"
        disabled={!canEdit}
      />
    </div>
  );
}
