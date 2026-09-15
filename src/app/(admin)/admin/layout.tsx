import Link from "next/link";
import { getAuthenticatedUser, hasPermission } from "@/lib/rbac/dal";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  const canReadWarta = hasPermission(user, "warta", "read");

  const navItems = [
    { href: "/admin", label: "Dashboard", show: true },
    { href: "/admin/warta", label: "Warta", show: canReadWarta },
    { href: "/admin/peribadahan", label: "Peribadahan", show: canReadWarta },
    { href: "/admin/litbang", label: "Litbang", show: canReadWarta },
    { href: "/admin/sarana-dana", label: "Sarana & Dana", show: canReadWarta },
    { href: "/admin/tempat", label: "Tempat", show: canReadWarta },
    { href: "/admin/jemaat", label: "Jemaat", show: canReadWarta },
    { href: "/admin/label-jemaat", label: "Label Jemaat", show: canReadWarta },
    { href: "/admin/users", label: "Pengguna", show: hasPermission(user, "users", "read") },
    { href: "/admin/roles", label: "Roles & Permissions", show: hasPermission(user, "roles", "read") },
  ].filter((item) => item.show);

  return (
    <div className="grid min-h-svh grid-cols-[240px_1fr]">
      <aside className="border-r bg-muted/30 p-4">
        <div className="mb-6 px-2 text-sm font-semibold">GKP Rangkasbitung — Admin</div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-2 py-1.5 text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <div className="text-sm text-muted-foreground">
            {user.email} · {user.roles.map((r) => r.name).join(", ") || "tanpa role"}
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Keluar
            </Button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
