'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { getToken } from '@/lib/storage';
import { Spinner } from '@/components/ui';
import { Logo, PoweredBy } from '@/components/brand';
import {
  AnimalIcon,
  BreedIcon,
  CalendarIcon,
  ChevronDownIcon,
  CollapseIcon,
  CompanyIcon,
  EmbryoIcon,
  InventoryIcon,
  LabIcon,
  LocationIcon,
  SemenCodeIcon,
  TransferIcon,
} from '@/components/icons';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  /** Modules outside this build are shown but not yet reachable. */
  disabled?: boolean;
}

const NAV: NavItem[] = [
  { label: 'Calendar', href: '/calendar', icon: <CalendarIcon />, disabled: true },
  { label: 'Embryo Production', href: '/embryo-production', icon: <EmbryoIcon />, disabled: true },
  { label: 'Embryo Transfers', href: '/embryo-transfers', icon: <TransferIcon />, disabled: true },
  { label: 'Inventory', href: '/inventory', icon: <InventoryIcon />, disabled: true },
  { label: 'Animals', href: '/animals', icon: <AnimalIcon />, disabled: true },
  { label: 'Semen Codes', href: '/semen-codes', icon: <SemenCodeIcon />, disabled: true },
  { label: 'Breeds', href: '/breeds', icon: <BreedIcon />, disabled: true },
  { label: 'Companies', href: '/companies', icon: <CompanyIcon /> },
  { label: 'Labs', href: '/labs', icon: <LabIcon />, disabled: true },
  { label: 'Locations', href: '/locations', icon: <LocationIcon /> },
];

/** Spec 2.1.4 — the authenticated shell bounces anonymous visitors to /login. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user && !getToken()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  useEffect(() => {
    function onClickAway(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  if (loading || !user) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Spinner label="Loading your workspace" />
      </main>
    );
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="px-6 py-6">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto pb-4">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);

            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  aria-disabled="true"
                  title="Not part of this module"
                  className="flex cursor-not-allowed items-center gap-3 px-6 py-3 text-sm font-medium text-ink-muted"
                >
                  {item.icon}
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 border-l-[3px] px-6 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-brand bg-brand-light text-brand'
                    : 'border-transparent text-ink hover:bg-canvas'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-3">
          <PoweredBy />
        </div>

        <button
          type="button"
          className="flex items-center gap-3 border-t border-line px-6 py-4 text-sm font-medium text-ink-soft hover:text-ink"
        >
          <CollapseIcon />
          Collapse
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-3">
          <Link href="/dashboard" className="lg:hidden">
            <Logo />
          </Link>

          <div className="ml-auto" ref={menuRef}>
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 hover:bg-canvas"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-canvas text-sm font-semibold text-ink-soft">
                  {initials}
                </span>
                <span className="hidden text-sm font-semibold text-ink sm:inline">
                  {user.firstName} {user.lastName}
                </span>
                <ChevronDownIcon />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-12 min-w-56 overflow-hidden rounded-card border border-line bg-white shadow-menu"
                  role="menu"
                >
                  <div className="flex flex-col border-b border-line px-4 py-3 text-sm">
                    <strong className="font-semibold">
                      {user.firstName} {user.lastName}
                    </strong>
                    <span className="text-ink-soft">{user.email}</span>
                  </div>
                  {/* Spec 2.1.2 — logging out happens from the profile menu. */}
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-canvas"
                    onClick={() => void signOut()}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
