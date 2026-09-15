"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import type { SaranaDanaTransaction, SaranaDanaTransactionType } from "@/types/warta";

function TransactionRow({
  itemId,
  transaction,
  disabled,
}: {
  itemId: string;
  transaction: SaranaDanaTransaction;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/sarana-dana/${itemId}/transactions/${transaction.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus transaksi");
        return;
      }

      toast.success("Transaksi dihapus");
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell>{transaction.tanggal}</TableCell>
      <TableCell>
        <Badge variant={transaction.tipe === "masuk" ? "default" : "destructive"}>
          {transaction.tipe === "masuk" ? "Pemasukan" : "Pengeluaran"}
        </Badge>
      </TableCell>
      <TableCell className={transaction.tipe === "masuk" ? "text-foreground" : "text-destructive"}>
        {transaction.tipe === "masuk" ? "+" : "-"}
        {formatRupiah(transaction.jumlah)}
      </TableCell>
      <TableCell>{transaction.keterangan ?? "-"}</TableCell>
      <TableCell>
        {!disabled && (
          <Button size="sm" variant="ghost" onClick={onDelete} disabled={isPending}>
            Hapus
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function AddTransactionDialog({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [tipe, setTipe] = useState<SaranaDanaTransactionType>("masuk");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    if (!jumlah || Number(jumlah) < 0) {
      toast.error("Jumlah wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/sarana-dana/${itemId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal, tipe, jumlah, keterangan }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menambah transaksi");
        return;
      }

      toast.success("Transaksi ditambahkan");
      setOpen(false);
      setJumlah("");
      setKeterangan("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Tambah Transaksi</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Transaksi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipe</Label>
            <Select
              value={tipe}
              onValueChange={(v) => v && setTipe(v as SaranaDanaTransactionType)}
              items={{ masuk: "Pemasukan", keluar: "Pengeluaran" }}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masuk">Pemasukan</SelectItem>
                <SelectItem value="keluar">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jumlah">Jumlah</Label>
            <Input
              id="jumlah"
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              disabled={isPending}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Input
              id="keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={isPending}
              placeholder="Keterangan"
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={onSubmit} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SaranaDanaLedger({
  itemId,
  transactions,
  disabled,
}: {
  itemId: string;
  transactions: SaranaDanaTransaction[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <AddTransactionDialog itemId={itemId} />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="tanggal">Tanggal</SortableTableHead>
            <SortableTableHead sortKey="tipe">Tipe</SortableTableHead>
            <SortableTableHead sortKey="jumlah">Jumlah</SortableTableHead>
            <SortableTableHead sortKey="keterangan">Keterangan</SortableTableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TransactionRow key={t.id} itemId={itemId} transaction={t} disabled={disabled} />
          ))}
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-sm text-muted-foreground">
                Belum ada transaksi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
