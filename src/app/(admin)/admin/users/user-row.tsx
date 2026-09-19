"use client";

import { useState } from "react";
import { InitialsAvatar } from "@/components/admin/initials-avatar";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { DeleteUserButton } from "./delete-user-button";
import { EditUserDialog } from "./edit-user-dialog";

export function UserRow({
  profileId,
  fullName,
  email,
  roleName,
  jemaatName,
  currentRoleId,
  roles,
  currentJemaatId,
  jemaatList,
  canManage,
  canDelete,
  isSelf,
}: {
  profileId: string;
  fullName: string | null;
  email: string | null;
  roleName: string | null;
  jemaatName: string | null;
  currentRoleId?: string;
  roles: { id: string; name: string }[];
  currentJemaatId: string | null;
  jemaatList: { id: string; nama: string }[];
  canManage: boolean;
  canDelete: boolean;
  isSelf: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const userLabel = fullName ?? email ?? "Pengguna";

  return (
    <TableRow className="group/row">
      <TableCell className="font-medium">
        <div className="flex items-center gap-2.5">
          <InitialsAvatar name={userLabel} />
          {fullName ?? "-"}
        </div>
      </TableCell>
      <TableCell>{email}</TableCell>
      <TableCell>{roleName ? <Badge variant="secondary">{roleName}</Badge> : "-"}</TableCell>
      <TableCell>{jemaatName ?? "-"}</TableCell>
      <TableCell className="text-right">
        <RowActionsMenu>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>{canManage ? "Edit" : "Lihat"}</DropdownMenuItem>
          {canDelete && !isSelf && (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              Hapus
            </DropdownMenuItem>
          )}
        </RowActionsMenu>
      </TableCell>
      <EditUserDialog
        userId={profileId}
        userLabel={userLabel}
        currentRoleId={currentRoleId}
        roles={roles}
        currentJemaatId={currentJemaatId}
        jemaatList={jemaatList}
        disabled={!canManage}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      {canDelete && !isSelf && (
        <DeleteUserButton userId={profileId} email={email} open={confirmOpen} onOpenChange={setConfirmOpen} />
      )}
    </TableRow>
  );
}
