"use client";

import Link from "next/link";
import { useState } from "react";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { DeleteWartaRowButton } from "./delete-warta-row-button";

export function WartaRow({
  wartaId,
  tanggal,
  judul,
  status,
  canDelete,
}: {
  wartaId: string;
  tanggal: string;
  judul: string;
  status: string;
  canDelete: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <TableRow className="group/row">
      <TableCell className="text-right tabular-nums">{tanggal}</TableCell>
      <TableCell className="font-medium">{judul}</TableCell>
      <TableCell>
        <Badge variant={status === "published" ? "accent" : "secondary"}>
          {status === "published" ? "Published" : "Draft"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <RowActionsMenu>
          <DropdownMenuItem render={<Link href={`/admin/warta/${wartaId}`} />}>Edit</DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              Hapus
            </DropdownMenuItem>
          )}
        </RowActionsMenu>
      </TableCell>
      {canDelete && (
        <DeleteWartaRowButton wartaId={wartaId} judul={judul} open={confirmOpen} onOpenChange={setConfirmOpen} />
      )}
    </TableRow>
  );
}
