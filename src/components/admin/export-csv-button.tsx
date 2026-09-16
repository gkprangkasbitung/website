"use client";

import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { STATUS_KEANGGOTAAN_LABEL, type JemaatProfile } from "@/types/warta";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsv(items: JemaatProfile[]): string {
  const header = ["No. Anggota", "Nama", "Keluarga", "Wilayah", "Status", "Kontak"];
  const rows = items.map((item) => [
    item.nomor_anggota ?? "",
    item.nama,
    item.keluarga?.nama ?? "",
    item.wilayah?.nama ?? "",
    item.status_keanggotaan
      ? (STATUS_KEANGGOTAAN_LABEL[item.status_keanggotaan as keyof typeof STATUS_KEANGGOTAAN_LABEL] ??
        item.status_keanggotaan)
      : "",
    item.no_hp ?? "",
  ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

/** Exports the jemaat list matching the current search/wilayah/status
 * filters (not just the current page) as a CSV file. */
export function ExportCsvButton() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onExport() {
    startTransition(async () => {
      const params = new URLSearchParams();
      for (const key of ["q", "wilayah", "status"]) {
        const value = searchParams.get(key);
        if (value) params.set(key, value);
      }

      const res = await fetch(`/api/admin/jemaat?${params.toString()}`);
      if (!res.ok) {
        toast.error("Gagal mengekspor data");
        return;
      }

      const { data } = await res.json();
      const csv = toCsv((data ?? []) as JemaatProfile[]);
      const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `data-jemaat-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={onExport} disabled={isPending}>
      {isPending ? "Mengekspor..." : "Ekspor CSV"}
    </Button>
  );
}
