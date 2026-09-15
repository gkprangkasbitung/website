import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function JadwalTable({
  rows,
}: {
  rows: { name: string; hari: string | null; jam: string | null; tempat: string | null; petugas: string | null }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4">Bidang</th>
            <th className="py-2 pr-4">Hari</th>
            <th className="py-2 pr-4">Jam</th>
            <th className="py-2 pr-4">Tempat</th>
            <th className="py-2">Petugas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{row.name}</td>
              <td className="py-2 pr-4">{row.hari ?? "-"}</td>
              <td className="py-2 pr-4">{row.jam ?? "-"}</td>
              <td className="py-2 pr-4">{row.tempat ?? "-"}</td>
              <td className="py-2">{row.petugas ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
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

  const [{ data: peribadahan }, { data: saranaDana }, { data: litbangItems }, { data: kesaksianItems }] =
    await Promise.all([
      supabase.from("peribadahan_categories").select("*").order("sort_order"),
      supabase.from("sarana_dana_items").select("*").order("key"),
      supabase.from("warta_litbang_items").select("*").eq("warta_id", warta.id).order("sort_order"),
      supabase.from("warta_kesaksian_items").select("*").eq("warta_id", warta.id).order("sort_order"),
    ]);

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
        <JadwalTable rows={peribadahan ?? []} />
      </section>

      {(litbangItems ?? []).length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Bidang Litbang</h2>
          <JadwalTable rows={litbangItems ?? []} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Bidang Sarana dan Dana</h2>
        <ul className="space-y-1">
          {(saranaDana ?? []).map((item) => (
            <li key={item.id} className="flex justify-between border-b py-1 text-sm">
              <span>{item.name}</span>
              <span className="font-medium">{formatRupiah(item.nominal)}</span>
            </li>
          ))}
        </ul>
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
