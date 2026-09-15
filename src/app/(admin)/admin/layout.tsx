import Link from "next/link";
import { getAuthenticatedUser, hasPermission } from "@/lib/rbac/dal";
import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  const canReadWarta = hasPermission(user, "warta", "read");

  let peribadahanCategories: { key: string; name: string }[] = [];
  let saranaDanaItems: { key: string; name: string }[] = [];
  if (canReadWarta) {
    const supabase = await createClient();
    const [{ data: peribadahan }, { data: saranaDana }] = await Promise.all([
      supabase.from("peribadahan_categories").select("key, name").order("sort_order"),
      supabase.from("sarana_dana_items").select("key, name").order("key"),
    ]);
    peribadahanCategories = peribadahan ?? [];
    saranaDanaItems = saranaDana ?? [];
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", show: true, children: [] as { href: string; label: string }[] },
    { href: "/admin/warta", label: "Warta", show: canReadWarta, children: [] },
    {
      href: "/admin/peribadahan",
      label: "Peribadahan",
      show: canReadWarta,
      children: peribadahanCategories.map((c) => ({
        href: `/admin/peribadahan/${c.key}`,
        label: c.name,
      })),
    },
    { href: "/admin/litbang", label: "Litbang", show: canReadWarta, children: [] },
    {
      href: "/admin/sarana-dana",
      label: "Sarana & Dana",
      show: canReadWarta,
      children: saranaDanaItems.map((item) => ({
        href: `/admin/sarana-dana/${item.key}`,
        label: item.name,
      })),
    },
    { href: "/admin/tempat", label: "Tempat", show: canReadWarta, children: [] },
    { href: "/admin/wilayah", label: "Wilayah", show: canReadWarta, children: [] },
    { href: "/admin/jemaat", label: "Jemaat", show: canReadWarta, children: [] },
    { href: "/admin/label-jemaat", label: "Label Jemaat", show: canReadWarta, children: [] },
    { href: "/admin/users", label: "Pengguna", show: hasPermission(user, "users", "read"), children: [] },
    {
      href: "/admin/roles",
      label: "Roles & Permissions",
      show: hasPermission(user, "roles", "read"),
      children: [],
    },
  ].filter((item) => item.show);

  return (
    <div className="grid min-h-svh grid-cols-[240px_1fr]">
      <aside className="border-r bg-muted/30 p-4">
        <div className="mb-6 px-2 text-sm font-semibold">GKP Rangkasbitung — Admin</div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link href={item.href} className="block rounded px-2 py-1.5 text-sm hover:bg-muted">
                {item.label}
              </Link>
              {item.children.length > 0 && (
                <div className="ml-3 space-y-1 border-l pl-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <div className="text-sm text-muted-foreground">
            {user.email} · {user.roles.map((r) => r.name).join(", ") || "tanpa role"}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Keluar
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
