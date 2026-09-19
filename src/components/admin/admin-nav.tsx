"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export interface AdminNavItem {
  href: string;
  label: string;
  children: { href: string; label: string }[];
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ items, onNavigate }: { items: AdminNavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const childActive = item.children.some((c) => isActive(pathname, c.href));
        const active = !childActive && isActive(pathname, item.href);

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "block border-l-2 px-3 py-2 text-sm transition-colors",
                active
                  ? "border-sidebar-primary bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                  : "border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              {item.label}
            </Link>
            {item.children.length > 0 && (
              <div className="ml-3 space-y-1 border-l border-sidebar-border pl-2">
                {item.children.map((child) => {
                  const childIsActive = isActive(pathname, child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        "block border-l-2 px-2 py-1 text-sm transition-colors",
                        childIsActive
                          ? "border-sidebar-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "border-transparent text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
