"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HubunganKeluargaSelect } from "@/components/admin/hubungan-keluarga-select";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
import { StatusBadge } from "@/components/admin/status-badge";
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
import {
  STATUS_KEANGGOTAAN_OPTIONS,
  type JemaatCatatanPastoral,
  type JemaatProfile,
  type JenisKelamin,
  type KeluargaMember,
  type LabelJemaat,
  type Wilayah,
} from "@/types/warta";

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
  keluargaNama: string;
  hubungan_keluarga: string;
  status_keanggotaan: string | null;
  pekerjaan: string;
  nomor_anggota: string;
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
    keluargaNama: "",
    hubungan_keluarga: "",
    status_keanggotaan: null,
    pekerjaan: "",
    nomor_anggota: "",
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
    keluargaNama: jemaat.keluarga?.nama ?? "",
    hubungan_keluarga: jemaat.hubungan_keluarga ?? "",
    status_keanggotaan: jemaat.status_keanggotaan,
    pekerjaan: jemaat.pekerjaan ?? "",
    nomor_anggota: jemaat.nomor_anggota ?? "",
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
    keluarga_nama: values.keluargaNama,
    hubungan_keluarga: values.hubungan_keluarga.trim() || null,
    status_keanggotaan: values.status_keanggotaan,
    pekerjaan: values.pekerjaan.trim() || null,
    nomor_anggota: values.nomor_anggota.trim() || null,
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
      value={value ?? ""}
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

function StatusKeanggotaanSelect({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const items = Object.fromEntries(STATUS_KEANGGOTAAN_OPTIONS.map((o) => [o.value, o.label]));

  return (
    <Select value={value ?? ""} onValueChange={(v) => v && onChange(v)} items={items} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Pilih status" />
      </SelectTrigger>
      <SelectContent>
        {STATUS_KEANGGOTAAN_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
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
      value={value ?? ""}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nama">Nama</Label>
          <Input id="nama" value={values.nama} onChange={(e) => set("nama", e.target.value)} disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nomor_anggota">No. Anggota</Label>
          <Input
            id="nomor_anggota"
            value={values.nomor_anggota}
            onChange={(e) => set("nomor_anggota", e.target.value)}
            placeholder="mis. RB-0142"
            disabled={disabled}
          />
        </div>
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
          <Label>Status Keanggotaan</Label>
          <StatusKeanggotaanSelect
            value={values.status_keanggotaan}
            onChange={(v) => set("status_keanggotaan", v)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Wilayah</Label>
          <WilayahSelect
            value={values.wilayah_id}
            onChange={(v) => set("wilayah_id", v)}
            allWilayah={allWilayah}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pekerjaan">Pekerjaan</Label>
          <Input
            id="pekerjaan"
            value={values.pekerjaan}
            onChange={(e) => set("pekerjaan", e.target.value)}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="keluarga">Nama Keluarga</Label>
          <Input
            id="keluarga"
            value={values.keluargaNama}
            onChange={(e) => set("keluargaNama", e.target.value)}
            placeholder="mis. Kel. Saragih"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Hubungan dalam Keluarga</Label>
          <HubunganKeluargaSelect
            value={values.hubungan_keluarga || null}
            onChange={(v) => set("hubungan_keluarga", v)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Label/Jabatan</Label>
        <LabelMultiSelect allLabels={allLabels} value={values.labelIds} onChange={(v) => set("labelIds", v)} disabled={disabled} />
      </div>
    </>
  );
}

function KeluargaAnggotaList({ members }: { members: KeluargaMember[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada anggota keluarga lain yang tercatat.</p>;
  }

  return (
    <div className="divide-y rounded-lg border">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <div>
            <p className="font-medium">{m.nama}</p>
            <p className="text-xs text-muted-foreground">{m.hubungan_keluarga ?? "-"}</p>
          </div>
          <StatusBadge status={m.status_keanggotaan} />
        </div>
      ))}
    </div>
  );
}

function CatatanPastoralSection({
  jemaatId,
  notes,
  disabled,
}: {
  jemaatId: string;
  notes: JemaatCatatanPastoral[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [jenis, setJenis] = useState("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [isi, setIsi] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    if (!jenis.trim() || !isi.trim()) {
      toast.error("Jenis dan isi catatan wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/jemaat/${jemaatId}/catatan-pastoral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis, tanggal, isi }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan catatan");
        return;
      }

      toast.success("Catatan tersimpan");
      setJenis("");
      setIsi("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada catatan pastoral.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg border p-3 text-sm">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{n.jenis}</Badge>
                <span className="text-xs text-muted-foreground">
                  {n.tanggal} · {n.penulis_nama ?? "-"}
                </span>
              </div>
              <p className="text-sm">{n.isi}</p>
            </div>
          ))}
        </div>
      )}
      {!disabled && (
        <div className="space-y-2 rounded-lg border p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input placeholder="Jenis (mis. Kunjungan)" value={jenis} onChange={(e) => setJenis(e.target.value)} disabled={isPending} />
            <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={isPending} />
          </div>
          <textarea
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            disabled={isPending}
            rows={3}
            placeholder="Hasil kunjungan, pergumulan keluarga, kebutuhan diakonia..."
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button size="sm" onClick={onSubmit} disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan Catatan"}
          </Button>
        </div>
      )}
    </div>
  );
}

function EditJemaatDialog({
  jemaat,
  allLabels,
  allWilayah,
  familyMembers,
  pastoralNotes,
  disabled,
}: {
  jemaat: JemaatProfile;
  allLabels: LabelJemaat[];
  allWilayah: Wilayah[];
  familyMembers: KeluargaMember[];
  pastoralNotes: JemaatCatatanPastoral[];
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
      <DialogTrigger render={<Button size="sm" variant="link" className="h-auto p-0" />}>
        {disabled ? "Lihat" : "Detail"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{jemaat.nama}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <ProfileFields
              values={values}
              set={set}
              allLabels={allLabels}
              allWilayah={allWilayah}
              disabled={disabled || isPending}
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Anggota Keluarga</h4>
            <KeluargaAnggotaList members={familyMembers} />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Catatan Pastoral</h4>
            <CatatanPastoralSection jemaatId={jemaat.id} notes={pastoralNotes} disabled={disabled} />
          </div>

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
  familyMembers,
  pastoralNotes,
  disabled,
}: {
  jemaat: JemaatProfile;
  allLabels: LabelJemaat[];
  allWilayah: Wilayah[];
  familyMembers: KeluargaMember[];
  pastoralNotes: JemaatCatatanPastoral[];
  disabled?: boolean;
}) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-mono text-xs">{jemaat.nomor_anggota ?? "-"}</TableCell>
      <TableCell className="font-medium">{jemaat.nama}</TableCell>
      <TableCell>{jemaat.keluarga?.nama ?? "-"}</TableCell>
      <TableCell>{jemaat.wilayah?.nama ?? "-"}</TableCell>
      <TableCell>
        <StatusBadge status={jemaat.status_keanggotaan} />
      </TableCell>
      <TableCell className="whitespace-nowrap">{jemaat.no_hp ?? "-"}</TableCell>
      <TableCell className="text-right">
        <EditJemaatDialog
          jemaat={jemaat}
          allLabels={allLabels}
          allWilayah={allWilayah}
          familyMembers={familyMembers}
          pastoralNotes={pastoralNotes}
          disabled={disabled}
        />
      </TableCell>
    </TableRow>
  );
}

export function AddJemaatDialog({ allLabels, allWilayah }: { allLabels: LabelJemaat[]; allWilayah: Wilayah[] }) {
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
      <DialogTrigger render={<Button size="sm" />}>
        <Plus data-icon="inline-start" />
        Tambah Jemaat
      </DialogTrigger>
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
  familyByKeluarga,
  notesByJemaat,
  disabled,
}: {
  items: JemaatProfile[];
  allLabels: LabelJemaat[];
  allWilayah: Wilayah[];
  familyByKeluarga: Record<string, KeluargaMember[]>;
  notesByJemaat: Record<string, JemaatCatatanPastoral[]>;
  disabled?: boolean;
}) {
  const headClassName = "uppercase tracking-wide text-[11px]";

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table className="min-w-190">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={headClassName}>No. Anggota</TableHead>
            <SortableTableHead sortKey="nama" className={headClassName}>
              Nama
            </SortableTableHead>
            <TableHead className={headClassName}>Keluarga</TableHead>
            <TableHead className={headClassName}>Wilayah</TableHead>
            <TableHead className={headClassName}>Status</TableHead>
            <TableHead className={headClassName}>Kontak</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&>tr:nth-child(even)]:bg-muted/40">
          {items.map((item) => (
            <JemaatRow
              key={item.id}
              jemaat={item}
              allLabels={allLabels}
              allWilayah={allWilayah}
              familyMembers={
                item.keluarga_id
                  ? (familyByKeluarga[item.keluarga_id] ?? []).filter((m) => m.id !== item.id)
                  : []
              }
              pastoralNotes={notesByJemaat[item.id] ?? []}
              disabled={disabled}
            />
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-sm text-muted-foreground">
                Belum ada jemaat.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
