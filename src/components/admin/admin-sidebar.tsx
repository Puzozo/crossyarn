"use client";

import { useEffect, useRef, useSyncExternalStore, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  {
    href: "/admin/users",
    label: "Користувачі",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="6" r="3" />
        <path d="M2 16c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      </svg>
    )
  },
  {
    href: "/admin/master-classes",
    label: "Майстер-класи",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h12v12H3z" />
        <path d="M6 7h6M6 10h6M6 13h3" />
      </svg>
    )
  },
  {
    href: "/admin/posts",
    label: "Пости",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 3h10v12l-5-3-5 3z" />
      </svg>
    )
  },
  {
    href: "/admin/symbols",
    label: "Позначки",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="6" height="6" rx="1" />
        <rect x="10" y="2" width="6" height="6" rx="1" />
        <rect x="2" y="10" width="6" height="6" rx="1" />
        <rect x="10" y="10" width="6" height="6" rx="1" />
      </svg>
    )
  },
  {
    href: "/admin/stats",
    label: "Статистика",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 14l4-5 3 3 4-6 3 4" />
      </svg>
    )
  }
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  function closeMenu() {
    setOpen(false);
    toggleButtonRef.current?.focus();
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelector));
    focusables[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === "Tab" && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleSignOut() {
    await fetch("/api/admin/auth/sign-out", { method: "POST" });
    router.push("/admin/login");
  }

  const navContent = (
    <>
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 15s6-3 6-7.5V4L8 2 2 4v3.5C2 12 8 15 8 15z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Admin Panel</div>
            <div className="text-[11px] text-gray-400 truncate">{email}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 3h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4" />
            <path d="M7 12l-4-3 4-3M3 9h8" />
          </svg>
          Вийти
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-800 bg-gray-900 px-4 py-3 lg:hidden">
        <button
          ref={toggleButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          aria-label="Відкрити меню"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-white">Admin Panel</span>
      </div>

      {mounted && createPortal(
        <>
          {open && (
            <div className="fixed inset-0 z-[9998] bg-black/50 lg:hidden" onClick={closeMenu} />
          )}
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Меню адмінки"
            inert={!open ? true : undefined}
            aria-hidden={!open}
            className={`fixed inset-y-0 left-0 z-[9999] flex w-64 flex-col overflow-y-auto border-r border-gray-800 bg-gray-900 transition-transform duration-300 lg:hidden ${
              open ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              type="button"
              onClick={closeMenu}
              className="self-end m-3 flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
              aria-label="Закрити меню"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
            {navContent}
          </aside>
        </>,
        document.body
      )}

      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col border-r border-gray-800 bg-gray-900">
        {navContent}
      </aside>
    </>
  );
}
