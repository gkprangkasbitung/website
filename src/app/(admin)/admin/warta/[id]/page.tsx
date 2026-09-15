import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { JadwalEditor } from "@/components/admin/jadwal-editor";
import { SaranaDanaEditor } from "@/components/admin/sarana-dana-editor";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { DeleteWartaButton } from "./delete-warta-button";
import { InformasiRenunganForm } from "./informasi-renungan-form";
import { KesaksianEditor } from "./kesaksian-editor";
import { PublishToggle } from "./publish-toggle";

export default async function EditWartaPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("warta", "read");
  const { id } = await params;

  const currentUser = await getAuthenticatedUser();
  const canUpdate = hasPermission(currentUser, "warta", "update");
  const canDelete = hasPermission(currentUser, "warta", "delete");

  const supabase = await createClient();
  const [{ data: warta }, { data: peribadahan }, { data: saranaDana }, { data: litbangItems }, { data: kesaksianItems }] =
    await Promise.all([
      supabase.from("warta").select("*").eq("id", id).single(),
      supabase.from("peribadahan_categories").select("*").order("sort_order"),
      supabase.from("sarana_dana_items").select("*").order("key"),
      supabase.from("warta_litbang_items").select("*").eq("warta_id", id).order("sort_order"),
      supabase.from("warta_kesaksian_items").select("*").eq("warta_id", id).order("sort_order"),
    ]);

  if (!warta) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{warta.judul_kebaktian}</h1>
          <p className="text-muted-foreground">{warta.tanggal_kebaktian}</p>
        </div>
        <div className="flex gap-2">
          {canUpdate && <PublishToggle wartaId={warta.id} status={warta.status} />}
          {canDelete && <DeleteWartaButton wartaId={warta.id} />}
        </div>
      </div>

      <InformasiRenunganForm warta={warta} disabled={!canUpdate} />

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Bidang Peribadahan</h2>
          <p className="text-sm text-muted-foreground">
            Data hidup - mengubah di sini juga mengubah halaman Peribadahan dan warta lain.
          </p>
        </div>
        <JadwalEditor
          rows={peribadahan ?? []}
          patchUrlBase="/api/admin/peribadahan"
          disabled={!canUpdate}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Bidang Litbang</h2>
          <p className="text-sm text-muted-foreground">
            Disalin dari template saat warta dibuat - perubahan di sini khusus untuk warta ini
            saja.
          </p>
        </div>
        <JadwalEditor
          rows={litbangItems ?? []}
          patchUrlBase={`/api/admin/warta/${warta.id}/litbang`}
          disabled={!canUpdate}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Bidang Sarana dan Dana</h2>
          <p className="text-sm text-muted-foreground">
            Data hidup - mengubah di sini juga mengubah halaman Sarana &amp; Dana dan warta lain.
          </p>
        </div>
        <SaranaDanaEditor items={saranaDana ?? []} disabled={!canUpdate} />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Bidang Kesaksian dan Keesaan</h2>
        <KesaksianEditor wartaId={warta.id} items={kesaksianItems ?? []} disabled={!canUpdate} />
      </section>
    </div>
  );
}
