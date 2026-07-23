"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { AuthPanel } from "@/components/AuthPanel";
import { Icon, type IconName } from "@/components/Icon";

type NavItem = { href: string; label: string; icon: IconName };

// Restrained navigation. Future routes (favorites, collections, search,
// practice, coach) still exist but are intentionally not surfaced as clutter.
const navItems: NavItem[] = [
  { href: "/studio", label: "Studio", icon: "dashboard" },
  { href: "/studio/new", label: "Start a painting", icon: "plus" },
];

export function StudioShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return (
    <main className="shell">
      <div className="app-loading">
        <span className="spinner" />
        <p>Opening your studio…</p>
      </div>
    </main>
  );
  if (!user) return <main className="shell"><AuthPanel /></main>;

  return (
    <div className="studio-layout">
      <aside className="studio-sidebar">
        <Link href="/studio" className="studio-brand">ArtPraxis</Link>
        <nav className="studio-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={pathname === item.href ? "nav-item active" : "nav-item"}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="studio-account">
          <p className="account-email">{user.displayName || user.email}</p>
          <button onClick={() => signOut(auth)}><Icon name="logout" size={17} />Sign out</button>
        </div>
      </aside>
      <div className="studio-main">{children}</div>
    </div>
  );
}
