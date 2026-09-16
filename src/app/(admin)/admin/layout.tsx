import { getAuthenticatedUser, hasPermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { AccountMenu } from "@/components/admin/account-menu";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  const canReadWarta = hasPermission(user, "warta", "read");
  const roleLabel = user.roles.map((r) => r.name).join(", ") || "Tanpa role";

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
    <div className="admin-theme grid min-h-svh grid-cols-1 bg-background text-foreground md:grid-cols-[240px_1fr]">
      <aside className="hidden flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <span className="grid size-8 shrink-0 place-items-center bg-sidebar-primary text-xs font-extrabold text-sidebar-primary-foreground">
            GKP
          </span>
          <span className="text-sm leading-tight font-extrabold">GKP Rangkasbitung</span>
        </div>
        <AdminNav items={navItems} />
        <div className="mt-auto border-t border-sidebar-border pt-3">
          <AccountMenu email={user.email} fullName={user.profile?.full_name ?? null} roleLabel={roleLabel} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <AdminMobileNav items={navItems} email={user.email} fullName={user.profile?.full_name ?? null} roleLabel={roleLabel} />
            <span className="text-sm font-extrabold md:hidden">GKP Rangkasbitung</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
