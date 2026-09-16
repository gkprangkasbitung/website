"use client";

import Link from "next/link";
import { LogOutIcon, UserIcon } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(label: string) {
  return label.trim().slice(0, 2).toUpperCase() || "?";
}

export function AccountMenu({
  email,
  fullName,
  roleLabel,
  onNavigate,
}: {
  email: string | null;
  fullName: string | null;
  roleLabel: string;
  /** Called when navigating to Profil Saya - lets a Sheet-hosted instance close itself. */
  onNavigate?: () => void;
}) {
  const displayName = fullName || email || "Pengguna";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent"
          />
        }
      >
        <Avatar>
          <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
            {initials(displayName)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-sidebar-foreground">{displayName}</span>
          <span className="block truncate text-xs text-sidebar-foreground/60">{roleLabel}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        {email && <div className="truncate px-1.5 py-1 text-xs font-medium text-muted-foreground">{email}</div>}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/admin/akun" onClick={onNavigate} />}>
          <UserIcon /> Profil Saya
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem variant="destructive" render={<button type="submit" className="w-full" />}>
            <LogOutIcon /> Keluar
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
