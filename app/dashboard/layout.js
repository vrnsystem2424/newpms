


'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ✅ Yahan maine 'Project Buffer' add kar diya hai
const NAV_ITEMS = [
  { href: '/dashboard/exception-log', label: 'Exception Change Log' },
  { href: '/dashboard/msp-plan', label: 'MSP Plan' },  
  { href: '/dashboard/project-plan', label: 'Project Plan' },
  { href: '/dashboard/project-buffer', label: 'Project Buffer' },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setUser(data.user);
        else setUser(null);
      })
      .catch(() => setUser(null));
  }, []);

  // Route change pe mobile menu band
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col w-full">
      {/* Navbar - full width */}
      <header
        className="sticky top-0 z-50 border-b w-full"
        style={{
          background: 'rgba(255, 252, 248, 0.92)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* LEFT: Logo */}
          <div className="flex items-center shrink-0">
            <Link href="/dashboard/project-plan" className="flex items-center gap-2">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{
                  background: 'linear-gradient(145deg, #147067, #0f5c56)',
                  boxShadow: '0 6px 16px rgba(15, 92, 86, 0.28)',
                }}
              >
                P
              </div>
              <div className="leading-tight hidden xs:block sm:block">
                <div className="text-sm font-bold tracking-wide">PMS</div>
                <div className="text-[10px] font-medium hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                  Workspace
                </div>
              </div>
            </Link>
          </div>

          {/* CENTER: Nav - desktop */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={
                    active
                      ? {
                          background: 'var(--primary)',
                          color: '#fff',
                          boxShadow: '0 6px 16px rgba(15, 92, 86, 0.25)',
                        }
                      : { color: 'var(--text-muted)' }
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: User + Logout + Mobile menu btn */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="text-right hidden sm:block">
                {/* <div className="text-xs sm:text-sm font-semibold leading-none truncate max-w-[140px] lg:max-w-[220px]">
                  {user.email}
                </div> */}
                <div className="mt-1">
                  <span className="badge-type">{user.type}</span>
                </div>
              </div>
            ) : (
              <div
                className="w-20 h-7 rounded-lg animate-pulse hidden sm:block"
                style={{ background: 'var(--border)' }}
              />
            )}

            <button
              onClick={logout}
              className="text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-[10px] border transition-colors hidden sm:inline-flex"
              style={{
                borderColor: 'var(--border-strong)',
                color: 'var(--text-muted)',
                background: 'var(--surface)',
              }}
            >
              Logout
            </button>

            {/* Hamburger - mobile only */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              <div className="w-5 flex flex-col gap-1">
                <span className="block h-0.5 w-full rounded" style={{ background: 'var(--text-main)' }} />
                <span className="block h-0.5 w-full rounded" style={{ background: 'var(--text-main)' }} />
                <span className="block h-0.5 w-full rounded" style={{ background: 'var(--text-main)' }} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div
            className="md:hidden border-t px-3 py-3 space-y-2"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-center"
                  style={
                    active
                      ? { background: 'var(--primary)', color: '#fff' }
                      : {
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-main)',
                        }
                  }
                >
                  {item.label}
                </Link>
              );
            })}

            {user && (
              <div className="px-2 pt-2 text-center sm:hidden">
                <div className="text-sm font-semibold">{user.email}</div>
                <div className="mt-1">
                  <span className="badge-type">{user.type}</span>
                </div>
              </div>
            )}

            <button
              onClick={logout}
              className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border sm:hidden"
              style={{
                borderColor: '#fecaca',
                color: 'var(--danger)',
                background: 'var(--danger-soft)',
              }}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* MAIN: full width of screen */}
      <main className="w-full flex-1 px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}