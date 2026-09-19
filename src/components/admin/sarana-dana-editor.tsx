"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { formatRupiah } from "@/lib/format";
import type { SaranaDanaBalance } from "@/types/warta";

function EditKeteranganDialog({
  item,
  disabled,
  open,
  onOpenChange,
}: {
  item: SaranaDanaBalance;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [keterangan, setKeterangan] = useState(item.keterangan ?? "");
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/sarana-dana/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keterangan }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan");
        return;
      }

      toast.success(`${item.name} tersimpan`);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Input
              id="keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={disabled || isPending}
              placeholder="Keterangan"
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

function SaranaDanaRow({ item, disabled }: { item: SaranaDanaBalance; disabled?: boolean }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <TableRow className="group/row">
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell className="text-right font-medium tabular-nums">{formatRupiah(item.saldo)}</TableCell>
      <TableCell className="max-w-64 truncate">{item.keterangan ?? "-"}</TableCell>
      <TableCell className="text-right">
        <RowActionsMenu>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>{disabled ? "Lihat" : "Edit"}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/admin/sarana-dana/${item.key}`} />}>
            Lihat Transaksi
          </DropdownMenuItem>
        </RowActionsMenu>
      </TableCell>
      <EditKeteranganDialog item={item} disabled={disabled} open={editOpen} onOpenChange={setEditOpen} />
    </TableRow>
  );
}

export function SaranaDanaEditor({ items, disabled }: { items: SaranaDanaBalance[]; disabled?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead className="text-right">Saldo Saat Ini</TableHead>
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
