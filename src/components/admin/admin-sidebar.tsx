"use client";

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

  async function handleSignOut() {
    await fetch("/api/admin/auth/sign-out", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="w-56 shrink-0 border-r border-gray-800 flex flex-col bg-gray-900">
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
    </aside>
  );
}
