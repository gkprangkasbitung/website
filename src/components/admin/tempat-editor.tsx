"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
import { TableEmptyState } from "@/components/admin/table-empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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

function EditTempatDialog({
  tempat,
  disabled,
  open,
  onOpenChange,
}: {
  tempat: Tempat;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
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
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/tempat/${tempat.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus");
        return;
      }

      toast.success("Tempat dihapus");
      router.refresh();
    });
  }

  return (
    <TableRow className="group/row">
      <TableCell>{tempat.nama}</TableCell>
      <TableCell className="max-w-64 truncate">{tempat.keterangan ?? "-"}</TableCell>
      <TableCell className="text-right">
        <RowActionsMenu>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>{disabled ? "Lihat" : "Edit"}</DropdownMenuItem>
          {!disabled && (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              Hapus
            </DropdownMenuItem>
          )}
        </RowActionsMenu>
      </TableCell>
      <EditTempatDialog tempat={tempat} disabled={disabled} open={editOpen} onOpenChange={setEditOpen} />
      {!disabled && (
        <ConfirmDeleteButton
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={onDelete}
          isPending={isPending}
          title={`Hapus tempat "${tempat.nama}"?`}
        />
      )}
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
            <TableEmptyState colSpan={3} action={!disabled && <AddTempatDialog />}>
              Belum ada tempat.
            </TableEmptyState>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
