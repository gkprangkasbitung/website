"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RenameKeluargaDialog({ keluargaId, nama }: { keluargaId: string; nama: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(nama);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    if (!value.trim()) {
      toast.error("Nama keluarga wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/keluarga/${keluargaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan");
        return;
      }

      toast.success("Nama keluarga diubah");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(nama);
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>Ubah Nama</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Nama Keluarga</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama-keluarga">Nama Keluarga</Label>
            <Input
              id="nama-keluarga"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button onClick={onSave} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
