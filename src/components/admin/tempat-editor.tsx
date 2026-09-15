"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
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
import type { Tempat } from "@/types/warta";

function EditTempatDialog({ tempat, disabled }: { tempat: Tempat; disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState(tempat.nama);
  const [keterangan, setKeterangan] = useState(tempat.keterangan ?? "");
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/tempat/${tempat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, keterangan }),
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
      const res = await fetch(`/api/admin/tempat/${tempat.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus");
        return;
      }

      toast.success("Tempat dihapus");
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
          <DialogTitle>{tempat.nama}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama</Label>
            <Input
              id="nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              disabled={disabled || isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Input
              id="keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={disabled || isPending}
              placeholder="Alamat/keterangan"
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

function TempatRow({ tempat, disabled }: { tempat: Tempat; disabled?: boolean }) {
  return (
    <TableRow>
      <TableCell>{tempat.nama}</TableCell>
      <TableCell className="max-w-64 truncate">{tempat.keterangan ?? "-"}</TableCell>
      <TableCell>
        <EditTempatDialog tempat={tempat} disabled={disabled} />
      </TableCell>
    </TableRow>
  );
}

function AddTempatDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const nama = formData.get("nama");
    const keterangan = formData.get("keterangan");

    if (typeof nama !== "string" || !nama.trim()) {
      toast.error("Nama tempat wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/tempat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, keterangan }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menambah tempat");
        return;
      }

      toast.success("Tempat ditambahkan");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Tambah Tempat</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Tempat</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" name="nama" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Input id="keterangan" name="keterangan" placeholder="Alamat/keterangan" />
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

export function TempatEditor({ items, disabled }: { items: Tempat[]; disabled?: boolean }) {
  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <AddTempatDialog />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="nama">Nama</SortableTableHead>
            <SortableTableHead sortKey="keterangan">Keterangan</SortableTableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TempatRow key={item.id} tempat={item} disabled={disabled} />
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-sm text-muted-foreground">
                Belum ada tempat.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
