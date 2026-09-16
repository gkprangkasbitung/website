"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { JemaatSelect } from "@/components/admin/jemaat-select";
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
import { formatRupiah, formatThousands, parseThousands } from "@/lib/format";
import type { JemaatWithLabels, SaranaDanaTransactionType, SaranaDanaTransactionWithJemaat } from "@/types/warta";

const PERSEMBAHAN_KEY = "persembahan_bulanan";

function TransactionRow({
  itemId,
  transaction,
  disabled,
}: {
  itemId: string;
  transaction: SaranaDanaTransactionWithJemaat;
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
      <TableCell>{transaction.jemaat?.nama ?? "-"}</TableCell>
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

function AddTransactionDialog({
  itemId,
  itemKey,
  jemaatList,
}: {
  itemId: string;
  itemKey: string;
  jemaatList: JemaatWithLabels[];
}) {
  const router = useRouter();
  const isPersembahan = itemKey === PERSEMBAHAN_KEY;
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [tipe, setTipe] = useState<SaranaDanaTransactionType>("masuk");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [jemaatId, setJemaatId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    if (!jumlah) {
      toast.error("Jumlah wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/sarana-dana/${itemId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal,
          tipe: isPersembahan ? "masuk" : tipe,
          jumlah,
          keterangan,
          jemaat_id: isPersembahan ? jemaatId : null,
        }),
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
      setJemaatId(null);
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
          {isPersembahan ? (
            <div className="space-y-2">
              <Label>Tipe</Label>
              <p className="text-sm text-muted-foreground">Pemasukan (tetap)</p>
            </div>
          ) : (
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
          )}
          {isPersembahan && (
            <div className="space-y-2">
              <Label>Jemaat (opsional)</Label>
              <JemaatSelect
                value={jemaatId}
                onChange={setJemaatId}
                jemaatList={jemaatList}
                placeholder="Pilih jemaat (opsional)"
                disabled={isPending}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="jumlah">Jumlah</Label>
            <Input
              id="jumlah"
              inputMode="numeric"
              value={formatThousands(jumlah)}
              onChange={(e) => setJumlah(parseThousands(e.target.value))}
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
  itemKey,
  transactions,
  jemaatList,
  disabled,
}: {
  itemId: string;
  itemKey: string;
  transactions: SaranaDanaTransactionWithJemaat[];
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <AddTransactionDialog itemId={itemId} itemKey={itemKey} jemaatList={jemaatList} />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="tanggal">Tanggal</SortableTableHead>
            <SortableTableHead sortKey="tipe">Tipe</SortableTableHead>
            <SortableTableHead sortKey="jumlah">Jumlah</SortableTableHead>
            <TableHead>Jemaat</TableHead>
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
              <TableCell colSpan={6} className="text-sm text-muted-foreground">
                Belum ada transaksi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
