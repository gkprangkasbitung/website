"use client";

import Link from "next/link";
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

function KeluargaRow({ item }: { item: KeluargaRow }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{item.nama}</TableCell>
      <TableCell>{item.members.length}</TableCell>
      <TableCell className="max-w-xs truncate text-muted-foreground">
        {item.members.length > 0 ? item.members.join(", ") : "-"}
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="link"
          className="h-auto p-0"
          render={<Link href={`/admin/keluarga/${item.id}`} />}
          nativeButton={false}
        >
          Detail
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function KeluargaEditor({ items }: { items: KeluargaRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableTableHead sortKey="nama">Nama Keluarga</SortableTableHead>
            <TableHead>Jumlah Anggota</TableHead>
            <TableHead>Anggota</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&>tr:nth-child(even)]:bg-muted/40">
          {items.map((item) => (
            <KeluargaRow key={item.id} item={item} />
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-sm text-muted-foreground">
                Belum ada keluarga.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
