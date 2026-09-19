"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Collapses a table row's actions behind one "..." trigger. Hidden until
 * the row is hovered/focused on pointer devices (the parent TableRow needs
 * `group/row`); always visible on touch, since there's no hover there. */
export function RowActionsMenu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-100 data-[popup-open]:opacity-100 md:opacity-0 md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100"
          />
        }
      >
        <MoreHorizontal className="size-4" />
        <span className="sr-only">Buka menu aksi</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
