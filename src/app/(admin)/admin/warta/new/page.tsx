import { requirePermission } from "@/lib/rbac/dal";
import { NewWartaForm } from "./new-warta-form";

export default async function NewWartaPage() {
  await requirePermission("warta", "create");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Buat Warta Baru</h1>
        <p className="text-muted-foreground">
          Isi Informasi dan Renungan dulu. Bidang Litbang otomatis disalin dari template saat
          ini.
        </p>
      </div>
      <NewWartaForm />
    </div>
  );
}
