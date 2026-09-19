"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { JemaatSelect } from "@/components/admin/jemaat-select";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
import { TableEmptyState } from "@/components/admin/table-empty-state";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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

function EditTransactionDialog({
  itemId,
  itemKey,
  transaction,
  jemaatList,
  open,
  onOpenChange,
}: {
  itemId: string;
  itemKey: string;
  transaction: SaranaDanaTransactionWithJemaat;
  jemaatList: JemaatWithLabels[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isPersembahan = itemKey === PERSEMBAHAN_KEY;
  const [tanggal, setTanggal] = useState(transaction.tanggal);
  const [tipe, setTipe] = useState<SaranaDanaTransactionType>(transaction.tipe);
  const [jumlah, setJumlah] = useState(String(transaction.jumlah));
  const [keterangan, setKeterangan] = useState(transaction.keterangan ?? "");
  const [jemaatId, setJemaatId] = useState<string | null>(transaction.jemaat_id);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    if (!jumlah) {
      toast.error("Jumlah wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/sarana-dana/${itemId}/transactions/${transaction.id}`, {
        method: "PATCH",
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
        toast.error(data?.error ?? "Gagal menyimpan transaksi");
        return;
      }

      toast.success("Transaksi tersimpan");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setTanggal(transaction.tanggal);
          setTipe(transaction.tipe);
          setJumlah(String(transaction.jumlah));
          setKeterangan(transaction.keterangan ?? "");
          setJemaatId(transaction.jemaat_id);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaksi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-tanggal">Tanggal</Label>
            <Input
              id="edit-tanggal"
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
            <Label htmlFor="edit-jumlah">Jumlah</Label>
            <Input
              id="edit-jumlah"
              inputMode="numeric"
              value={formatThousands(jumlah)}
              onChange={(e) => setJumlah(parseThousands(e.target.value))}
              disabled={isPending}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-keterangan">Keterangan</Label>
            <Input
              id="edit-keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={isPending}
              placeholder="Keterangan"
            />
          </div>
          <DialogFooter>
            <Button onClick={onSave} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransactionRow({
  itemId,
  itemKey,
  transaction,
  showJemaat,
  jemaatList,
  disabled,
}: {
  itemId: string;
  itemKey: string;
  transaction: SaranaDanaTransactionWithJemaat;
  showJemaat: boolean;
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    <TableRow className="group/row">
      <TableCell className="text-right tabular-nums">{transaction.tanggal}</TableCell>
      <TableCell>
        <Badge variant={transaction.tipe === "masuk" ? "accent" : "destructive"}>
          {transaction.tipe === "masuk" ? "Pemasukan" : "Pengeluaran"}
        </Badge>
      </TableCell>
      <TableCell
        className={`text-right tabular-nums ${transaction.tipe === "masuk" ? "text-foreground" : "text-destructive"}`}
      >
        {transaction.tipe === "masuk" ? "+" : "-"}
        {formatRupiah(transaction.jumlah)}
      </TableCell>
      {showJemaat && <TableCell>{transaction.jemaat?.nama ?? "-"}</TableCell>}
      <TableCell>{transaction.keterangan ?? "-"}</TableCell>
      <TableCell className="text-right">
        {!disabled && (
          <RowActionsMenu>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              Hapus
            </DropdownMenuItem>
          </RowActionsMenu>
        )}
      </TableCell>
      {!disabled && (
        <>
          <EditTransactionDialog
            itemId={itemId}
            itemKey={itemKey}
            transaction={transaction}
            jemaatList={jemaatList}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <ConfirmDeleteButton
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            onConfirm={onDelete}
            isPending={isPending}
            title={`Hapus transaksi ${formatRupiah(transaction.jumlah)} pada ${transaction.tanggal}?`}
          />
        </>
      )}
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
  const showJemaat = itemKey === PERSEMBAHAN_KEY;

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
            <SortableTableHead sortKey="tanggal" align="right">Tanggal</SortableTableHead>
            <SortableTableHead sortKey="tipe">Tipe</SortableTableHead>
            <SortableTableHead sortKey="jumlah" align="right">Jumlah</SortableTableHead>
            {showJemaat && <TableHead>Jemaat</TableHead>}
            <SortableTableHead sortKey="keterangan">Keterangan</SortableTableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TransactionRow
              key={t.id}
              itemId={itemId}
              itemKey={itemKey}
              transaction={t}
              showJemaat={showJemaat}
              jemaatList={jemaatList}
              disabled={disabled}
            />
          ))}
          {transactions.length === 0 && (
            <TableEmptyState
              colSpan={showJemaat ? 6 : 5}
              action={
                !disabled && <AddTransactionDialog itemId={itemId} itemKey={itemKey} jemaatList={jemaatList} />
              }
            >
              Belum ada transaksi.
            </TableEmptyState>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
