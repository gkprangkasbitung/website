import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { JemaatDetailEditor } from "@/components/admin/jemaat-detail-editor";
import { flattenJemaatLabels, JEMAAT_SELECT_FULL } from "@/lib/jemaat";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import type { JemaatCatatanPastoral, JemaatProfile, KeluargaMember } from "@/types/warta";

export default async function JemaatDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  await requirePermission("warta", "read");
  const { id } = await params;
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const supabase = await createClient();
  const { data: jemaatRow } = await supabase
    .from("jemaat")
    .select(JEMAAT_SELECT_FULL)
    .eq("id", id)
    .maybeSingle();

  if (!jemaatRow) {
    notFound();
  }

  const jemaat = flattenJemaatLabels([jemaatRow])[0] as JemaatProfile;

  const [
    { data: allLabels },
    { data: allWilayah },
    { data: allKeluarga },
    { data: familyRows },
    { data: catatanRows, count: totalCatatan },
  ] = await Promise.all([
    supabase.from("label_jemaat").select("*").order("sort_order"),
    supabase.from("wilayah").select("*").order("sort_order"),
    supabase.from("keluarga").select("id, nama").order("nama"),
    jemaat.keluarga_id
      ? supabase
          .from("jemaat")
          .select("id, nama, keluarga_id, hubungan_keluarga, status_keanggotaan")
          .eq("keluarga_id", jemaat.keluarga_id)
          .neq("id", id)
      : Promise.resolve({ data: [] as (KeluargaMember & { keluarga_id: string | null })[] }),
    supabase
      .from("jemaat_catatan_pastoral")
      .select("*", { count: "exact" })
      .eq("jemaat_id", id)
      .order("tanggal", { ascending: false })
      .range(rangeFrom, rangeTo),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/jemaat"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke daftar jemaat
      </Link>

      <JemaatDetailEditor
        jemaat={jemaat}
        allLabels={allLabels ?? []}
        allWilayah={allWilayah ?? []}
        allKeluarga={allKeluarga ?? []}
        familyMembers={(familyRows ?? []) as KeluargaMember[]}
        pastoralNotes={(catatanRows ?? []) as JemaatCatatanPastoral[]}
        pastoralNotesPage={page}
        pastoralNotesPageSize={pageSize}
        totalPastoralNotes={totalCatatan ?? 0}
        disabled={!canEdit}
      />
    </div>
  );
}
