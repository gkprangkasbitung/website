"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { flexRender, type ColumnFiltersState, type PaginationState, type SortingState } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { RotateCcw } from "lucide-react";
import { cn } from "cn";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { FacetedFilter, SearchHeader, SortHeader } from "@/components/admin/data-table-controls";
import { JemaatSelect } from "@/components/admin/jemaat-select";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { TableEmptyState } from "@/components/admin/table-empty-state";
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
import { formatTanggalPanjang, nextSundayIso } from "@/lib/date";
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
  SMKA_KELOMPOK_OPTIONS,
  type JemaatWithLabels,
  type PeribadahanCategory,
  type PeribadahanItemWithRelations,
  type SmkaKelompokKey,
  type Tempat,
  type Wilayah,
} from "@/types/warta";

type Kehadiran = "laki_laki" | "perempuan" | "anak";

const KEHADIRAN_LABEL: Record<Kehadiran, string> = {
  laki_laki: "Laki-laki",
  perempuan: "Perempuan",
  anak: "Anak-anak",
};

interface FieldConfig {
  tempat: boolean;
  wilayah: boolean;
  tema: boolean;
  dpa: boolean;
  pelayanFirman: boolean;
  liturgos: boolean;
  catatanLabel: string | null;
  kehadiran: Kehadiran[];
}

/** Every category except Kebaktian SMKA (handled separately below) shares
 * this shape - only which fields are shown/used differs. */
const FIELD_CONFIG: Record<string, FieldConfig> = {
  umum: {
    tempat: true,
    wilayah: false,
    tema: false,
    dpa: false,
    pelayanFirman: true,
    liturgos: true,
    catatanLabel: "Keterangan",
    kehadiran: ["laki_laki", "perempuan", "anak"],
  },
  krt: {
    tempat: true,
    wilayah: true,
    tema: true,
    dpa: true,
    pelayanFirman: true,
    liturgos: true,
    catatanLabel: "Catatan",
    kehadiran: ["laki_laki", "perempuan", "anak"],
  },
  pa: {
    tempat: true,
    wilayah: false,
    tema: true,
    dpa: true,
    pelayanFirman: true,
    liturgos: true,
    catatanLabel: "Catatan",
    kehadiran: ["laki_laki", "perempuan", "anak"],
  },
  lansia: {
    tempat: true,
    wilayah: false,
    tema: true,
    dpa: true,
    pelayanFirman: true,
    liturgos: true,
    catatanLabel: "Catatan",
    kehadiran: ["laki_laki", "perempuan"],
  },
  perempuan: {
    tempat: true,
    wilayah: false,
    tema: true,
    dpa: true,
    pelayanFirman: true,
    liturgos: true,
    catatanLabel: "Catatan",
    kehadiran: ["perempuan"],
  },
  pria: {
    tempat: true,
    wilayah: false,
    tema: true,
    dpa: true,
    pelayanFirman: true,
    liturgos: true,
    catatanLabel: "Catatan",
    kehadiran: ["laki_laki"],
  },
  doa_pagi: {
    tempat: true,
    wilayah: false,
    tema: false,
    dpa: false,
    pelayanFirman: false,
    liturgos: false,
    catatanLabel: "Catatan",
    kehadiran: ["laki_laki", "perempuan", "anak"],
  },
  pemuda_remaja: {
    tempat: true,
    wilayah: false,
    tema: true,
    dpa: true,
    pelayanFirman: true,
    liturgos: true,
    catatanLabel: "Catatan",
    kehadiran: ["laki_laki", "perempuan"],
  },
};

const FALLBACK_FIELD_CONFIG = FIELD_CONFIG.umum;

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
  const items = Object.fromEntries(tempatList.map((t) => [t.id, t.nama]));

  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)} items={items} disabled={disabled}>
      <SelectTrigger className="w-full">
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

function WilayahSelect({
  value,
  onChange,
  wilayahList,
  disabled,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  wilayahList: Wilayah[];
  disabled?: boolean;
}) {
  const items = Object.fromEntries(wilayahList.map((w) => [w.id, w.nama]));

  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)} items={items} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Wilayah" />
      </SelectTrigger>
      <SelectContent>
        {wilayahList.map((w) => (
          <SelectItem key={w.id} value={w.id}>
            {w.nama}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <Input
      type="number"
      min={0}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      disabled={disabled}
    />
  );
}

/** Shared shape used by every category except Kebaktian SMKA. */
function ItemCard({
  item,
  config,
  bare,
  tempatList,
  wilayahList,
  jemaatList,
  disabled,
}: {
  item: PeribadahanItemWithRelations;
  config: FieldConfig;
  /** Skip the outer border/padding - used when already inside a Dialog. */
  bare?: boolean;
  tempatList: Tempat[];
  wilayahList: Wilayah[];
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    jam: item.jam ?? "",
    tempat_id: item.tempat_id,
    wilayah_id: item.wilayah_id,
    tema: item.tema ?? "",
    dpa: item.dpa ?? "",
    pelayan_firman_id: item.pelayan_firman_id,
    liturgos_id: item.liturgos_id,
    catatan: item.catatan ?? "",
    kehadiran_laki_laki: item.kehadiran_laki_laki,
    kehadiran_perempuan: item.kehadiran_perempuan,
    kehadiran_anak: item.kehadiran_anak,
  });
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

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

  return (
    <div className={bare ? "space-y-3" : "space-y-3 rounded-lg border p-4"}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Waktu">
          <Input
            type="time"
            value={values.jam}
            onChange={(e) => set("jam", e.target.value)}
            disabled={disabled || isPending}
          />
        </Field>
        {config.tempat && (
          <Field label="Tempat">
            <TempatSelect
              value={values.tempat_id}
              onChange={(v) => set("tempat_id", v)}
              tempatList={tempatList}
              disabled={disabled || isPending}
            />
          </Field>
        )}
        {config.wilayah && (
          <Field label="Wilayah">
            <WilayahSelect
              value={values.wilayah_id}
              onChange={(v) => set("wilayah_id", v)}
              wilayahList={wilayahList}
              disabled={disabled || isPending}
            />
          </Field>
        )}
        {config.dpa && (
          <Field label="Dasar Pemahaman Alkitab (DPA)">
            <Input
              value={values.dpa}
              onChange={(e) => set("dpa", e.target.value)}
              disabled={disabled || isPending}
            />
          </Field>
        )}
        {config.tema && (
          <Field label="Tema">
            <Input
              value={values.tema}
              onChange={(e) => set("tema", e.target.value)}
              disabled={disabled || isPending}
            />
          </Field>
        )}
        {config.pelayanFirman && (
          <Field label="Pelayan Firman">
            <JemaatSelect
              value={values.pelayan_firman_id}
              onChange={(v) => set("pelayan_firman_id", v)}
              jemaatList={jemaatList}
              placeholder="Pelayan Firman"
              disabled={disabled || isPending}
            />
          </Field>
        )}
        {config.liturgos && (
          <Field label="Liturgos">
            <JemaatSelect
              value={values.liturgos_id}
              onChange={(v) => set("liturgos_id", v)}
              jemaatList={jemaatList}
              placeholder="Liturgos"
              disabled={disabled || isPending}
            />
          </Field>
        )}
        {config.kehadiran.map((k) => (
          <Field key={k} label={`Jumlah Kehadiran (${KEHADIRAN_LABEL[k]})`}>
            <NumberInput
              value={values[`kehadiran_${k}` as const]}
              onChange={(v) => set(`kehadiran_${k}` as const, v)}
              disabled={disabled || isPending}
            />
          </Field>
        ))}
      </div>
      {config.catatanLabel && (
        <Field label={config.catatanLabel}>
          <textarea
            value={values.catatan}
            onChange={(e) => set("catatan", e.target.value)}
            disabled={disabled || isPending}
            rows={2}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </Field>
      )}
      {!disabled && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onSave} disabled={isPending}>
            Simpan
          </Button>
        </div>
      )}
    </div>
  );
}

/** Kebaktian SMKA: per-class PF plus attendance broken down into 8 fixed
 * groups. Structurally different enough from the other categories that it
 * gets its own card instead of trying to fit FieldConfig. */
function SmkaItemCard({
  item,
  bare,
  jemaatList,
  disabled,
}: {
  item: PeribadahanItemWithRelations;
  /** Skip the outer border/padding - used when already inside a Dialog. */
  bare?: boolean;
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    jam: item.jam ?? "",
    tema: item.tema ?? "",
    liturgos_id: item.liturgos_id,
    pemusik_id: item.pemusik_id,
    bahan_alkitab: item.bahan_alkitab ?? "",
  });
  const existingKelompok = new Map((item.smka_kelompok ?? []).map((k) => [k.kelompok, k]));
  const [kelompok, setKelompok] = useState<
    Record<SmkaKelompokKey, { pf_id: string | null; laki_laki: number | null; perempuan: number | null }>
  >(() => {
    const initial = {} as Record<
      SmkaKelompokKey,
      { pf_id: string | null; laki_laki: number | null; perempuan: number | null }
    >;
    for (const opt of SMKA_KELOMPOK_OPTIONS) {
      const existing = existingKelompok.get(opt.value);
      initial[opt.value] = {
        pf_id: existing?.pf_id ?? null,
        laki_laki: existing?.laki_laki ?? null,
        perempuan: existing?.perempuan ?? null,
      };
    }
    return initial;
  });
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function setKelompokField(
    key: SmkaKelompokKey,
    field: "pf_id" | "laki_laki" | "perempuan",
    value: string | number | null,
  ) {
    setKelompok((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/peribadahan/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          smka_kelompok: SMKA_KELOMPOK_OPTIONS.map((opt) => ({
            kelompok: opt.value,
            ...kelompok[opt.value],
          })),
        }),
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

  return (
    <div className={bare ? "space-y-3" : "space-y-3 rounded-lg border p-4"}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Waktu">
          <Input
            type="time"
            value={values.jam}
            onChange={(e) => set("jam", e.target.value)}
            disabled={disabled || isPending}
          />
        </Field>
        <Field label="Tema">
          <Input
            value={values.tema}
            onChange={(e) => set("tema", e.target.value)}
            disabled={disabled || isPending}
          />
        </Field>
        <Field label="Pelayan Liturgi">
          <JemaatSelect
            value={values.liturgos_id}
            onChange={(v) => set("liturgos_id", v)}
            jemaatList={jemaatList}
            placeholder="Pelayan Liturgi"
            disabled={disabled || isPending}
          />
        </Field>
        <Field label="Pemusik">
          <JemaatSelect
            value={values.pemusik_id}
            onChange={(v) => set("pemusik_id", v)}
            jemaatList={jemaatList}
            placeholder="Pemusik"
            disabled={disabled || isPending}
          />
        </Field>
        <Field label="Bahan Alkitab">
          <Input
            value={values.bahan_alkitab}
            onChange={(e) => set("bahan_alkitab", e.target.value)}
            disabled={disabled || isPending}
          />
        </Field>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          PF &amp; Jumlah Kehadiran per Kelompok
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1.5 pr-2">Kelompok</th>
                <th className="py-1.5 pr-2">PF</th>
                <th className="py-1.5 pr-2">L</th>
                <th className="py-1.5">P</th>
              </tr>
            </thead>
            <tbody>
              {SMKA_KELOMPOK_OPTIONS.map((opt) => (
                <tr key={opt.value} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 whitespace-nowrap">{opt.label}</td>
                  <td className="w-48 py-1.5 pr-2">
                    {opt.hasPf ? (
                      <JemaatSelect
                        value={kelompok[opt.value].pf_id}
                        onChange={(v) => setKelompokField(opt.value, "pf_id", v)}
                        jemaatList={jemaatList}
                        placeholder="PF"
                        disabled={disabled || isPending}
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="w-20 py-1.5 pr-2">
                    <NumberInput
                      value={kelompok[opt.value].laki_laki}
                      onChange={(v) => setKelompokField(opt.value, "laki_laki", v)}
                      disabled={disabled || isPending}
                    />
                  </td>
                  <td className="w-20 py-1.5">
                    <NumberInput
                      value={kelompok[opt.value].perempuan}
                      onChange={(v) => setKelompokField(opt.value, "perempuan", v)}
                      disabled={disabled || isPending}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onSave} disabled={isPending}>
            Simpan
          </Button>
        </div>
      )}
    </div>
  );
}

function AddItemDialog({
  tanggal,
  categories,
  lockedCategoryId,
}: {
  /** Fixed date (warta context - no date picker shown). When omitted, this
   * dialog shows its own date input, defaulting to the next Sunday. */
  tanggal?: string;
  categories: PeribadahanCategory[];
  lockedCategoryId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(
    lockedCategoryId ?? categories[0]?.id ?? null,
  );
  const [ownTanggal, setOwnTanggal] = useState(() => tanggal ?? nextSundayIso());
  const [jam, setJam] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    if (!categoryId) {
      toast.error("Pilih jenis peribadahan dulu");
      return;
    }
    const effectiveTanggal = tanggal ?? ownTanggal;
    if (!effectiveTanggal) {
      toast.error("Pilih tanggal dulu");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/peribadahan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, tanggal: effectiveTanggal, jam: jam || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menambah baris");
        return;
      }

      toast.success("Baris ditambahkan - lengkapi detailnya lewat tombol Detail");
      setOpen(false);
      setJam("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Tambah Jadwal</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Jadwal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!tanggal && (
            <div className="space-y-2">
              <Label htmlFor="add-tanggal">Tanggal</Label>
              <Input
                id="add-tanggal"
                type="date"
                value={ownTanggal}
                onChange={(e) => setOwnTanggal(e.target.value)}
                disabled={isPending}
              />
            </div>
          )}
          {!lockedCategoryId && (
            <div className="space-y-2">
              <Label>Jenis</Label>
              <Select
                value={categoryId ?? undefined}
                onValueChange={setCategoryId}
                items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
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
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="add-jam">Waktu</Label>
            <Input
              id="add-jam"
              type="time"
              value={jam}
              onChange={(e) => setJam(e.target.value)}
              disabled={isPending}
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

/** Short summary of whichever of Tempat/Wilayah/Tema/DPA this item has, for
 * the compact table's Ringkasan column - used only on the all-categories
 * overview page, where rows span different categories with different
 * fields. */
function summarize(item: PeribadahanItemWithRelations): string {
  const parts = [item.tempat?.nama, item.wilayah?.nama, item.tema, item.dpa].filter(
    (v): v is string => Boolean(v),
  );
  return parts.length > 0 ? parts.join(" · ") : "-";
}

interface CategoryColumn {
  label: string;
  render: (item: PeribadahanItemWithRelations) => React.ReactNode;
}

/** Explicit columns for a single category's table (used when the editor is
 * locked to one category, so every row shares the same fields) - order
 * follows what's actually filled in for that category. */
function getCategoryColumns(key: string | undefined, config: FieldConfig): CategoryColumn[] {
  if (key === "smka") {
    return [
      { label: "Tema", render: (item) => item.tema ?? "-" },
      { label: "Liturgos", render: (item) => item.liturgos?.nama ?? "-" },
      { label: "Pemusik", render: (item) => item.pemusik?.nama ?? "-" },
      { label: "Bahan Alkitab", render: (item) => item.bahan_alkitab ?? "-" },
    ];
  }

  const columns: CategoryColumn[] = [];
  if (config.tempat) columns.push({ label: "Tempat", render: (item) => item.tempat?.nama ?? "-" });
  if (config.wilayah) columns.push({ label: "Wilayah", render: (item) => item.wilayah?.nama ?? "-" });
  if (config.dpa) columns.push({ label: "DPA", render: (item) => item.dpa ?? "-" });
  if (config.tema) columns.push({ label: "Tema", render: (item) => item.tema ?? "-" });
  if (config.pelayanFirman) {
    columns.push({ label: "Pelayan Firman", render: (item) => item.pelayan_firman?.nama ?? "-" });
  }
  if (config.liturgos) columns.push({ label: "Liturgos", render: (item) => item.liturgos?.nama ?? "-" });
  return columns;
}

function DeletePeribadahanRowButton({
  itemId,
  title,
  open,
  onOpenChange,
}: {
  itemId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/peribadahan/${itemId}`, { method: "DELETE" });

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
    <ConfirmDeleteButton
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onDelete}
      isPending={isPending}
      title={`Hapus "${title}"?`}
    />
  );
}

function ItemRow({
  item,
  showCategory,
  categoryColumns,
  tempatList,
  wilayahList,
  jemaatList,
  disabled,
}: {
  item: PeribadahanItemWithRelations;
  showCategory: boolean;
  /** Set when the editor is locked to one category - replaces the generic
   * Ringkasan column with explicit per-field columns. */
  categoryColumns: CategoryColumn[] | null;
  tempatList: Tempat[];
  wilayahList: Wilayah[];
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const key = item.category?.key;
  const isSmka = key === "smka";
  const config = (key && FIELD_CONFIG[key]) || FALLBACK_FIELD_CONFIG;
  const dialogTitle = [item.category?.name, formatTanggalPanjang(item.tanggal)]
    .filter(Boolean)
    .join(" · ");

  return (
    <TableRow className="group/row">
      <TableCell className="text-right whitespace-nowrap tabular-nums">{formatTanggalPanjang(item.tanggal)}</TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">{item.jam ?? "-"}</TableCell>
      {showCategory && <TableCell>{item.category?.name ?? "-"}</TableCell>}
      {categoryColumns ? (
        categoryColumns.map((col) => (
          <TableCell key={col.label} className="max-w-48 truncate">
            {col.render(item)}
          </TableCell>
        ))
      ) : (
        <TableCell className="max-w-64 truncate">{summarize(item)}</TableCell>
      )}
      <TableCell className="text-right">
        <RowActionsMenu>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>{disabled ? "Lihat" : "Edit"}</DropdownMenuItem>
          {!disabled && (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              Hapus
            </DropdownMenuItem>
          )}
        </RowActionsMenu>
      </TableCell>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          {isSmka ? (
            <SmkaItemCard item={item} bare jemaatList={jemaatList} disabled={disabled} />
          ) : (
            <ItemCard
              item={item}
              config={config}
              bare
              tempatList={tempatList}
              wilayahList={wilayahList}
              jemaatList={jemaatList}
              disabled={disabled}
            />
          )}
        </DialogContent>
      </Dialog>
      {!disabled && (
        <DeletePeribadahanRowButton
          itemId={item.id}
          title={dialogTitle}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
        />
      )}
    </TableRow>
  );
}

/** The actions cell for the sortable/standalone-pages table - same Edit/Hapus
 * behavior as ItemRow above, just wired in as a TanStack cell renderer
 * instead of a hand-written <TableCell>. */
function ActionsCell({
  item,
  tempatList,
  wilayahList,
  jemaatList,
  disabled,
}: {
  item: PeribadahanItemWithRelations;
  tempatList: Tempat[];
  wilayahList: Wilayah[];
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const key = item.category?.key;
  const isSmka = key === "smka";
  const config = (key && FIELD_CONFIG[key]) || FALLBACK_FIELD_CONFIG;
  const dialogTitle = [item.category?.name, formatTanggalPanjang(item.tanggal)].filter(Boolean).join(" · ");

  return (
    <>
      <RowActionsMenu>
        <DropdownMenuItem onClick={() => setEditOpen(true)}>{disabled ? "Lihat" : "Edit"}</DropdownMenuItem>
        {!disabled && (
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            Hapus
          </DropdownMenuItem>
        )}
      </RowActionsMenu>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          {isSmka ? (
            <SmkaItemCard item={item} bare jemaatList={jemaatList} disabled={disabled} />
          ) : (
            <ItemCard
              item={item}
              config={config}
              bare
              tempatList={tempatList}
              wilayahList={wilayahList}
              jemaatList={jemaatList}
              disabled={disabled}
            />
          )}
        </DialogContent>
      </Dialog>
      {!disabled && (
        <DeletePeribadahanRowButton
          itemId={item.id}
          title={dialogTitle}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
        />
      )}
    </>
  );
}

/** Columns whose values read as a date/time or are the actions trigger -
 * right-aligned, matching CLAUDE.md's numeric/date alignment rule. */
const ALIGN_RIGHT_COLUMNS = new Set(["tanggal", "jam", "actions"]);

/** Builds the sortable table's column set from the same FIELD_CONFIG the
 * plain (non-sortable) path already uses via getCategoryColumns - just
 * re-expressed as typed TanStack columns instead of {label, render} pairs.
 * Tempat/Wilayah get a toolbar facet whenever that field applies; every
 * other text field gets a per-column search popover; only Tanggal/Waktu are
 * sortable (matching the plain path's historical SORT_COLUMNS). In overview
 * mode (no locked category), Tempat/Wilayah are still defined as
 * filter-only columns - `hiddenColumnIds` - so the toolbar facets work
 * across every category even though the visible column there is the single
 * combined "Ringkasan" summary. */
function buildSortableColumns({
  showCategory,
  categoryKey,
  config,
  tempatList,
  wilayahList,
  jemaatList,
  disabled,
}: {
  showCategory: boolean;
  categoryKey: string | undefined;
  config: FieldConfig;
  tempatList: Tempat[];
  wilayahList: Wilayah[];
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}): { columns: LegacyColumnDef<PeribadahanItemWithRelations>[]; hiddenColumnIds: string[] } {
  const columns: LegacyColumnDef<PeribadahanItemWithRelations>[] = [
    {
      id: "tanggal",
      accessorFn: (item) => item.tanggal,
      header: ({ column }) => <SortHeader column={column} label="Tanggal" align="right" />,
      cell: ({ getValue }) => formatTanggalPanjang(getValue() as string),
    },
    {
      id: "jam",
      accessorFn: (item) => item.jam ?? "-",
      header: ({ column }) => <SortHeader column={column} label="Waktu" align="right" />,
    },
  ];

  const hiddenColumnIds: string[] = [];

  if (showCategory) {
    columns.push({
      id: "jenis",
      accessorFn: (item) => item.category?.name ?? "-",
      header: ({ column }) => <SearchHeader column={column} label="Jenis" />,
      filterFn: "includesString",
    });
    columns.push({
      id: "tempat",
      accessorFn: (item) => item.tempat?.nama ?? "",
      filterFn: "arrHas",
    });
    columns.push({
      id: "wilayah",
      accessorFn: (item) => item.wilayah?.nama ?? "",
      filterFn: "arrHas",
    });
    hiddenColumnIds.push("tempat", "wilayah");
    columns.push({
      id: "ringkasan",
      accessorFn: (item) => summarize(item),
      header: ({ column }) => <SearchHeader column={column} label="Ringkasan" />,
      filterFn: "includesString",
    });
  } else if (categoryKey === "smka") {
    columns.push(
      {
        id: "tema",
        accessorFn: (item) => item.tema ?? "-",
        header: ({ column }) => <SearchHeader column={column} label="Tema" />,
        filterFn: "includesString",
      },
      {
        id: "liturgos",
        accessorFn: (item) => item.liturgos?.nama ?? "-",
        header: ({ column }) => <SearchHeader column={column} label="Liturgos" />,
        filterFn: "includesString",
      },
      {
        id: "pemusik",
        accessorFn: (item) => item.pemusik?.nama ?? "-",
        header: ({ column }) => <SearchHeader column={column} label="Pemusik" />,
        filterFn: "includesString",
      },
      {
        id: "bahanAlkitab",
        accessorFn: (item) => item.bahan_alkitab ?? "-",
        header: ({ column }) => <SearchHeader column={column} label="Bahan Alkitab" />,
        filterFn: "includesString",
      },
    );
  } else {
    if (config.tempat) {
      columns.push({
        id: "tempat",
        accessorFn: (item) => item.tempat?.nama ?? "-",
        header: "Tempat",
        filterFn: "arrHas",
      });
    }
    if (config.wilayah) {
      columns.push({
        id: "wilayah",
        accessorFn: (item) => item.wilayah?.nama ?? "-",
        header: "Wilayah",
        filterFn: "arrHas",
      });
    }
    if (config.dpa) {
      columns.push({
        id: "dpa",
        accessorFn: (item) => item.dpa ?? "-",
        header: ({ column }) => <SearchHeader column={column} label="DPA" />,
        filterFn: "includesString",
      });
    }
    if (config.tema) {
      columns.push({
        id: "tema",
        accessorFn: (item) => item.tema ?? "-",
        header: ({ column }) => <SearchHeader column={column} label="Tema" />,
        filterFn: "includesString",
      });
    }
    if (config.pelayanFirman) {
      columns.push({
        id: "pelayanFirman",
        accessorFn: (item) => item.pelayan_firman?.nama ?? "-",
        header: ({ column }) => <SearchHeader column={column} label="Pelayan Firman" />,
        filterFn: "includesString",
      });
    }
    if (config.liturgos) {
      columns.push({
        id: "liturgos",
        accessorFn: (item) => item.liturgos?.nama ?? "-",
        header: ({ column }) => <SearchHeader column={column} label="Liturgos" />,
        filterFn: "includesString",
      });
    }
  }

  columns.push({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <ActionsCell
        item={row.original}
        tempatList={tempatList}
        wilayahList={wilayahList}
        jemaatList={jemaatList}
        disabled={disabled}
      />
    ),
  });

  return { columns, hiddenColumnIds };
}

/** The sortable, filterable table used by the standalone Peribadahan pages
 * (spans many dates - sorting/faceting is meaningful there). Fetches all
 * matching rows server-side (see peribadahan/page.tsx) and does sort,
 * filter, and pagination entirely client-side via TanStack, so the
 * Wilayah/Tempat facets and per-column search see the whole result set. */
function SortablePeribadahanTable({
  items,
  categories,
  lockedCategoryId,
  tempatList,
  wilayahList,
  jemaatList,
  disabled,
}: {
  items: PeribadahanItemWithRelations[];
  categories: PeribadahanCategory[];
  lockedCategoryId?: string;
  tempatList: Tempat[];
  wilayahList: Wilayah[];
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}) {
  const showCategory = !lockedCategoryId;
  const lockedCategory = lockedCategoryId ? categories.find((c) => c.id === lockedCategoryId) : undefined;
  const lockedConfig = (lockedCategory?.key && FIELD_CONFIG[lockedCategory.key]) || FALLBACK_FIELD_CONFIG;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const { columns, hiddenColumnIds } = useMemo(
    () =>
      buildSortableColumns({
        showCategory,
        categoryKey: lockedCategory?.key,
        config: lockedConfig,
        tempatList,
        wilayahList,
        jemaatList,
        disabled,
      }),
    [showCategory, lockedCategory?.key, lockedConfig, tempatList, wilayahList, jemaatList, disabled],
  );
  const renderColumns = useMemo(() => columns.filter((c) => !hiddenColumnIds.includes(c.id!)), [columns, hiddenColumnIds]);

  const table = useLegacyTable({
    data: items,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const hasFilters = columnFilters.length > 0;
  const rows = table.getRowModel().rows;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const tempatColumn = table.getColumn("tempat");
  const wilayahColumn = table.getColumn("wilayah");

  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <AddItemDialog categories={categories} lockedCategoryId={lockedCategoryId} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {wilayahColumn && <FacetedFilter column={wilayahColumn} title="Wilayah" />}
        {tempatColumn && <FacetedFilter column={tempatColumn} title="Tempat" />}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => table.resetColumnFilters()}
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {table
              .getFlatHeaders()
              .filter((header) => !hiddenColumnIds.includes(header.column.id))
              .map((header) => (
                <TableHead key={header.id} className={cn(ALIGN_RIGHT_COLUMNS.has(header.column.id) && "text-right")}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="group/row">
              {row
                .getVisibleCells()
                .filter((cell) => !hiddenColumnIds.includes(cell.column.id))
                .map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      ALIGN_RIGHT_COLUMNS.has(cell.column.id) && "text-right",
                      cell.column.id === "tanggal" || cell.column.id === "jam" ? "tabular-nums" : undefined,
                      cell.column.id !== "actions" && "max-w-64 truncate",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableEmptyState
              colSpan={renderColumns.length}
              action={
                hasFilters ? (
                  <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
                    Reset filter
                  </Button>
                ) : (
                  !disabled && <AddItemDialog categories={categories} lockedCategoryId={lockedCategoryId} />
                )
              }
            >
              {hasFilters ? "Tidak ada jadwal yang cocok dengan filter ini." : "Belum ada jadwal."}
            </TableEmptyState>
          )}
        </TableBody>
      </Table>

      <PaginationBar
        page={pagination.pageIndex + 1}
        pageSize={pagination.pageSize}
        totalItems={totalFiltered}
        entryLabel="jadwal"
        onPageChange={(page) => setPagination((p) => ({ ...p, pageIndex: page - 1 }))}
        onPageSizeChange={(pageSize) => setPagination((p) => ({ ...p, pageSize, pageIndex: 0 }))}
      />
    </div>
  );
}

export function PeribadahanEditor({
  tanggal,
  items,
  categories,
  lockedCategoryId,
  tempatList,
  wilayahList,
  jemaatList,
  disabled,
}: {
  /** Fixed to one date (used inside a warta, which only ever concerns its
   * own tanggal_kebaktian). When omitted, `items` may span many dates - this
   * is what the standalone Peribadahan pages use so every schedule is
   * visible in one table without searching/selecting a date first. */
  tanggal?: string;
  items: PeribadahanItemWithRelations[];
  categories: PeribadahanCategory[];
  /** When set, this editor is scoped to one category: the Jenis picker is
   * hidden and every new row is created under this category. */
  lockedCategoryId?: string;
  tempatList: Tempat[];
  wilayahList: Wilayah[];
  jemaatList: JemaatWithLabels[];
  disabled?: boolean;
}) {
  /** Sorting/filtering is only meaningful across many dates - inside a
   * warta (fixed tanggal) every row already shares the same date, so that
   * embedded view keeps its plain, non-interactive table. */
  if (!tanggal) {
    return (
      <SortablePeribadahanTable
        items={items}
        categories={categories}
        lockedCategoryId={lockedCategoryId}
        tempatList={tempatList}
        wilayahList={wilayahList}
        jemaatList={jemaatList}
        disabled={disabled}
      />
    );
  }

  const showCategory = !lockedCategoryId;
  const lockedCategory = lockedCategoryId ? categories.find((c) => c.id === lockedCategoryId) : undefined;
  const lockedConfig = (lockedCategory?.key && FIELD_CONFIG[lockedCategory.key]) || FALLBACK_FIELD_CONFIG;
  const categoryColumns = showCategory ? null : getCategoryColumns(lockedCategory?.key, lockedConfig);
  const columnCount = 2 + (showCategory ? 1 : 0) + (categoryColumns?.length ?? 1) + 1;

  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <AddItemDialog tanggal={tanggal} categories={categories} lockedCategoryId={lockedCategoryId} />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Tanggal</TableHead>
            <TableHead className="text-right">Waktu</TableHead>
            {showCategory && <TableHead>Jenis</TableHead>}
            {categoryColumns ? (
              categoryColumns.map((col) => <TableHead key={col.label}>{col.label}</TableHead>)
            ) : (
              <TableHead>Ringkasan</TableHead>
            )}
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              showCategory={showCategory}
              categoryColumns={categoryColumns}
              tempatList={tempatList}
              wilayahList={wilayahList}
              jemaatList={jemaatList}
              disabled={disabled}
            />
          ))}
          {items.length === 0 && (
            <TableEmptyState
              colSpan={columnCount}
              action={
                !disabled && (
                  <AddItemDialog tanggal={tanggal} categories={categories} lockedCategoryId={lockedCategoryId} />
                )
              }
            >
              Belum ada jadwal.
            </TableEmptyState>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
