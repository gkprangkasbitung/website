"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewWartaForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());

    startTransition(async () => {
      const res = await fetch("/api/admin/warta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error ?? "Gagal membuat warta");
        return;
      }

      toast.success("Warta berhasil dibuat");
      router.push(`/admin/warta/${data.data.id}`);
    });
  }

  return (
    <form action={onSubmit} className="max-w-xl space-y-6">
      <div className="space-y-4">
        <h2 className="font-medium">Informasi</h2>
        <div className="space-y-2">
          <Label htmlFor="tanggal_kebaktian">Tanggal Kebaktian</Label>
          <Input id="tanggal_kebaktian" name="tanggal_kebaktian" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="judul_kebaktian">Judul Kebaktian</Label>
          <Input id="judul_kebaktian" name="judul_kebaktian" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tema_kebaktian">Tema Kebaktian</Label>
          <Input id="tema_kebaktian" name="tema_kebaktian" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Renungan</h2>
        <div className="space-y-2">
          <Label htmlFor="renungan_judul">Judul Renungan</Label>
          <Input id="renungan_judul" name="renungan_judul" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="renungan_kitab">Kitab Renungan</Label>
          <Input id="renungan_kitab" name="renungan_kitab" placeholder="Mis. Mazmur 23:1-6" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="renungan_isi">Isi Renungan</Label>
          <textarea
            id="renungan_isi"
            name="renungan_isi"
            rows={5}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="renungan_sumber">Sumber Renungan</Label>
          <Input id="renungan_sumber" name="renungan_sumber" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Bidang Peribadahan, Litbang, Sarana &amp; Dana, dan Kesaksian dapat diisi setelah warta
        dibuat.
      </p>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Menyimpan..." : "Buat Warta"}
      </Button>
    </form>
  );
}
