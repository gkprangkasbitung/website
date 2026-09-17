"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CatatanPastoralSection,
  KeluargaAnggotaList,
  ProfileFields,
  toPayload,
  valuesFromJemaat,
  type ProfileFormValues,
} from "@/components/admin/jemaat-editor";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { StatusBadge } from "@/components/admin/status-badge";
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
import { Separator } from "@/components/ui/separator";
import type {
  JemaatCatatanPastoral,
  JemaatProfile,
  Keluarga,
  KeluargaMember,
  LabelJemaat,
  Wilayah,
} from "@/types/warta";

function DeleteJemaatButton({ jemaatId, jemaatNama }: { jemaatId: string; jemaatNama: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/jemaat/${jemaatId}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menghapus");
        return;
      }

      toast.success("Jemaat dihapus");
      router.push("/admin/jemaat");
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" />}>Hapus</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {jemaatNama}?</AlertDialogTitle>
          <AlertDialogDescription>
            Catatan pastoral milik jemaat ini akan ikut terhapus. Tindakan ini tidak bisa
            dibatalkan.
          </AlertDialogDescription>
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

export function JemaatDetailEditor({
  jemaat,
  allLabels,
  allWilayah,
  allKeluarga,
  familyMembers,
  pastoralNotes,
  pastoralNotesPage,
  pastoralNotesPageSize,
  totalPastoralNotes,
  disabled,
}: {
  jemaat: JemaatProfile;
  allLabels: LabelJemaat[];
  allWilayah: Wilayah[];
  allKeluarga: Keluarga[];
  familyMembers: KeluargaMember[];
  pastoralNotes: JemaatCatatanPastoral[];
  pastoralNotesPage: number;
  pastoralNotesPageSize: number;
  totalPastoralNotes: number;
  disabled?: boolean;
}) {
  const router = useRouter();
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
      router.refresh();
    });
  }

  const wilayahNama = allWilayah.find((w) => w.id === values.wilayah_id)?.nama;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{jemaat.nomor_anggota ?? "-"}</p>
          <h1 className="text-2xl font-semibold">{jemaat.nama}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={values.status_keanggotaan} />
            {wilayahNama && <Badge variant="outline">{wilayahNama}</Badge>}
            {jemaat.keluarga && (
              <Button
                size="sm"
                variant="outline"
                className="h-5 rounded-4xl px-2 text-xs"
                render={<Link href={`/admin/keluarga/${jemaat.keluarga.id}`} />}
                nativeButton={false}
              >
                {jemaat.keluarga.nama}
              </Button>
            )}
          </div>
          {jemaat.labels.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {jemaat.labels.map((l) => l.nama).join(", ")}
            </p>
          )}
        </div>
        {!disabled && (
          <div className="flex gap-2">
            <DeleteJemaatButton jemaatId={jemaat.id} jemaatNama={jemaat.nama} />
            <Button onClick={onSave} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Profil</h2>
        <ProfileFields
          values={values}
          set={set}
          allLabels={allLabels}
          allWilayah={allWilayah}
          allKeluarga={allKeluarga}
          disabled={disabled || isPending}
        />
      </section>

      <Separator />

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Anggota Keluarga</h2>
        <KeluargaAnggotaList members={familyMembers} />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Catatan Pastoral</h2>
        <CatatanPastoralSection jemaatId={jemaat.id} notes={pastoralNotes} disabled={disabled} />
        {totalPastoralNotes > 0 && (
          <PaginationBar
            page={pastoralNotesPage}
            pageSize={pastoralNotesPageSize}
            totalItems={totalPastoralNotes}
            entryLabel="catatan"
          />
        )}
      </section>
    </div>
  );
}
