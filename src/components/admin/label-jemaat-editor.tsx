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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LabelJemaat } from "@/types/warta";

function EditLabelDialog({ item, disabled }: { item: LabelJemaat; disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState(item.nama);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/label-jemaat/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan");
        return;
      }

      toast.success("Tersimpan");
      setOpen(false);
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/label-jemaat/${item.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus");
        return;
      }

      toast.success("Label dihapus");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        {disabled ? "Lihat" : "Detail"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.nama}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Label</Label>
            <Input
              id="nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              disabled={disabled || isPending}
            />
          </div>
          {!disabled && (
            <DialogFooter>
              <Button size="sm" variant="ghost" onClick={onDelete} disabled={isPending}>
                Hapus
              </Button>
              <Button onClick={onSave} disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LabelRow({ item, disabled }: { item: LabelJemaat; disabled?: boolean }) {
  return (
    <TableRow>
      <TableCell>{item.nama}</TableCell>
      <TableCell>
        <EditLabelDialog item={item} disabled={disabled} />
      </TableCell>
    </TableRow>
  );
}

function AddLabelDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const nama = formData.get("nama");

    if (typeof nama !== "string" || !nama.trim()) {
      toast.error("Nama label wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/label-jemaat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menambah label");
        return;
      }

      toast.success("Label ditambahkan");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Tambah Label</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Label</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Label</Label>
            <Input id="nama" name="nama" placeholder="Mis. Pendeta" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LabelJemaatEditor({ items, disabled }: { items: LabelJemaat[]; disabled?: boolean }) {
  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <AddLabelDialog />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Label</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <LabelRow key={item.id} item={item} disabled={disabled} />
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-sm text-muted-foreground">
                Belum ada label.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
