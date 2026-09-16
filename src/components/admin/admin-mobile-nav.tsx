"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { AccountMenu } from "@/components/admin/account-menu";
import { AdminNav, type AdminNavItem } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AdminMobileNav({
  items,
  email,
  fullName,
  roleLabel,
}: {
  items: AdminNavItem[];
  email: string | null;
  fullName: string | null;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden" />}>
        <MenuIcon className="size-4" />
        <span className="sr-only">Buka menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="admin-theme gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-2.5 text-sidebar-foreground">
            <span className="grid size-8 shrink-0 place-items-center bg-sidebar-primary text-xs font-extrabold text-sidebar-primary-foreground">
              GKP
            </span>
            GKP Rangkasbitung
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <AdminNav items={items} onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-sidebar-border p-4">
          <AccountMenu
            email={email}
            fullName={fullName}
            roleLabel={roleLabel}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
