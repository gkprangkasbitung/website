"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { HubunganKeluargaSelect } from "@/components/admin/hubungan-keluarga-select";
import { InitialsAvatar } from "@/components/admin/initials-avatar";
import { KeluargaSelect } from "@/components/admin/keluarga-select";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
import { StatusBadge } from "@/components/admin/status-badge";
import { TableEmptyState } from "@/components/admin/table-empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
  STATUS_KEANGGOTAAN_OPTIONS,
  type JemaatCatatanPastoral,
  type JemaatProfile,
  type JenisKelamin,
  type Keluarga,
  type KeluargaMember,
  type LabelJemaat,
  type Wilayah,
} from "@/types/warta";

const JENIS_KELAMIN_LABEL: Record<JenisKelamin, string> = {
  laki_laki: "Laki-laki",
  perempuan: "Perempuan",
};

export type ProfileFormValues = {
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

export function valuesFromJemaat(jemaat: JemaatProfile): ProfileFormValues {
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

export function toPayload(values: ProfileFormValues) {
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

export function ProfileFields({
  values,
  set,
  allLabels,
  allWilayah,
  allKeluarga,
  disabled,
}: {
  values: ProfileFormValues;
  set: <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => void;
  allLabels: LabelJemaat[];
  allWilayah: Wilayah[];
  allKeluarga: Keluarga[];
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
          <Input
            id="no_hp"
            inputMode="numeric"
            value={values.no_hp}
            onChange={(e) => set("no_hp", e.target.value.replace(/\D/g, ""))}
            disabled={disabled}
          />
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
          <Label>Nama Keluarga</Label>
          <KeluargaSelect
            value={values.keluargaNama}
            onChange={(v) => set("keluargaNama", v)}
            allKeluarga={allKeluarga}
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
        <Label>Label</Label>
        <LabelMultiSelect allLabels={allLabels} value={values.labelIds} onChange={(v) => set("labelIds", v)} disabled={disabled} />
      </div>
    </>
  );
}

export function KeluargaAnggotaList({ members }: { members: KeluargaMember[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada anggota keluarga lain yang tercatat.</p>;
  }

  return (
    <div className="divide-y rounded-lg border">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <div>
            <Link href={`/admin/jemaat/${m.id}`} className="font-medium hover:underline">
              {m.nama}
            </Link>
            <p className="text-xs text-muted-foreground">{m.hubungan_keluarga ?? "-"}</p>
          </div>
          <StatusBadge status={m.status_keanggotaan} />
        </div>
      ))}
    </div>
  );
}

function CatatanFields({
  jenis,
  setJenis,
  tanggal,
  setTanggal,
  isi,
  setIsi,
  disabled,
}: {
  jenis: string;
  setJenis: (value: string) => void;
  tanggal: string;
  setTanggal: (value: string) => void;
  isi: string;
  setIsi: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input placeholder="Jenis (mis. Kunjungan)" value={jenis} onChange={(e) => setJenis(e.target.value)} disabled={disabled} />
        <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={disabled} />
      </div>
      <textarea
        value={isi}
        onChange={(e) => setIsi(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder="Hasil kunjungan, pergumulan keluarga, kebutuhan diakonia..."
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </>
  );
}

function EditCatatanDialog({
  jemaatId,
  note,
}: {
  jemaatId: string;
  note: JemaatCatatanPastoral;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [jenis, setJenis] = useState(note.jenis);
  const [tanggal, setTanggal] = useState(note.tanggal);
  const [isi, setIsi] = useState(note.isi);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    if (!jenis.trim() || !isi.trim()) {
      toast.error("Jenis dan isi catatan wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/jemaat/${jemaatId}/catatan-pastoral/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis, tanggal, isi }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan catatan");
        return;
      }

      toast.success("Catatan diperbarui");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setJenis(note.jenis);
          setTanggal(note.tanggal);
          setIsi(note.isi);
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>Edit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Catatan Pastoral</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <CatatanFields
            jenis={jenis}
            setJenis={setJenis}
            tanggal={tanggal}
            setTanggal={setTanggal}
            isi={isi}
            setIsi={setIsi}
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCatatanButton({ jemaatId, noteId }: { jemaatId: string; noteId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/jemaat/${jemaatId}/catatan-pastoral/${noteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus catatan");
        return;
      }

      toast.success("Catatan dihapus");
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="sm" variant="ghost" />}>Hapus</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus catatan ini?</AlertDialogTitle>
          <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} disabled={isPending}>
            {isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CatatanPastoralSection({
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
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-right whitespace-nowrap">Tanggal</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Penulis</TableHead>
              <TableHead>Isi</TableHead>
              {!disabled && <TableHead></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="text-right whitespace-nowrap tabular-nums align-top">{n.tanggal}</TableCell>
                <TableCell className="align-top">
                  <Badge variant="secondary">{n.jenis}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap align-top">{n.penulis_nama ?? "-"}</TableCell>
                <TableCell className="whitespace-normal">{n.isi}</TableCell>
                {!disabled && (
                  <TableCell className="whitespace-nowrap text-right align-top">
                    <EditCatatanDialog jemaatId={jemaatId} note={n} />
                    <DeleteCatatanButton jemaatId={jemaatId} noteId={n.id} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {!disabled && (
        <div className="space-y-2 rounded-lg border p-3">
          <CatatanFields
            jenis={jenis}
            setJenis={setJenis}
            tanggal={tanggal}
            setTanggal={setTanggal}
            isi={isi}
            setIsi={setIsi}
            disabled={isPending}
          />
          <Button size="sm" onClick={onSubmit} disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan Catatan"}
          </Button>
        </div>
      )}
    </div>
  );
}

function JemaatRow({ jemaat, disabled }: { jemaat: JemaatProfile; disabled?: boolean }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
    <TableRow className="group/row">
      <TableCell className="whitespace-nowrap font-mono text-xs">{jemaat.nomor_anggota ?? "-"}</TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2.5">
          <InitialsAvatar name={jemaat.nama} />
          {jemaat.nama}
        </div>
      </TableCell>
      <TableCell>{jemaat.keluarga?.nama ?? "-"}</TableCell>
      <TableCell>{jemaat.wilayah?.nama ?? "-"}</TableCell>
      <TableCell>
        <StatusBadge status={jemaat.status_keanggotaan} />
      </TableCell>
      <TableCell className="whitespace-nowrap">{jemaat.no_hp ?? "-"}</TableCell>
      <TableCell className="text-right">
        <RowActionsMenu>
          <DropdownMenuItem render={<Link href={`/admin/jemaat/${jemaat.id}`} />}>
            {disabled ? "Lihat" : "Edit"}
          </DropdownMenuItem>
          {!disabled && (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              Hapus
            </DropdownMenuItem>
          )}
        </RowActionsMenu>
      </TableCell>
      {!disabled && (
        <ConfirmDeleteButton
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={onDelete}
          isPending={isPending}
          title={`Hapus ${jemaat.nama}?`}
        />
      )}
    </TableRow>
  );
}

export function AddJemaatDialog({
  allLabels,
  allWilayah,
  allKeluarga,
}: {
  allLabels: LabelJemaat[];
  allWilayah: Wilayah[];
  allKeluarga: Keluarga[];
}) {
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
          <ProfileFields
            values={values}
            set={set}
            allLabels={allLabels}
            allWilayah={allWilayah}
            allKeluarga={allKeluarga}
            disabled={isPending}
          />
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
  disabled,
  emptyAction,
}: {
  items: JemaatProfile[];
  disabled?: boolean;
  /** Rendered as the empty state's primary action - passed in from the page
   * since it already has the lists (labels/wilayah/keluarga) AddJemaatDialog
   * needs, and renders its own copy above the table anyway. */
  emptyAction?: React.ReactNode;
}) {
  return (
    <Table className="min-w-190">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>No. Anggota</TableHead>
          <SortableTableHead sortKey="nama">Nama</SortableTableHead>
          <TableHead>Keluarga</TableHead>
          <TableHead>Wilayah</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Kontak</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <JemaatRow key={item.id} jemaat={item} disabled={disabled} />
        ))}
        {items.length === 0 && (
          <TableEmptyState colSpan={7} action={emptyAction}>
            Belum ada jemaat.
          </TableEmptyState>
        )}
      </TableBody>
    </Table>
  );
}
