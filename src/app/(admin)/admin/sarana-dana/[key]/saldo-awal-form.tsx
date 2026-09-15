"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SaldoAwalForm({ itemId, saldoAwal }: { itemId: string; saldoAwal: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(saldoAwal));
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/sarana-dana/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldo_awal: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan saldo awal");
        return;
      }

      toast.success("Saldo awal tersimpan");
      router.refresh();
    });
  }

  return (
    <div className="flex items-end gap-2">
      <div className="space-y-2">
        <Label htmlFor="saldo_awal">Saldo Awal</Label>
        <Input
          id="saldo_awal"
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isPending}
          className="w-40"
        />
      </div>
      <Button variant="outline" onClick={onSave} disabled={isPending}>
        {isPending ? "..." : "Simpan"}
      </Button>
    </div>
  );
}
