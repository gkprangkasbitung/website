import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { AddJemaatDialog, JemaatEditor } from "@/components/admin/jemaat-editor";
import { TableSearchInput } from "@/components/admin/table-search-input";
import { TableSelectFilter } from "@/components/admin/table-select-filter";
import { JEMAAT_SELECT_FULL, flattenJemaatLabels } from "@/lib/jemaat";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { parseSortDir } from "@/lib/sort";
import { createClient } from "@/lib/supabase/server";
import { STATUS_KEANGGOTAAN_OPTIONS, type JemaatCatatanPastoral, type JemaatProfile, type KeluargaMember } from "@/types/warta";

function groupBy<T, K extends string>(rows: T[], key: (row: T) => K | null): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const row of rows) {
    const k = key(row);
    if (k === null) continue;
    (out[k] ??= []).push(row);
  }
  return out;
}

export default async function JemaatPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    dir?: string;
    q?: string;
    wilayah?: string;
    status?: string;
  }>;
}) {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canEdit = hasPermission(currentUser, "warta", "update");

  const { page: pageParam, pageSize: pageSizeParam, dir, q, wilayah, status } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const sortDir = parseSortDir(dir);

  const supabase = await createClient();
  let jemaatQuery = supabase.from("jemaat").select(JEMAAT_SELECT_FULL, { count: "exact" });

  if (q) jemaatQuery = jemaatQuery.ilike("nama", `%${q}%`);
  if (wilayah) jemaatQuery = jemaatQuery.eq("wilayah_id", wilayah);
  if (status) jemaatQuery = jemaatQuery.eq("status_keanggotaan", status);

  const [
    { data: jemaat, count },
    { data: allLabels },
    { data: allWilayah },
    { count: totalJiwa },
    { count: totalKeluarga },
  ] = await Promise.all([
    jemaatQuery.order("nama", { ascending: sortDir === "asc" }).range(rangeFrom, rangeTo),
    supabase.from("label_jemaat").select("*").order("sort_order"),
    supabase.from("wilayah").select("*").order("sort_order"),
    supabase.from("jemaat").select("id", { count: "exact", head: true }),
    supabase.from("keluarga").select("id", { count: "exact", head: true }),
  ]);

  const items = flattenJemaatLabels(jemaat ?? []) as JemaatProfile[];
  const jemaatIds = items.map((i) => i.id);
  const keluargaIds = [...new Set(items.map((i) => i.keluarga_id).filter((id): id is string => Boolean(id)))];

  const [{ data: catatanRows }, { data: familyRows }] = await Promise.all([
    jemaatIds.length
      ? supabase
          .from("jemaat_catatan_pastoral")
          .select("*")
          .in("jemaat_id", jemaatIds)
          .order("tanggal", { ascending: false })
      : Promise.resolve({ data: [] as JemaatCatatanPastoral[] }),
    keluargaIds.length
      ? supabase
          .from("jemaat")
          .select("id, nama, keluarga_id, hubungan_keluarga, status_keanggotaan")
          .in("keluarga_id", keluargaIds)
      : Promise.resolve({ data: [] as (KeluargaMember & { keluarga_id: string | null })[] }),
  ]);

  const notesByJemaat = groupBy(catatanRows ?? [], (n) => n.jemaat_id);
  const familyByKeluarga = groupBy(familyRows ?? [], (m) => m.keluarga_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Data Jemaat</h1>
          <p className="text-muted-foreground">
            {totalJiwa ?? 0} jiwa · {totalKeluarga ?? 0} keluarga
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TableSearchInput placeholder="Cari nama..." />
          {canEdit && <AddJemaatDialog allLabels={allLabels ?? []} allWilayah={allWilayah ?? []} />}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <TableSelectFilter
            param="wilayah"
            placeholder="Semua wilayah"
            options={(allWilayah ?? []).map((w) => ({ value: w.id, label: w.nama }))}
          />
          <TableSelectFilter
            param="status"
            placeholder="Semua status"
            options={STATUS_KEANGGOTAAN_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
        <ExportCsvButton />
      </div>
      <JemaatEditor
        items={items}
        allLabels={allLabels ?? []}
        allWilayah={allWilayah ?? []}
        familyByKeluarga={familyByKeluarga}
        notesByJemaat={notesByJemaat}
        disabled={!canEdit}
      />
      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="jiwa" />
    </div>
  );
}
