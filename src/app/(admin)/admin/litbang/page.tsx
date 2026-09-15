import { LitbangTemplateEditor } from "@/components/admin/litbang-template-editor";
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
          Ini adalah nilai default. Warta baru akan meng-copy card yang <strong>aktif</strong>{" "}
          saat dibuat, tapi perubahan di sini <strong>tidak</strong> mengubah warta yang sudah
          ada - cek/sesuaikan langsung di tiap warta kalau perlu berbeda minggu itu. Nonaktifkan
          card untuk melewatkannya di warta baru tanpa menghapusnya, atau geser lewat ikon di
          kiri untuk mengurutkan ulang.
        </p>
      </div>
      <LitbangTemplateEditor rows={categories ?? []} disabled={!canEdit} />
    </div>
  );
}
