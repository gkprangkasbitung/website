"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Warta } from "@/types/warta";

export function InformasiRenunganForm({ warta, disabled }: { warta: Warta; disabled?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());

    startTransition(async () => {
      const res = await fetch(`/api/admin/warta/${warta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan");
        return;
      }

      toast.success("Tersimpan");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-medium">Informasi</h3>
        <div className="space-y-2">
          <Label htmlFor="tanggal_kebaktian">Tanggal Kebaktian</Label>
          <Input
            id="tanggal_kebaktian"
            name="tanggal_kebaktian"
            type="date"
            defaultValue={warta.tanggal_kebaktian}
            disabled={disabled}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="judul_kebaktian">Judul Kebaktian</Label>
          <Input
            id="judul_kebaktian"
            name="judul_kebaktian"
            defaultValue={warta.judul_kebaktian}
            disabled={disabled}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tema_kebaktian">Tema Kebaktian</Label>
          <Input
            id="tema_kebaktian"
            name="tema_kebaktian"
            defaultValue={warta.tema_kebaktian ?? ""}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Renungan</h3>
        <div className="space-y-2">
          <Label htmlFor="renungan_judul">Judul Renungan</Label>
          <Input
            id="renungan_judul"
            name="renungan_judul"
            defaultValue={warta.renungan_judul ?? ""}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="renungan_kitab">Kitab Renungan</Label>
          <Input
            id="renungan_kitab"
            name="renungan_kitab"
            defaultValue={warta.renungan_kitab ?? ""}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="renungan_isi">Isi Renungan</Label>
          <textarea
            id="renungan_isi"
            name="renungan_isi"
            rows={5}
            defaultValue={warta.renungan_isi ?? ""}
            disabled={disabled}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="renungan_sumber">Sumber Renungan</Label>
          <Input
            id="renungan_sumber"
            name="renungan_sumber"
            defaultValue={warta.renungan_sumber ?? ""}
            disabled={disabled}
          />
        </div>
      </div>

      {!disabled && (
        <Button type="submit" disabled={isPending} className="col-span-2 w-fit">
          {isPending ? "Menyimpan..." : "Simpan Informasi & Renungan"}
        </Button>
      )}
    </form>
  );
}
