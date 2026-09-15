"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tempat } from "@/types/warta";

function TempatRow({ tempat, disabled }: { tempat: Tempat; disabled?: boolean }) {
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
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Input value={nama} onChange={(e) => setNama(e.target.value)} disabled={disabled || isPending} />
      </TableCell>
      <TableCell>
        <Input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          disabled={disabled || isPending}
          placeholder="Alamat/keterangan"
        />
      </TableCell>
      <TableCell className="space-x-2 whitespace-nowrap">
        {!disabled && (
          <>
            <Button size="sm" variant="outline" onClick={onSave} disabled={isPending}>
              Simpan
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} disabled={isPending}>
              Hapus
            </Button>
          </>
        )}
      </TableCell>
    </TableRow>
  );
}

function AddTempatRow() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isPending, startTransition] = useTransition();

  function onAdd() {
    if (!nama.trim()) {
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

      setNama("");
      setKeterangan("");
      toast.success("Tempat ditambahkan");
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Input value={nama} onChange={(e) => setNama(e.target.value)} disabled={isPending} placeholder="Nama tempat baru" />
      </TableCell>
      <TableCell>
        <Input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          disabled={isPending}
          placeholder="Alamat/keterangan"
        />
      </TableCell>
      <TableCell>
        <Button size="sm" onClick={onAdd} disabled={isPending}>
          {isPending ? "..." : "Tambah"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function TempatEditor({ items, disabled }: { items: Tempat[]; disabled?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Keterangan</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TempatRow key={item.id} tempat={item} disabled={disabled} />
        ))}
        {!disabled && <AddTempatRow />}
      </TableBody>
    </Table>
  );
}
