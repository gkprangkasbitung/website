"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { JemaatProfile, JenisKelamin, LabelJemaat, Wilayah } from "@/types/warta";

const JENIS_KELAMIN_LABEL: Record<JenisKelamin, string> = {
  laki_laki: "Laki-laki",
  perempuan: "Perempuan",
};

type ProfileFormValues = {
  nama: string;
  labelIds: string[];
  jenis_kelamin: JenisKelamin | null;
  alamat: string;
  wilayah_id: string | null;
  no_hp: string;
  tanggal_lahir: string;
  tanggal_masuk: string;
  sudah_baptis: boolean;
  sudah_sidi: boolean;
};

function emptyValues(): ProfileFormValues {
  return {
    nama: "",
    labelIds: [],
    jenis_kelamin: null,
    alamat: "",
    wilayah_id: null,
    no_hp: "",
    tanggal_lahir: "",
    tanggal_masuk: "",
    sudah_baptis: false,
    sudah_sidi: false,
  };
}

function valuesFromJemaat(jemaat: JemaatProfile): ProfileFormValues {
  return {
    nama: jemaat.nama,
    labelIds: jemaat.labels.map((l) => l.id),
    jenis_kelamin: jemaat.jenis_kelamin,
    alamat: jemaat.alamat ?? "",
    wilayah_id: jemaat.wilayah_id,
    no_hp: jemaat.no_hp ?? "",
    tanggal_lahir: jemaat.tanggal_lahir ?? "",
    tanggal_masuk: jemaat.tanggal_masuk ?? "",
    sudah_baptis: jemaat.sudah_baptis,
    sudah_sidi: jemaat.sudah_sidi,
  };
}

function toPayload(values: ProfileFormValues) {
  return {
    nama: values.nama,
    label_ids: values.labelIds,
    jenis_kelamin: values.jenis_kelamin,
    alamat: values.alamat.trim() || null,
    wilayah_id: values.wilayah_id,
    no_hp: values.no_hp.trim() || null,
    tanggal_lahir: values.tanggal_lahir || null,
    tanggal_masuk: values.tanggal_masuk || null,
    sudah_baptis: values.sudah_baptis,
    sudah_sidi: values.sudah_sidi,
  };
}

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
      <SelectTrigger className="w-full">
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

function JenisKelaminSelect({
  value,
  onChange,
  disabled,
}: {
  value: JenisKelamin | null;
  onChange: (value: JenisKelamin) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value ?? undefined}
      onValueChange={(v) => v && onChange(v as JenisKelamin)}
      items={JENIS_KELAMIN_LABEL}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Pilih jenis kelamin" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="laki_laki">Laki-laki</SelectItem>
        <SelectItem value="perempuan">Perempuan</SelectItem>
      </SelectContent>
    </Select>
  );
}

function WilayahSelect({
  value,
  onChange,
  allWilayah,
  disabled,
}: {
  value: string | null;
  onChange: (value: string) => void;
  allWilayah: Wilayah[];
  disabled?: boolean;
}) {
  const items = Object.fromEntries(allWilayah.map((w) => [w.id, w.nama]));

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(v) => v && onChange(v)}
      items={items}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Pilih wilayah" />
      </SelectTrigger>
      <SelectContent>
        {allWilayah.map((w) => (
          <SelectItem key={w.id} value={w.id}>
            {w.nama}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProfileFields({
  values,
  set,
  allLabels,
  allWilayah,
  disabled,
}: {
  values: ProfileFormValues;
  set: <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => void;
  allLabels: LabelJemaat[];
  allWilayah: Wilayah[];
  disabled?: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="nama">Nama</Label>
        <Input
          id="nama"
          value={values.nama}
          onChange={(e) => set("nama", e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label>Label/Jabatan</Label>
        <LabelMultiSelect allLabels={allLabels} value={values.labelIds} onChange={(v) => set("labelIds", v)} disabled={disabled} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Jenis Kelamin</Label>
          <JenisKelaminSelect
            value={values.jenis_kelamin}
            onChange={(v) => set("jenis_kelamin", v)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Wilayah</Label>
          <WilayahSelect
            value={values.wilayah_id}
            onChange={(v) => set("wilayah_id", v)}
            allWilayah={allWilayah}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="alamat">Alamat</Label>
        <Input id="alamat" value={values.alamat} onChange={(e) => set("alamat", e.target.value)} disabled={disabled} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="no_hp">Nomor HP/WA</Label>
          <Input id="no_hp" value={values.no_hp} onChange={(e) => set("no_hp", e.target.value)} disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
          <Input
            id="tanggal_lahir"
            type="date"
            value={values.tanggal_lahir}
            onChange={(e) => set("tanggal_lahir", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tanggal_masuk">Tanggal Masuk</Label>
        <Input
          id="tanggal_masuk"
          type="date"
          value={values.tanggal_masuk}
          onChange={(e) => set("tanggal_masuk", e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-1.5 text-sm">
          <Checkbox
            checked={values.sudah_baptis}
            onCheckedChange={(checked) => set("sudah_baptis", checked === true)}
            disabled={disabled}
          />
          Sudah Dibaptis
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <Checkbox
            checked={values.sudah_sidi}
            onCheckedChange={(checked) => set("sudah_sidi", checked === true)}
            disabled={disabled}
          />
          Sudah Pengakuan Iman (Sidi)
        </label>
      </div>
    </>
  );
}

function EditJemaatDialog({
  jemaat,
  allLabels,
  allWilayah,
  disabled,
}: {
  jemaat: JemaatProfile;
  allLabels: LabelJemaat[];
  allWilayah: Wilayah[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ProfileFormValues>(() => valuesFromJemaat(jemaat));
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/jemaat/${jemaat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan");
        return;
      }

      toast.success("Tersimpan");
      setOpen(false);
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
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValues(valuesFromJemaat(jemaat));
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        {disabled ? "Lihat" : "Detail"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{jemaat.nama}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ProfileFields
            values={values}
            set={set}
            allLabels={allLabels}
            allWilayah={allWilayah}
            disabled={disabled || isPending}
          />
          {!disabled && (
            <DialogFooter>
              <Button size="sm" variant="ghost" onClick={onDelete} disabled={isPending}>
                Hapus
              </Button>
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

function JemaatRow({
  jemaat,
  allLabels,
  allWilayah,
  disabled,
}: {
  jemaat: JemaatProfile;
  allLabels: LabelJemaat[];
  allWilayah: Wilayah[];
  disabled?: boolean;
}) {
  return (
    <TableRow>
      <TableCell>{jemaat.nama}</TableCell>
      <TableCell>{jemaat.jenis_kelamin ? JENIS_KELAMIN_LABEL[jemaat.jenis_kelamin] : "-"}</TableCell>
      <TableCell>{jemaat.wilayah?.nama ?? "-"}</TableCell>
      <TableCell>{jemaat.labels.length > 0 ? jemaat.labels.map((l) => l.nama).join(", ") : "-"}</TableCell>
      <TableCell>
        <EditJemaatDialog jemaat={jemaat} allLabels={allLabels} allWilayah={allWilayah} disabled={disabled} />
      </TableCell>
    </TableRow>
  );
}

function AddJemaatDialog({ allLabels, allWilayah }: { allLabels: LabelJemaat[]; allWilayah: Wilayah[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ProfileFormValues>(emptyValues);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit() {
    if (!values.nama.trim()) {
      toast.error("Nama jemaat wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/jemaat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menambah jemaat");
        return;
      }

      toast.success("Jemaat ditambahkan");
      setOpen(false);
      setValues(emptyValues());
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Tambah Jemaat</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Jemaat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ProfileFields values={values} set={set} allLabels={allLabels} allWilayah={allWilayah} disabled={isPending} />
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

export function JemaatEditor({
  items,
  allLabels,
  allWilayah,
  disabled,
}: {
  items: JemaatProfile[];
  allLabels: LabelJemaat[];
  allWilayah: Wilayah[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <AddJemaatDialog allLabels={allLabels} allWilayah={allWilayah} />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="nama">Nama</SortableTableHead>
            <TableHead>Jenis Kelamin</TableHead>
            <TableHead>Wilayah</TableHead>
            <TableHead>Label/Jabatan</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <JemaatRow key={item.id} jemaat={item} allLabels={allLabels} allWilayah={allWilayah} disabled={disabled} />
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-sm text-muted-foreground">
                Belum ada jemaat.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
