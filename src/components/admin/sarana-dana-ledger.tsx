"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function AddTransactionRow({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [tipe, setTipe] = useState<SaranaDanaTransactionType>("masuk");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isPending, startTransition] = useTransition();

  function onAdd() {
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

      setJumlah("");
      setKeterangan("");
      toast.success("Transaksi ditambahkan");
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={isPending} />
      </TableCell>
      <TableCell>
        <Select value={tipe} onValueChange={(v) => setTipe(v as SaranaDanaTransactionType)} disabled={isPending}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="masuk">Pemasukan</SelectItem>
            <SelectItem value="keluar">Pengeluaran</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
          disabled={isPending}
          placeholder="0"
        />
      </TableCell>
      <TableCell>
        <Input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          disabled={isPending}
          placeholder="Keterangan"
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Jumlah</TableHead>
          <TableHead>Keterangan</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TransactionRow key={t.id} itemId={itemId} transaction={t} disabled={disabled} />
        ))}
        {!disabled && <AddTransactionRow itemId={itemId} />}
      </TableBody>
    </Table>
  );
}
