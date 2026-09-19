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
import type { Wilayah } from "@/types/warta";

function EditWilayahDialog({
  wilayah,
  disabled,
  open,
  onOpenChange,
}: {
  wilayah: Wilayah;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [nama, setNama] = useState(wilayah.nama);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/wilayah/${wilayah.id}`, {
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
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{wilayah.nama}</DialogTitle>
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

function WilayahRow({ wilayah, disabled }: { wilayah: Wilayah; disabled?: boolean }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/wilayah/${wilayah.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus");
        return;
      }

      toast.success("Wilayah dihapus");
      router.refresh();
    });
  }

  return (
    <TableRow className="group/row">
      <TableCell>{wilayah.nama}</TableCell>
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
      <EditWilayahDialog wilayah={wilayah} disabled={disabled} open={editOpen} onOpenChange={setEditOpen} />
      {!disabled && (
        <ConfirmDeleteButton
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={onDelete}
          isPending={isPending}
          title={`Hapus wilayah "${wilayah.nama}"?`}
        />
      )}
    </TableRow>
  );
}

function AddWilayahDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const nama = formData.get("nama");

    if (typeof nama !== "string" || !nama.trim()) {
      toast.error("Nama wilayah wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/wilayah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menambah wilayah");
        return;
      }

      toast.success("Wilayah ditambahkan");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Tambah Wilayah</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Wilayah</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" name="nama" required />
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

export function WilayahEditor({ items, disabled }: { items: Wilayah[]; disabled?: boolean }) {
  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <AddWilayahDialog />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="nama">Nama</SortableTableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <WilayahRow key={item.id} wilayah={item} disabled={disabled} />
          ))}
          {items.length === 0 && (
            <TableEmptyState colSpan={2} action={!disabled && <AddWilayahDialog />}>
              Belum ada wilayah.
            </TableEmptyState>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
