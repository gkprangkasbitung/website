"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { WartaStatus } from "@/types/warta";

export function PublishToggle({ wartaId, status }: { wartaId: string; status: WartaStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nextStatus: WartaStatus = status === "published" ? "draft" : "published";

  function onToggle() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/warta/${wartaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        toast.error("Gagal mengubah status");
        return;
      }

      toast.success(nextStatus === "published" ? "Warta diterbitkan" : "Warta ditarik ke draft");
      router.refresh();
    });
  }

  return (
    <Button variant={status === "published" ? "outline" : "default"} onClick={onToggle} disabled={isPending}>
      {isPending ? "..." : status === "published" ? "Tarik ke Draft" : "Terbitkan"}
    </Button>
  );
}
