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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

export function InviteUserDialog({
  roles,
  jemaatList,
}: {
  roles: { id: string; name: string }[];
  jemaatList: { id: string; nama: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [roleId, setRoleId] = useState(NONE);
  const [jemaatId, setJemaatId] = useState(NONE);

  function onSubmit(formData: FormData) {
    const email = formData.get("email");
    const fullName = formData.get("fullName");

    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          roleId: roleId === NONE ? null : roleId,
          jemaatId: jemaatId === NONE ? null : jemaatId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Gagal mengundang pengguna");
        return;
      }

      toast.success("Undangan terkirim");
      setOpen(false);
      setRoleId(NONE);
      setJemaatId(NONE);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Undang Pengguna</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Undang Pengguna</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input id="fullName" name="fullName" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={roleId}
              onValueChange={(v) => v && setRoleId(v)}
              items={{ [NONE]: "Tidak ada", ...Object.fromEntries(roles.map((r) => [r.id, r.name])) }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Tidak ada</SelectItem>
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
              items={{
                [NONE]: "Tidak ada",
                ...Object.fromEntries(jemaatList.map((j) => [j.id, j.nama])),
              }}
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
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Mengirim..." : "Kirim Undangan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
