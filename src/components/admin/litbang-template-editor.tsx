"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
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
import type { LitbangCategory } from "@/types/warta";

const DESKRIPSI_PLACEHOLDER =
  "Tulis deskripsi bebas, mis.\n• Katekisasi Dasar setiap Sabtu di Ruang Konsistori pkl. 17.00 WIB\n• Katekisasi Lanjutan setiap Jumat di Ruang Konsistori pkl. 17.00 WIB";

function LitbangCard({ row, disabled }: { row: LitbangCategory; disabled?: boolean }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [name, setName] = useState(row.name);
  const [deskripsi, setDeskripsi] = useState(row.deskripsi ?? "");
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/litbang-template/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, deskripsi }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan");
        return;
      }

      toast.success(`${name} tersimpan`);
      router.refresh();
    });
  }

  function onToggleActive(checked: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/litbang-template/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: checked }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal mengubah status");
        return;
      }

      toast.success(checked ? "Diaktifkan - akan ikut ke warta baru" : "Dinonaktifkan - dilewati saat warta baru dibuat");
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/litbang-template/${row.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus");
        return;
      }

      toast.success("Card dihapus");
      router.refresh();
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`space-y-3 rounded-lg border p-4 ${row.active ? "" : "bg-muted/30 opacity-70"}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-2 shrink-0 touch-none text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
          aria-label="Urutkan (drag)"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled || isPending}
          className="flex-1 font-medium"
        />
        <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
          <Checkbox
            checked={row.active}
            onCheckedChange={(checked) => onToggleActive(checked === true)}
            disabled={disabled || isPending}
          />
          Aktif
        </label>
      </div>
      <textarea
        value={deskripsi}
        onChange={(e) => setDeskripsi(e.target.value)}
        disabled={disabled || isPending}
        rows={4}
        placeholder={DESKRIPSI_PLACEHOLDER}
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {!disabled && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onSave} disabled={isPending}>
            Simpan
          </Button>
          <ConfirmDeleteButton onConfirm={onDelete} isPending={isPending} title={`Hapus "${row.name}"?`} />
        </div>
      )}
    </div>
  );
}

function AddLitbangDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const name = formData.get("name");
    const deskripsi = formData.get("deskripsi");

    if (typeof name !== "string" || !name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/litbang-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, deskripsi }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menambah card");
        return;
      }

      toast.success("Card ditambahkan");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Tambah Litbang</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Litbang</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <textarea
              id="deskripsi"
              name="deskripsi"
              rows={3}
              placeholder={DESKRIPSI_PLACEHOLDER}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LitbangTemplateEditor({ rows, disabled }: { rows: LitbangCategory[]; disabled?: boolean }) {
  const router = useRouter();
  const serverIds = rows.map((r) => r.id);
  const [order, setOrder] = useState(serverIds);
  // Keep local drag order in sync with the server data (a newly-added or
  // deleted card, or the confirmed order after a reorder) - adjusting
  // state during render rather than in an effect, per React's guidance.
  const [syncedIds, setSyncedIds] = useState(serverIds);
  const serverKey = serverIds.join(",");
  if (serverKey !== syncedIds.join(",")) {
    setSyncedIds(serverIds);
    setOrder(serverIds);
  }

  const rowById = new Map(rows.map((r) => [r.id, r]));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    const newOrder = arrayMove(order, oldIndex, newIndex);
    setOrder(newOrder);

    fetch("/api/admin/litbang-template/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newOrder }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        router.refresh();
      })
      .catch(() => {
        toast.error("Gagal menyimpan urutan");
        setOrder(rows.map((r) => r.id));
      });
  }

  const orderedRows = order.map((id) => rowById.get(id)).filter((r): r is LitbangCategory => Boolean(r));

  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex justify-end">
          <AddLitbangDialog />
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {orderedRows.map((row) => (
              <LitbangCard key={row.id} row={row} disabled={disabled} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {orderedRows.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada card Litbang.</p>
      )}
    </div>
  );
}
