"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

/** Quick delete straight from the Warta list row - same endpoint as
 * `DeleteWartaButton` on the detail page, but refreshes in place instead
 * of navigating away (we're already on the list). */
export function DeleteWartaRowButton({ wartaId, judul }: { wartaId: string; judul: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/warta/${wartaId}`, { method: "DELETE" });

      if (!res.ok) {
        toast.error("Gagal menghapus warta");
        return;
      }

      toast.success("Warta dihapus");
      router.refresh();
    });
  }

  return (
    <ConfirmDeleteButton
      onConfirm={onDelete}
      isPending={isPending}
      title={`Hapus "${judul}"?`}
      description="Semua data Litbang dan Kesaksian khusus warta ini akan ikut terhapus. Tindakan ini tidak bisa dibatalkan."
    />
  );
}
