"use client";

import Link from "next/link";
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

export type KeluargaRow = {
  id: string;
  nama: string;
  members: string[];
};

export function AddKeluargaDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const nama = formData.get("nama");

    if (typeof nama !== "string" || !nama.trim()) {
      toast.error("Nama keluarga wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/keluarga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menambah keluarga");
        return;
      }

      toast.success("Keluarga ditambahkan");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Tambah Keluarga</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Keluarga</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Keluarga</Label>
            <Input id="nama" name="nama" placeholder="mis. Kel. Saragih" required />
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

function KeluargaRow({ item, disabled }: { item: KeluargaRow; disabled?: boolean }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/keluarga/${item.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus keluarga");
        return;
      }

      toast.success("Keluarga dihapus");
      router.refresh();
    });
  }

  return (
    <TableRow className="group/row">
      <TableCell className="font-medium">{item.nama}</TableCell>
      <TableCell className="text-right tabular-nums">{item.members.length}</TableCell>
      <TableCell className="max-w-xs truncate text-muted-foreground">
        {item.members.length > 0 ? item.members.join(", ") : "-"}
      </TableCell>
      <TableCell className="text-right">
        <RowActionsMenu>
          <DropdownMenuItem render={<Link href={`/admin/keluarga/${item.id}`} />}>
            {disabled ? "Lihat" : "Edit"}
          </DropdownMenuItem>
          {!disabled && (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              Hapus
            </DropdownMenuItem>
          )}
        </RowActionsMenu>
      </TableCell>
      {!disabled && (
        <ConfirmDeleteButton
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={onDelete}
          isPending={isPending}
          title={`Hapus keluarga "${item.nama}"?`}
          description={
            item.members.length > 0
              ? "Anggota yang masih tercatat di keluarga ini akan dilepas (tidak ikut terhapus), dan hubungan keluarganya dikosongkan. Tindakan ini tidak bisa dibatalkan."
              : "Tindakan ini tidak bisa dibatalkan."
          }
        />
      )}
    </TableRow>
  );
}

export function KeluargaEditor({ items, disabled }: { items: KeluargaRow[]; disabled?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableTableHead sortKey="nama">Nama Keluarga</SortableTableHead>
          <TableHead className="text-right">Jumlah Anggota</TableHead>
          <TableHead>Anggota</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <KeluargaRow key={item.id} item={item} disabled={disabled} />
        ))}
        {items.length === 0 && (
          <TableEmptyState colSpan={4} action={!disabled && <AddKeluargaDialog />}>
            Belum ada keluarga.
          </TableEmptyState>
        )}
      </TableBody>
    </Table>
  );
}
