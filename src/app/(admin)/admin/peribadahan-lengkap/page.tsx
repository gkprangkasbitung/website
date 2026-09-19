import { PeribadahanTable } from "@/components/admin/peribadahan-table";
import { requirePermission } from "@/lib/rbac/dal";

export default async function PeribadahanLengkapPage() {
  await requirePermission("warta", "read");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Peribadahan (Baru)</h1>
        <p className="text-muted-foreground">
          Pratinjau tabel dengan sorting dan filter baru - masih memakai data contoh, belum
          tersambung ke jadwal peribadahan sungguhan.
        </p>
      </div>
      <PeribadahanTable />
    </div>
  );
}
