"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface DeskripsiRow {
  id: string;
  name: string;
  deskripsi: string | null;
}

function DeskripsiRowEditor({
  row,
  patchUrl,
  disabled,
}: {
  row: DeskripsiRow;
  patchUrl: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(row.deskripsi ?? "");
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(patchUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deskripsi: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan");
        return;
      }

      toast.success(`${row.name} tersimpan`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 border-b pb-4 last:border-0">
      <h3 className="font-medium">{row.name}</h3>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled || isPending}
        rows={4}
        placeholder={"Tulis deskripsi bebas, mis.\n• Katekisasi Dasar setiap Sabtu di Ruang Konsistori pkl. 17.00 WIB\n• Katekisasi Lanjutan setiap Jumat di Ruang Konsistori pkl. 17.00 WIB"}
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {!disabled && (
        <Button size="sm" variant="outline" onClick={onSave} disabled={isPending}>
          {isPending ? "..." : "Simpan"}
        </Button>
      )}
    </div>
  );
}

export function LitbangEditor({
  rows,
  patchUrlBase,
  disabled,
}: {
  rows: DeskripsiRow[];
  /** Full row URL is built as `${patchUrlBase}/${row.id}`. */
  patchUrlBase: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <DeskripsiRowEditor key={row.id} row={row} patchUrl={`${patchUrlBase}/${row.id}`} disabled={disabled} />
      ))}
    </div>
  );
}
