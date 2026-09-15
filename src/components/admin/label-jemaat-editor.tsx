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
import type { LabelJemaat } from "@/types/warta";

function LabelRow({ item, disabled }: { item: LabelJemaat; disabled?: boolean }) {
  const router = useRouter();
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
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Input value={nama} onChange={(e) => setNama(e.target.value)} disabled={disabled || isPending} />
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

function AddLabelRow() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [isPending, startTransition] = useTransition();

  function onAdd() {
    if (!nama.trim()) {
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

      setNama("");
      toast.success("Label ditambahkan");
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Input value={nama} onChange={(e) => setNama(e.target.value)} disabled={isPending} placeholder="Mis. Pendeta" />
      </TableCell>
      <TableCell>
        <Button size="sm" onClick={onAdd} disabled={isPending}>
          {isPending ? "..." : "Tambah"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function LabelJemaatEditor({ items, disabled }: { items: LabelJemaat[]; disabled?: boolean }) {
  return (
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
        {!disabled && <AddLabelRow />}
      </TableBody>
    </Table>
  );
}
