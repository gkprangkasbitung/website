import { SaranaDanaEditor } from "@/components/admin/sarana-dana-editor";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";

export default async function SaranaDanaPage() {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const supabase = await createClient();
  const { data: balances } = await supabase.from("sarana_dana_balances").select("*").order("key");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bidang Sarana dan Dana</h1>
        <p className="text-muted-foreground">
          Saldo dihitung otomatis dari transaksi pemasukan/pengeluaran - klik &quot;Lihat
          Transaksi&quot; untuk mencatat pemasukan atau pengeluaran per pos.
        </p>
      </div>
      <SaranaDanaEditor items={balances ?? []} disabled={!canEdit} />
    </div>
  );
}
