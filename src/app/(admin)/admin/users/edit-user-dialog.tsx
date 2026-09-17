"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

export function EditUserDialog({
  userId,
  userLabel,
  currentRoleId,
  roles,
  currentJemaatId,
  jemaatList,
  disabled,
}: {
  userId: string;
  userLabel: string;
  currentRoleId?: string;
  roles: { id: string; name: string }[];
  currentJemaatId: string | null;
  jemaatList: { id: string; nama: string }[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState(currentRoleId ?? "");
  const [jemaatId, setJemaatId] = useState(currentJemaatId ?? NONE);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const requests: Promise<Response>[] = [
        fetch(`/api/admin/users/${userId}/jemaat`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jemaatId: jemaatId === NONE ? null : jemaatId }),
        }),
      ];
      if (roleId) {
        requests.push(
          fetch(`/api/admin/users/${userId}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roleId }),
          }),
        );
      }

      const results = await Promise.all(requests);
      const failed = results.find((r) => !r.ok);
      if (failed) {
        const data = await failed.json().catch(() => null);
        toast.error(data?.error ?? "Gagal menyimpan");
        return;
      }

      toast.success("Tersimpan");
      setOpen(false);
      router.refresh();
    });
  }

  const roleItems = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const jemaatItems = {
    [NONE]: "Tidak ada",
    ...Object.fromEntries(jemaatList.map((j) => [j.id, j.nama])),
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        {disabled ? "Lihat" : "Edit"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{userLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={roleId}
              onValueChange={(v) => v && setRoleId(v)}
              items={roleItems}
              disabled={disabled || isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Jemaat</Label>
            <Select
              value={jemaatId}
              onValueChange={(v) => v && setJemaatId(v)}
              items={jemaatItems}
              disabled={disabled || isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih jemaat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Tidak ada</SelectItem>
                {jemaatList.map((jemaat) => (
                  <SelectItem key={jemaat.id} value={jemaat.id}>
                    {jemaat.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!disabled && (
            <DialogFooter>
              <Button onClick={onSave} disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
