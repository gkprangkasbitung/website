import { notFound } from "next/navigation";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { Separator } from "@/components/ui/separator";
import { LitbangEditor } from "@/components/admin/litbang-editor";
import { PeribadahanEditor } from "@/components/admin/peribadahan-editor";
import { SaranaDanaLedger } from "@/components/admin/sarana-dana-ledger";
import { SaranaDanaTabs } from "@/components/admin/sarana-dana-tabs";
import { SaranaDanaWeeklyStats } from "@/components/admin/sarana-dana-weekly-report";
import { addDaysIso, formatTanggalPendek } from "@/lib/date";
import { JEMAAT_SELECT_WITH_LABELS, flattenJemaatLabels } from "@/lib/jemaat";
import { parsePageSize } from "@/lib/pagination";
import { PERIBADAHAN_ITEM_SELECT } from "@/lib/peribadahan";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { buildSaranaDanaWeeklyReport } from "@/lib/sarana-dana";
import { parseSortDir, parseSortKey } from "@/lib/sort";
import { createClient } from "@/lib/supabase/server";
import type { SaranaDanaTransactionWithJemaat } from "@/types/warta";
import { DeleteWartaButton } from "./delete-warta-button";
import { InformasiRenunganForm } from "./informasi-renungan-form";
import { KesaksianEditor } from "./kesaksian-editor";
import { PublishToggle } from "./publish-toggle";

const DANA_SORT_COLUMNS = ["tanggal", "tipe", "jumlah", "keterangan"] as const;

export default async function EditWartaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    peribadahanPage?: string;
    peribadahanPageSize?: string;
    danaTab?: string;
    page?: string;
    pageSize?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  await requirePermission("warta", "read");
  const { id } = await params;
  const {
    peribadahanPage: peribadahanPageParam,
    peribadahanPageSize: peribadahanPageSizeParam,
    danaTab,
    page: danaPageParam,
    pageSize: danaPageSizeParam,
    sort: danaSort,
    dir: danaDir,
  } = await searchParams;

  const currentUser = await getAuthenticatedUser();
  const canUpdate = hasPermission(currentUser, "warta", "update");
  const canDelete = hasPermission(currentUser, "warta", "delete");

  const supabase = await createClient();
  const { data: warta } = await supabase.from("warta").select("*").eq("id", id).single();

  if (!warta) {
    notFound();
  }

  /** Bidang Peribadahan looks at the service week itself, Minggu-Sabtu
   * (this week's schedule), while Bidang Sarana dan Dana reports on the
   * Minggu-Sabtu week right before it (last week's finances) - see
   * buildSaranaDanaWeeklyReport. */
  const peribadahanFrom = warta.tanggal_kebaktian;
  const peribadahanTo = addDaysIso(warta.tanggal_kebaktian, 6);
  const saranaDanaFrom = addDaysIso(warta.tanggal_kebaktian, -7);
  const saranaDanaTo = addDaysIso(warta.tanggal_kebaktian, -1);

  const peribadahanPage = Math.max(1, Number(peribadahanPageParam) || 1);
  const peribadahanPageSize = parsePageSize(peribadahanPageSizeParam);
  const peribadahanRangeFrom = (peribadahanPage - 1) * peribadahanPageSize;
  const peribadahanRangeTo = peribadahanRangeFrom + peribadahanPageSize - 1;

  const danaPage = Math.max(1, Number(danaPageParam) || 1);
  const danaPageSize = parsePageSize(danaPageSizeParam);
  const danaRangeFrom = (danaPage - 1) * danaPageSize;
  const danaRangeTo = danaRangeFrom + danaPageSize - 1;
  const danaSortKey = parseSortKey(danaSort, DANA_SORT_COLUMNS) ?? "tanggal";
  const danaSortDir = parseSortDir(danaDir);

  const [
    { data: peribadahanCategories },
    { data: peribadahanItems, count: peribadahanCount },
    { data: tempatList },
    { data: wilayahList },
    { data: jemaatList },
    { data: saranaDanaItems },
    { data: litbangItems },
    { data: kesaksianItems },
  ] = await Promise.all([
    supabase.from("peribadahan_categories").select("*").order("sort_order"),
    supabase
      .from("peribadahan_items")
      .select(PERIBADAHAN_ITEM_SELECT, { count: "exact" })
      .gte("tanggal", peribadahanFrom)
      .lte("tanggal", peribadahanTo)
      .order("tanggal")
      .order("sort_order")
      .range(peribadahanRangeFrom, peribadahanRangeTo),
    supabase.from("tempat").select("*").order("sort_order"),
    supabase.from("wilayah").select("*").order("sort_order"),
    supabase.from("jemaat").select(JEMAAT_SELECT_WITH_LABELS).order("nama"),
    supabase.from("sarana_dana_items").select("*").order("key"),
    supabase.from("warta_litbang_items").select("*").eq("warta_id", id).order("sort_order"),
    supabase.from("warta_kesaksian_items").select("*").eq("warta_id", id).order("sort_order"),
  ]);

  const jemaatWithLabels = flattenJemaatLabels(jemaatList ?? []);

  const activeDanaItem =
    (saranaDanaItems ?? []).find((item) => item.key === danaTab) ?? (saranaDanaItems ?? [])[0];

  let danaReport = null;
  let danaTransactions: SaranaDanaTransactionWithJemaat[] = [];
  let danaTransactionCount = 0;

  if (activeDanaItem) {
    const [{ data: transactionsForReport }, { data: pageTransactions, count }] = await Promise.all([
      supabase
        .from("sarana_dana_transactions")
        .select("*")
        .eq("item_id", activeDanaItem.id)
        .lte("tanggal", saranaDanaTo),
      supabase
        .from("sarana_dana_transactions")
        .select("*, jemaat(id, nama)", { count: "exact" })
        .eq("item_id", activeDanaItem.id)
        .gte("tanggal", saranaDanaFrom)
        .lte("tanggal", saranaDanaTo)
        .order(danaSortKey, { ascending: danaSortDir === "asc" })
        .order("created_at", { ascending: false })
        .range(danaRangeFrom, danaRangeTo),
    ]);

    danaReport = buildSaranaDanaWeeklyReport(
      [activeDanaItem],
      transactionsForReport ?? [],
      saranaDanaFrom,
      saranaDanaTo,
    )[0];
    danaTransactions = pageTransactions ?? [];
    danaTransactionCount = count ?? 0;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
            Jadwal {formatTanggalPendek(peribadahanFrom)} - {formatTanggalPendek(peribadahanTo)}{" "}
            (Minggu-Sabtu) - data ini sama dengan yang ada di halaman Peribadahan untuk tanggal
            yang sama, dan sebaliknya.
          </p>
        </div>
        <PeribadahanEditor
          tanggal={warta.tanggal_kebaktian}
          items={peribadahanItems ?? []}
          categories={peribadahanCategories ?? []}
          tempatList={tempatList ?? []}
          wilayahList={wilayahList ?? []}
          jemaatList={jemaatWithLabels}
          disabled={!canUpdate}
        />
        <PaginationBar
          page={peribadahanPage}
          pageSize={peribadahanPageSize}
          totalItems={peribadahanCount ?? 0}
          entryLabel="jadwal"
          pageParam="peribadahanPage"
          pageSizeParam="peribadahanPageSize"
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
        <LitbangEditor
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
            Laporan {formatTanggalPendek(saranaDanaFrom)} - {formatTanggalPendek(saranaDanaTo)}{" "}
            (Minggu-Sabtu sebelum tanggal kebaktian), per bidang.
          </p>
        </div>
        {activeDanaItem && danaReport ? (
          <SaranaDanaTabs
            items={(saranaDanaItems ?? []).map((item) => ({ key: item.key, name: item.name }))}
            activeKey={activeDanaItem.key}
          >
            <div className="space-y-4">
              <SaranaDanaWeeklyStats report={danaReport} />
              <SaranaDanaLedger
                itemId={activeDanaItem.id}
                itemKey={activeDanaItem.key}
                transactions={danaTransactions}
                jemaatList={jemaatWithLabels}
                disabled={!canUpdate}
              />
              <PaginationBar
                page={danaPage}
                pageSize={danaPageSize}
                totalItems={danaTransactionCount}
                entryLabel="transaksi"
              />
            </div>
          </SaranaDanaTabs>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada bidang Sarana &amp; Dana.</p>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Bidang Kesaksian dan Keesaan</h2>
        <KesaksianEditor wartaId={warta.id} items={kesaksianItems ?? []} disabled={!canUpdate} />
      </section>
    </div>
  );
}
