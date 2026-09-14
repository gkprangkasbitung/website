import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Selamat Datang di GKP Rangkasbitung
        </h1>
        <p className="text-muted-foreground text-lg">
          Halaman ini adalah placeholder untuk website publik gereja. Ganti
          konten di{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            src/app/(public)/page.tsx
          </code>{" "}
          dengan informasi jemaat, jadwal ibadah, dan berita terbaru.
        </p>
        <Button render={<a href="/jadwal-ibadah" />}>Lihat Jadwal Ibadah</Button>
      </div>
    </div>
  );
}
