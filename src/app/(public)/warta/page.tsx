import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PublicWartaListPage() {
  const supabase = await createClient();
  const { data: wartaList } = await supabase
    .from("warta")
    .select("slug, tanggal_kebaktian, judul_kebaktian, tema_kebaktian")
    .eq("status", "published")
    .order("tanggal_kebaktian", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Warta Jemaat</h1>
      <div className="mt-8 space-y-4">
        {(wartaList ?? []).map((warta) => (
          <Link
            key={warta.slug}
            href={`/warta/${warta.slug}`}
            className="block rounded-lg border p-4 hover:bg-muted"
          >
            <p className="text-sm text-muted-foreground">{warta.tanggal_kebaktian}</p>
            <p className="font-medium">{warta.judul_kebaktian}</p>
            {warta.tema_kebaktian && (
              <p className="text-sm text-muted-foreground">{warta.tema_kebaktian}</p>
            )}
          </Link>
        ))}
        {(wartaList ?? []).length === 0 && (
          <p className="text-muted-foreground">Belum ada warta yang diterbitkan.</p>
        )}
      </div>
    </div>
  );
}
