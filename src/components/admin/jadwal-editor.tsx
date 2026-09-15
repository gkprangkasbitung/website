"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface JadwalRow {
  id: string;
  name: string;
  hari: string | null;
  jam: string | null;
  tempat: string | null;
  petugas: string | null;
}

function JadwalRowEditor({
  row,
  patchUrl,
  disabled,
}: {
  row: JadwalRow;
  patchUrl: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    hari: row.hari ?? "",
    jam: row.jam ?? "",
    tempat: row.tempat ?? "",
    petugas: row.petugas ?? "",
  });
  const [isPending, startTransition] = useTransition();

  function set(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function onSave() {
    startTransition(async () => {
      const res = await fetch(patchUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
    <TableRow>
      <TableCell className="font-medium">{row.name}</TableCell>
      <TableCell>
        <Input
          value={values.hari}
          onChange={(e) => set("hari", e.target.value)}
          disabled={disabled || isPending}
          placeholder="Hari"
        />
      </TableCell>
      <TableCell>
        <Input
          value={values.jam}
          onChange={(e) => set("jam", e.target.value)}
          disabled={disabled || isPending}
          placeholder="Jam"
        />
      </TableCell>
      <TableCell>
        <Input
          value={values.tempat}
          onChange={(e) => set("tempat", e.target.value)}
          disabled={disabled || isPending}
          placeholder="Tempat"
        />
      </TableCell>
      <TableCell>
        <Input
          value={values.petugas}
          onChange={(e) => set("petugas", e.target.value)}
          disabled={disabled || isPending}
          placeholder="Petugas"
        />
      </TableCell>
      <TableCell>
        {!disabled && (
          <Button size="sm" variant="outline" onClick={onSave} disabled={isPending}>
            {isPending ? "..." : "Simpan"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function JadwalEditor({
  rows,
  patchUrlBase,
  disabled,
}: {
  rows: JadwalRow[];
  /** Full row URL is built as `${patchUrlBase}/${row.id}` - kept as a plain
   * string (not a function) since Server Components can't pass functions to
   * Client Components. */
  patchUrlBase: string;
  disabled?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Hari</TableHead>
          <TableHead>Jam</TableHead>
          <TableHead>Tempat</TableHead>
          <TableHead>Petugas</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <JadwalRowEditor
            key={row.id}
            row={row}
            patchUrl={`${patchUrlBase}/${row.id}`}
            disabled={disabled}
          />
        ))}
      </TableBody>
    </Table>
  );
}
