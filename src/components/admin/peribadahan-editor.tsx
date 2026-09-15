"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import type {
  JemaatWithLabels,
  PeribadahanCategory,
  PeribadahanItemWithRelations,
  Tempat,
} from "@/types/warta";

const HARI_OPTIONS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

/** A jemaat with multiple labels appears once under each of their labels. */
function groupJemaatByLabel(jemaat: JemaatWithLabels[]) {
  const groups = new Map<string, JemaatWithLabels[]>();
  for (const j of jemaat) {
    const labelNames = j.labels.length > 0 ? j.labels.map((l) => l.nama) : ["Lainnya"];
    for (const name of labelNames) {
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name)!.push(j);
    }
  }
  return Array.from(groups.entries());
}

function HariSelect({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-28">
        <SelectValue placeholder="Hari" />
      </SelectTrigger>
      <SelectContent>
        {HARI_OPTIONS.map((hari) => (
          <SelectItem key={hari} value={hari}>
            {hari}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TempatSelect({
  value,
  onChange,
  tempatList,
  disabled,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  tempatList: Tempat[];
  disabled?: boolean;
}) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Tempat" />
      </SelectTrigger>
      <SelectContent>
        {tempatList.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.nama}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PetugasSelect({
  value,
  onChange,
  jemaatList,
  disabled,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}) {
  const groups = groupJemaatByLabel(jemaatList);

  return (
    <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Petugas" />
      </SelectTrigger>
      <SelectContent>
        {groups.map(([label, members]) => (
          <SelectGroup key={label}>
            <SelectLabel>{label}</SelectLabel>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nama}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

function ItemRow({
  item,
  tempatList,
  jemaatList,
  disabled,
  showCategory,
}: {
  item: PeribadahanItemWithRelations;
  tempatList: Tempat[];
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
  showCategory: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    label: item.label ?? "",
    hari: item.hari,
    jam: item.jam ?? "",
    tempat_id: item.tempat_id,
    petugas_id: item.petugas_id,
  });
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/peribadahan/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
      const res = await fetch(`/api/admin/peribadahan/${item.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus");
        return;
      }

      toast.success("Baris dihapus");
      router.refresh();
    });
  }

  return (
    <TableRow>
      {showCategory && <TableCell className="font-medium">{item.category?.name ?? "-"}</TableCell>}
      <TableCell>
        <Input
          value={values.label}
          onChange={(e) => setValues((prev) => ({ ...prev, label: e.target.value }))}
          disabled={disabled || isPending}
          placeholder="Mis. Sesi 1"
        />
      </TableCell>
      <TableCell>
        <HariSelect
          value={values.hari}
          onChange={(v) => setValues((prev) => ({ ...prev, hari: v }))}
          disabled={disabled || isPending}
        />
      </TableCell>
      <TableCell>
        <Input
          type="time"
          value={values.jam}
          onChange={(e) => setValues((prev) => ({ ...prev, jam: e.target.value }))}
          disabled={disabled || isPending}
        />
      </TableCell>
      <TableCell>
        <TempatSelect
          value={values.tempat_id}
          onChange={(v) => setValues((prev) => ({ ...prev, tempat_id: v }))}
          tempatList={tempatList}
          disabled={disabled || isPending}
        />
      </TableCell>
      <TableCell>
        <PetugasSelect
          value={values.petugas_id}
          onChange={(v) => setValues((prev) => ({ ...prev, petugas_id: v }))}
          jemaatList={jemaatList}
          disabled={disabled || isPending}
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

function AddItemRow({
  tanggal,
  categories,
  lockedCategoryId,
  tempatList,
  jemaatList,
}: {
  tanggal: string;
  categories: PeribadahanCategory[];
  lockedCategoryId?: string;
  tempatList: Tempat[];
  jemaatList: JemaatWithLabels[];
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string | null>(lockedCategoryId ?? categories[0]?.id ?? null);
  const [values, setValues] = useState<{
    label: string;
    hari: string | null;
    jam: string;
    tempat_id: string | null;
    petugas_id: string | null;
  }>({ label: "", hari: null, jam: "", tempat_id: null, petugas_id: null });
  const [isPending, startTransition] = useTransition();

  function onAdd() {
    if (!categoryId) {
      toast.error("Pilih jenis peribadahan dulu");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/peribadahan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, tanggal, ...values }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menambah baris");
        return;
      }

      setValues({ label: "", hari: null, jam: "", tempat_id: null, petugas_id: null });
      toast.success("Baris ditambahkan");
      router.refresh();
    });
  }

  return (
    <TableRow>
      {!lockedCategoryId && (
        <TableCell>
          <Select value={categoryId ?? undefined} onValueChange={setCategoryId} disabled={isPending}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Jenis" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
      <TableCell>
        <Input
          value={values.label}
          onChange={(e) => setValues((prev) => ({ ...prev, label: e.target.value }))}
          disabled={isPending}
          placeholder="Mis. Sesi 1"
        />
      </TableCell>
      <TableCell>
        <HariSelect
          value={values.hari}
          onChange={(v) => setValues((prev) => ({ ...prev, hari: v }))}
          disabled={isPending}
        />
      </TableCell>
      <TableCell>
        <Input
          type="time"
          value={values.jam}
          onChange={(e) => setValues((prev) => ({ ...prev, jam: e.target.value }))}
          disabled={isPending}
        />
      </TableCell>
      <TableCell>
        <TempatSelect
          value={values.tempat_id}
          onChange={(v) => setValues((prev) => ({ ...prev, tempat_id: v }))}
          tempatList={tempatList}
          disabled={isPending}
        />
      </TableCell>
      <TableCell>
        <PetugasSelect
          value={values.petugas_id}
          onChange={(v) => setValues((prev) => ({ ...prev, petugas_id: v }))}
          jemaatList={jemaatList}
          disabled={isPending}
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

export function PeribadahanEditor({
  tanggal,
  items,
  categories,
  lockedCategoryId,
  tempatList,
  jemaatList,
  disabled,
}: {
  tanggal: string;
  items: PeribadahanItemWithRelations[];
  categories: PeribadahanCategory[];
  /** When set, this editor is scoped to one category: the Jenis column is
   * hidden and every new row is created under this category. */
  lockedCategoryId?: string;
  tempatList: Tempat[];
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}) {
  const showCategory = !lockedCategoryId;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showCategory && <TableHead>Jenis</TableHead>}
          <TableHead>Label</TableHead>
          <TableHead>Hari</TableHead>
          <TableHead>Jam</TableHead>
          <TableHead>Tempat</TableHead>
          <TableHead>Petugas</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            tempatList={tempatList}
            jemaatList={jemaatList}
            disabled={disabled}
            showCategory={showCategory}
          />
        ))}
        {!disabled && (
          <AddItemRow
            tanggal={tanggal}
            categories={categories}
            lockedCategoryId={lockedCategoryId}
            tempatList={tempatList}
            jemaatList={jemaatList}
          />
        )}
      </TableBody>
    </Table>
  );
}
