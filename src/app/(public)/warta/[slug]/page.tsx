import { notFound } from "next/navigation";
import { addDaysIso, formatTanggalPendek } from "@/lib/date";
import { formatRupiah } from "@/lib/format";
import { PERIBADAHAN_ITEM_SELECT } from "@/lib/peribadahan";
import { buildSaranaDanaWeeklyReport } from "@/lib/sarana-dana";
import { createClient } from "@/lib/supabase/server";
import {
  SMKA_KELOMPOK_OPTIONS,
  type PeribadahanItemWithRelations,
  type SaranaDanaWeeklyReport,
} from "@/types/warta";

/** Only shows whichever fields are actually filled in for this item -
 * which fields that is depends on its category (see peribadahan-editor.tsx
 * for the admin-side field configuration these mirror). */
function PeribadahanItemCard({ item }: { item: PeribadahanItemWithRelations }) {
  const isSmka = item.category?.key === "smka";

  const fields: { label: string; value: string }[] = [
    ...(item.jam ? [{ label: "Waktu", value: item.jam }] : []),
    ...(item.tempat ? [{ label: "Tempat", value: item.tempat.nama }] : []),
    ...(item.wilayah ? [{ label: "Wilayah", value: item.wilayah.nama }] : []),
    ...(item.dpa ? [{ label: "DPA", value: item.dpa }] : []),
    ...(item.tema ? [{ label: "Tema", value: item.tema }] : []),
    ...(item.pelayan_firman ? [{ label: "Pelayan Firman", value: item.pelayan_firman.nama }] : []),
    ...(item.liturgos
      ? [{ label: isSmka ? "Pelayan Liturgi" : "Liturgos", value: item.liturgos.nama }]
      : []),
    ...(isSmka && item.pemusik ? [{ label: "Pemusik", value: item.pemusik.nama }] : []),
    ...(isSmka && item.bahan_alkitab ? [{ label: "Bahan Alkitab", value: item.bahan_alkitab }] : []),
    ...(item.kehadiran_laki_laki != null
      ? [{ label: "Kehadiran Laki-laki", value: String(item.kehadiran_laki_laki) }]
      : []),
    ...(item.kehadiran_perempuan != null
      ? [{ label: "Kehadiran Perempuan", value: String(item.kehadiran_perempuan) }]
      : []),
    ...(item.kehadiran_anak != null
      ? [{ label: "Kehadiran Anak-anak", value: String(item.kehadiran_anak) }]
      : []),
  ];

  const kelompokRows = (item.smka_kelompok ?? []).filter(
    (k) => k.pf || k.laki_laki != null || k.perempuan != null,
  );

  return (
    <div className="space-y-2 border-b pb-4 last:border-0">
      <p className="font-medium">{item.category?.name ?? "-"}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-xs text-muted-foreground">{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
      {item.catatan && <p className="text-sm text-muted-foreground">{item.catatan}</p>}
      {kelompokRows.length > 0 && (
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1 pr-3">Kelompok</th>
                <th className="py-1 pr-3">PF</th>
                <th className="py-1 pr-3">L</th>
                <th className="py-1">P</th>
              </tr>
            </thead>
            <tbody>
              {kelompokRows.map((k) => (
                <tr key={k.id} className="border-b last:border-0">
                  <td className="py-1 pr-3">
                    {SMKA_KELOMPOK_OPTIONS.find((o) => o.value === k.kelompok)?.label ?? k.kelompok}
                  </td>
                  <td className="py-1 pr-3">{k.pf?.nama ?? "-"}</td>
                  <td className="py-1 pr-3">{k.laki_laki ?? "-"}</td>
                  <td className="py-1">{k.perempuan ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SaranaDanaWeeklyReportList({ report }: { report: SaranaDanaWeeklyReport[] }) {
  return (
    <ul className="space-y-3">
      {report.map((item) => (
        <li key={item.id} className="space-y-1 border-b pb-3 last:border-0">
          <div className="flex justify-between">
            <span className="font-medium">{item.name}</span>
            <span className="font-medium">{formatRupiah(item.saldoAkhir)}</span>
          </div>
          <dl className="grid grid-cols-3 gap-x-4 text-sm text-muted-foreground">
            <div>
              <dt>Saldo Awal</dt>
              <dd>{formatRupiah(item.saldoAwal)}</dd>
            </div>
            <div>
              <dt>Pemasukan</dt>
              <dd>{formatRupiah(item.pemasukan)}</dd>
            </div>
            <div>
              <dt>Pengeluaran</dt>
              <dd>{formatRupiah(item.pengeluaran)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

function LitbangList({
  items,
}: {
  items: { id: string; name: string; deskripsi: string | null }[];
}) {
  return (
    <ol className="list-decimal space-y-4 pl-5">
      {items.map((item) => (
        <li key={item.id}>
          <p className="font-medium">{item.name}</p>
          {item.deskripsi && <p className="whitespace-pre-line text-sm">{item.deskripsi}</p>}
        </li>
      ))}
    </ol>
  );
}

export default async function PublicWartaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: warta } = await supabase
    .from("warta")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!warta) {
    notFound();
  }

  const peribadahanFrom = warta.tanggal_kebaktian;
  const peribadahanTo = addDaysIso(warta.tanggal_kebaktian, 6);
  const saranaDanaFrom = addDaysIso(warta.tanggal_kebaktian, -7);
  const saranaDanaTo = addDaysIso(warta.tanggal_kebaktian, -1);

  const [
    { data: peribadahanItems },
    { data: saranaDanaItems },
    { data: saranaDanaTransactions },
    { data: litbangItems },
    { data: kesaksianItems },
  ] = await Promise.all([
    supabase
      .from("peribadahan_items")
      .select(PERIBADAHAN_ITEM_SELECT)
      .gte("tanggal", peribadahanFrom)
      .lte("tanggal", peribadahanTo)
      .order("tanggal")
      .order("sort_order"),
    supabase.from("sarana_dana_items").select("*").order("key"),
    supabase.from("sarana_dana_transactions").select("*").lte("tanggal", saranaDanaTo),
    supabase.from("warta_litbang_items").select("*").eq("warta_id", warta.id).order("sort_order"),
    supabase.from("warta_kesaksian_items").select("*").eq("warta_id", warta.id).order("sort_order"),
  ]);

  const saranaDanaReport = buildSaranaDanaWeeklyReport(
    saranaDanaItems ?? [],
    saranaDanaTransactions ?? [],
    saranaDanaFrom,
    saranaDanaTo,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-16">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">{warta.tanggal_kebaktian}</p>
        <h1 className="text-3xl font-bold tracking-tight">{warta.judul_kebaktian}</h1>
        {warta.tema_kebaktian && <p className="text-muted-foreground">{warta.tema_kebaktian}</p>}
      </header>

      {(warta.renungan_judul || warta.renungan_isi) && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Renungan</h2>
          {warta.renungan_judul && <p className="font-medium">{warta.renungan_judul}</p>}
          {warta.renungan_kitab && <p className="text-sm text-muted-foreground">{warta.renungan_kitab}</p>}
          {warta.renungan_isi && <p className="whitespace-pre-line">{warta.renungan_isi}</p>}
          {warta.renungan_sumber && (
            <p className="text-sm text-muted-foreground">Sumber: {warta.renungan_sumber}</p>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Bidang Peribadahan</h2>
        <p className="text-sm text-muted-foreground">
          {formatTanggalPendek(peribadahanFrom)} - {formatTanggalPendek(peribadahanTo)}
        </p>
        <div>
          {(peribadahanItems ?? []).map((item) => (
            <PeribadahanItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {(litbangItems ?? []).length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Bidang Litbang</h2>
          <LitbangList items={litbangItems ?? []} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Bidang Sarana dan Dana</h2>
        <p className="text-sm text-muted-foreground">
          {formatTanggalPendek(saranaDanaFrom)} - {formatTanggalPendek(saranaDanaTo)}
        </p>
        <SaranaDanaWeeklyReportList report={saranaDanaReport} />
      </section>

      {(kesaksianItems ?? []).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Bidang Kesaksian dan Keesaan</h2>
          {(kesaksianItems ?? []).map((item) => (
            <div key={item.id}>
              <p className="font-medium">{item.judul}</p>
              {item.deskripsi && <p className="text-sm text-muted-foreground">{item.deskripsi}</p>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
