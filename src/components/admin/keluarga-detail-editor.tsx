"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HubunganKeluargaSelect } from "@/components/admin/hubungan-keluarga-select";
import { JemaatSelect } from "@/components/admin/jemaat-select";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JemaatProfile, JemaatWithLabels } from "@/types/warta";

/** Patches one jemaat's profile fields via the existing Data Jemaat endpoint
 * - membership itself is just `keluarga_nama` + `hubungan_keluarga` on the
 * jemaat row, so no dedicated membership endpoint is needed. */
async function patchJemaat(jemaatId: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/jemaat/${jemaatId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Gagal menyimpan");
  }
}

function MemberRow({ member, disabled }: { member: JemaatProfile; disabled?: boolean }) {
  const router = useRouter();
  const initialHubungan = member.hubungan_keluarga ?? "";
  const [hubungan, setHubungan] = useState(initialHubungan);
  const [isPending, startTransition] = useTransition();

  function onSaveHubungan() {
    startTransition(async () => {
      try {
        await patchJemaat(member.id, { hubungan_keluarga: hubungan.trim() || null });
        toast.success("Hubungan keluarga tersimpan");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
      }
    });
  }

  function onRemove() {
    startTransition(async () => {
      try {
        await patchJemaat(member.id, { keluarga_nama: "", hubungan_keluarga: null });
        toast.success(`${member.nama} dikeluarkan dari keluarga`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengeluarkan anggota");
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-mono text-xs">{member.nomor_anggota ?? "-"}</TableCell>
      <TableCell className="font-medium">{member.nama}</TableCell>
      <TableCell>{member.wilayah?.nama ?? "-"}</TableCell>
      <TableCell>
        <StatusBadge status={member.status_keanggotaan} />
      </TableCell>
      <TableCell className="whitespace-nowrap">{member.no_hp ?? "-"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <HubunganKeluargaSelect
              value={hubungan || null}
              onChange={setHubungan}
              disabled={disabled || isPending}
            />
          </div>
          {!disabled && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSaveHubungan}
              disabled={isPending || hubungan === initialHubungan}
            >
              Simpan
            </Button>
          )}
        </div>
      </TableCell>
      {!disabled && (
        <TableCell className="text-right">
          <Button size="sm" variant="ghost" onClick={onRemove} disabled={isPending}>
            Keluarkan
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

function AddMemberForm({
  keluargaNama,
  availableJemaat,
}: {
  keluargaNama: string;
  availableJemaat: JemaatWithLabels[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hubungan, setHubungan] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    if (!selectedId) {
      toast.error("Pilih jemaat yang akan ditambahkan");
      return;
    }

    startTransition(async () => {
      try {
        await patchJemaat(selectedId, {
          keluarga_nama: keluargaNama,
          hubungan_keluarga: hubungan.trim() || null,
        });
        toast.success("Anggota ditambahkan ke keluarga");
        setSelectedId(null);
        setHubungan("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menambah anggota");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
      <div className="w-64 space-y-2">
        <Label>Tambah Anggota</Label>
        <JemaatSelect
          value={selectedId}
          onChange={setSelectedId}
          jemaatList={availableJemaat}
          placeholder="Cari jemaat..."
          disabled={isPending}
        />
      </div>
      <div className="w-48 space-y-2">
        <Label>Hubungan Keluarga</Label>
        <HubunganKeluargaSelect value={hubungan || null} onChange={setHubungan} disabled={isPending} />
      </div>
      <Button onClick={onSubmit} disabled={isPending}>
        {isPending ? "Menambahkan..." : "Tambahkan"}
      </Button>
    </div>
  );
}

export function KeluargaDetailEditor({
  keluargaNama,
  members,
  availableJemaat,
  disabled,
}: {
  keluargaNama: string;
  members: JemaatProfile[];
  availableJemaat: JemaatWithLabels[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <Table className="min-w-190">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>No. Anggota</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Wilayah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Hubungan Keluarga</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&>tr:nth-child(even)]:bg-muted/40">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} disabled={disabled} />
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-muted-foreground">
                  Belum ada anggota di keluarga ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!disabled && <AddMemberForm keluargaNama={keluargaNama} availableJemaat={availableJemaat} />}
    </div>
  );
}
