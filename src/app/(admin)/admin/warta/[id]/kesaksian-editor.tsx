"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WartaKesaksianItem } from "@/types/warta";

function KesaksianItemCard({
  wartaId,
  item,
  disabled,
}: {
  wartaId: string;
  item: WartaKesaksianItem;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [judul, setJudul] = useState(item.judul);
  const [deskripsi, setDeskripsi] = useState(item.deskripsi ?? "");
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/warta/${wartaId}/kesaksian/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, deskripsi }),
      });

      if (!res.ok) {
        toast.error("Gagal menyimpan");
        return;
      }

      toast.success("Tersimpan");
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/warta/${wartaId}/kesaksian/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Gagal menghapus");
        return;
      }

      toast.success("Item dihapus");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <Input
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Judul"
          disabled={disabled || isPending}
        />
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Deskripsi"
          rows={3}
          disabled={disabled || isPending}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {!disabled && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onSave} disabled={isPending}>
              Simpan
            </Button>
            <ConfirmDeleteButton
              onConfirm={onDelete}
              isPending={isPending}
              title={item.judul ? `Hapus "${item.judul}"?` : "Hapus item kesaksian ini?"}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KesaksianEditor({
  wartaId,
  items,
  disabled,
}: {
  wartaId: string;
  items: WartaKesaksianItem[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [isPending, startTransition] = useTransition();

  function onAdd() {
    if (!judul.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/warta/${wartaId}/kesaksian`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, deskripsi }),
      });

      if (!res.ok) {
        toast.error("Gagal menambah item");
        return;
      }

      setJudul("");
      setDeskripsi("");
      toast.success("Item ditambahkan");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <KesaksianItemCard key={item.id} wartaId={wartaId} item={item} disabled={disabled} />
      ))}

      {!disabled && (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <Label>Tambah Item Baru</Label>
            <Input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul"
              disabled={isPending}
            />
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Deskripsi"
              rows={3}
              disabled={isPending}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button size="sm" onClick={onAdd} disabled={isPending}>
              {isPending ? "..." : "Tambah"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
