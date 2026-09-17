"use client";

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
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

/** A "Hapus" trigger that always confirms before firing, so a stray click
 * can't destroy a row outright - every delete action in the admin should
 * go through this instead of calling its handler directly. */
export function ConfirmDeleteButton({
  onConfirm,
  isPending,
  title,
  description = "Tindakan ini tidak bisa dibatalkan.",
  label = "Hapus",
  pendingLabel = "Menghapus...",
  variant = "ghost",
  size = "sm",
}: {
  onConfirm: () => void;
  isPending?: boolean;
  title: string;
  description?: string;
  label?: string;
  pendingLabel?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" size={size} variant={variant} disabled={isPending} />}>
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? pendingLabel : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
