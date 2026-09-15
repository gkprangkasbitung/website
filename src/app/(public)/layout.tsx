import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/tentang-kami", label: "Tentang Kami" },
  { href: "/jadwal-ibadah", label: "Jadwal Ibadah" },
  { href: "/warta", label: "Warta" },
  { href: "/kontak", label: "Kontak" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-semibold">
            GKP Rangkasbitung
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:underline">
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} GKP Rangkasbitung.
        </div>
      </footer>
    </>
  );
}
