import { JemaatEditor } from "@/components/admin/jemaat-editor";
import { JEMAAT_SELECT_WITH_LABELS, flattenJemaatLabels } from "@/lib/jemaat";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function JemaatPage() {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const supabase = await createClient();
  const [{ data: jemaat }, { data: allLabels }] = await Promise.all([
    supabase.from("jemaat").select(JEMAAT_SELECT_WITH_LABELS).order("nama"),
    supabase.from("label_jemaat").select("*").order("sort_order"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Jemaat</h1>
        <p className="text-muted-foreground">
          Daftar nama yang bisa dipilih sebagai Petugas saat mengisi jadwal Bidang Peribadahan.
          Satu jemaat bisa punya lebih dari satu label - kelola daftar labelnya di halaman{" "}
          <span className="font-medium">Label Jemaat</span>.
        </p>
      </div>
      <JemaatEditor items={flattenJemaatLabels(jemaat ?? [])} allLabels={allLabels ?? []} disabled={!canEdit} />
    </div>
  );
}
