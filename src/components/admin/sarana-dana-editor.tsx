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
import type { SaranaDanaItem } from "@/types/warta";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function SaranaDanaRow({ item, disabled }: { item: SaranaDanaItem; disabled?: boolean }) {
  const router = useRouter();
  const [nominal, setNominal] = useState(String(item.nominal));
  const [keterangan, setKeterangan] = useState(item.keterangan ?? "");
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/sarana-dana/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nominal, keterangan }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan");
        return;
      }

      toast.success(`${item.name} tersimpan`);
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>
        <Input
          type="number"
          value={nominal}
          onChange={(e) => setNominal(e.target.value)}
          disabled={disabled || isPending}
        />
        <p className="mt-1 text-xs text-muted-foreground">{formatRupiah(Number(nominal) || 0)}</p>
      </TableCell>
      <TableCell>
        <Input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          disabled={disabled || isPending}
          placeholder="Keterangan"
        />
      </TableCell>
      <TableCell>
        {!disabled && (
          <Button size="sm" variant="outline" onClick={onSave} disabled={isPending}>
            {isPending ? "..." : "Simpan"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function SaranaDanaEditor({ items, disabled }: { items: SaranaDanaItem[]; disabled?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Nominal</TableHead>
          <TableHead>Keterangan</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <SaranaDanaRow key={item.id} item={item} disabled={disabled} />
        ))}
      </TableBody>
    </Table>
  );
}
