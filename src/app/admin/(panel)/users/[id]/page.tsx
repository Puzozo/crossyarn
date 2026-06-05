import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { UserBlockButton } from "@/components/admin/user-block-button";

export default async function AdminUserDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      isDisabled: true,
      createdAt: true,
      patterns: {
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, width: true, height: true, visibility: true, updatedAt: true }
      },
      symbols: {
        where: { isOfficial: false },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, description: true, imageData: true, width: true }
      }
    }
  });

  if (!user) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link href="/admin/users" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2L4 7l5 5" />
        </svg>
        Назад до списку
      </Link>

      {/* User card */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">{user.email}</h1>
              {user.isAdmin && (
                <span className="rounded px-2 py-0.5 text-xs font-semibold bg-indigo-900/60 text-indigo-300">admin</span>
              )}
              {user.isDisabled ? (
                <span className="rounded-full bg-red-900/40 border border-red-800 px-2.5 py-1 text-xs text-red-300">Заблокований</span>
              ) : (
                <span className="rounded-full bg-emerald-900/30 border border-emerald-800 px-2.5 py-1 text-xs text-emerald-300">Активний</span>
              )}
            </div>
            {user.name && <p className="text-gray-400 mt-1">{user.name}</p>}
            <p className="text-gray-500 text-xs mt-2">
              ID: {user.id} · Зареєстрований: {new Date(user.createdAt).toLocaleDateString("uk-UA")}
            </p>
          </div>
          {!user.isAdmin && (
            <UserBlockButton userId={user.id} isDisabled={user.isDisabled} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{user.patterns.length}</div>
            <div className="text-gray-500 text-xs mt-0.5">схем (показано до 20)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{user.symbols.length}</div>
            <div className="text-gray-500 text-xs mt-0.5">кастомних символів</div>
          </div>
        </div>
      </div>

      {/* Patterns */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Схеми</h2>
        {user.patterns.length === 0 ? (
          <p className="text-gray-500 text-sm">Немає схем</p>
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Назва</th>
                  <th className="text-center px-4 py-2.5 text-gray-400 font-medium">Розмір</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Видимість</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Оновлено</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {user.patterns.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-900/30">
                    <td className="px-4 py-2.5 text-white">{p.title}</td>
                    <td className="px-4 py-2.5 text-center text-gray-400 font-mono text-xs">{p.width}×{p.height}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.visibility === "PUBLIC" ? "bg-emerald-900/40 text-emerald-300" :
                        p.visibility === "UNLISTED" ? "bg-amber-900/40 text-amber-300" :
                        "bg-gray-800 text-gray-400"
                      }`}>
                        {p.visibility}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {new Date(p.updatedAt).toLocaleDateString("uk-UA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom symbols */}
      {user.symbols.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Кастомні символи</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {user.symbols.map((s) => (
              <div key={s.id} className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 flex items-start gap-3">
                {s.imageData && (
                  <Image
                    src={s.imageData}
                    alt={s.name}
                    width={40}
                    height={40}
                    className="rounded-lg shrink-0 bg-white"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">{s.name}</div>
                  <div className="text-gray-500 text-xs truncate">{s.description}</div>
                  {(s.width ?? 1) > 1 && (
                    <span className="text-[10px] text-indigo-400">×{s.width}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
