"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import type { JemaatWithLabels, LabelJemaat } from "@/types/warta";

function LabelMultiSelect({
  allLabels,
  value,
  onChange,
  disabled,
}: {
  allLabels: LabelJemaat[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  if (allLabels.length === 0) {
    return <p className="text-xs text-muted-foreground">Belum ada label - buat di halaman Label Jemaat.</p>;
  }

  return (
    <Select multiple value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Pilih label">
          {(selected: string[]) =>
            selected.length > 0
              ? allLabels
                  .filter((l) => selected.includes(l.id))
                  .map((l) => l.nama)
                  .join(", ")
              : "Pilih label"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {allLabels.map((label) => (
          <SelectItem key={label.id} value={label.id}>
            {label.nama}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function JemaatRow({
  jemaat,
  allLabels,
  disabled,
}: {
  jemaat: JemaatWithLabels;
  allLabels: LabelJemaat[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [nama, setNama] = useState(jemaat.nama);
  const [labelIds, setLabelIds] = useState(jemaat.labels.map((l) => l.id));
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/jemaat/${jemaat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, label_ids: labelIds }),
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
      const res = await fetch(`/api/admin/jemaat/${jemaat.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus");
        return;
      }

      toast.success("Jemaat dihapus");
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="align-top">
        <Input value={nama} onChange={(e) => setNama(e.target.value)} disabled={disabled || isPending} />
      </TableCell>
      <TableCell className="align-top">
        <LabelMultiSelect allLabels={allLabels} value={labelIds} onChange={setLabelIds} disabled={disabled || isPending} />
      </TableCell>
      <TableCell className="space-x-2 whitespace-nowrap align-top">
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

function AddJemaatRow({ allLabels }: { allLabels: LabelJemaat[] }) {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function onAdd() {
    if (!nama.trim()) {
      toast.error("Nama jemaat wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/jemaat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, label_ids: labelIds }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menambah jemaat");
        return;
      }

      setNama("");
      setLabelIds([]);
      toast.success("Jemaat ditambahkan");
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="align-top">
        <Input value={nama} onChange={(e) => setNama(e.target.value)} disabled={isPending} placeholder="Nama jemaat baru" />
      </TableCell>
      <TableCell className="align-top">
        <LabelMultiSelect allLabels={allLabels} value={labelIds} onChange={setLabelIds} disabled={isPending} />
      </TableCell>
      <TableCell className="align-top">
        <Button size="sm" onClick={onAdd} disabled={isPending}>
          {isPending ? "..." : "Tambah"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function JemaatEditor({
  items,
  allLabels,
  disabled,
}: {
  items: JemaatWithLabels[];
  allLabels: LabelJemaat[];
  disabled?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Label/Jabatan</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <JemaatRow key={item.id} jemaat={item} allLabels={allLabels} disabled={disabled} />
        ))}
        {!disabled && <AddJemaatRow allLabels={allLabels} />}
      </TableBody>
    </Table>
  );
}
