import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { KeluargaDetailEditor } from "@/components/admin/keluarga-detail-editor";
import { flattenJemaatLabels, JEMAAT_SELECT_FULL, JEMAAT_SELECT_WITH_LABELS } from "@/lib/jemaat";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { JemaatProfile } from "@/types/warta";
import { DeleteKeluargaButton } from "./delete-keluarga-button";
import { RenameKeluargaDialog } from "./rename-keluarga-dialog";

export default async function KeluargaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("warta", "read");
  const { id } = await params;

  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const supabase = await createClient();
  const { data: keluarga } = await supabase.from("keluarga").select("*").eq("id", id).maybeSingle();

  if (!keluarga) {
    notFound();
  }

  const [{ data: memberRows }, { data: jemaatList }] = await Promise.all([
    supabase.from("jemaat").select(JEMAAT_SELECT_FULL).eq("keluarga_id", id).order("nama"),
    supabase.from("jemaat").select(JEMAAT_SELECT_WITH_LABELS).order("nama"),
  ]);

  const members = flattenJemaatLabels(memberRows ?? []) as JemaatProfile[];
  const memberIds = new Set(members.map((m) => m.id));
  const availableJemaat = flattenJemaatLabels(jemaatList ?? []).filter((j) => !memberIds.has(j.id));

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/keluarga"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke daftar keluarga
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{keluarga.nama}</h1>
          <p className="text-muted-foreground">{members.length} anggota</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <RenameKeluargaDialog keluargaId={keluarga.id} nama={keluarga.nama} />
            <DeleteKeluargaButton keluargaId={keluarga.id} hasMembers={members.length > 0} />
          </div>
        )}
      </div>

      <KeluargaDetailEditor
        keluargaNama={keluarga.nama}
        members={members}
        availableJemaat={availableJemaat}
        disabled={!canEdit}
      />
    </div>
  );
}
