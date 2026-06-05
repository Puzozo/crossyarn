import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { UserBlockButton } from "@/components/admin/user-block-button";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; offset?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const search = params.search ?? "";
  const offset = Number(params.offset ?? "0");
  const limit = 30;

  const where = search ? { email: { contains: search.toLowerCase() } } : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isDisabled: true,
        createdAt: true,
        _count: { select: { patterns: true, symbols: true } }
      }
    }),
    db.user.count({ where })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Користувачі</h1>
          <p className="text-gray-400 text-sm mt-1">Всього: {total}</p>
        </div>
      </div>

      {/* Search */}
      <form className="flex gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Пошук за email..."
          className="flex-1 max-w-sm rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Знайти
        </button>
        {search && (
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Скинути
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Email / Ім'я</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Схем</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Символів</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Дата реєстрації</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Статус</th>
              <th className="text-right px-4 py-3 text-gray-400 font-medium">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-900/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="hover:text-indigo-400 transition-colors">
                    <div className="text-white font-medium">{user.email}</div>
                    {user.name && <div className="text-gray-500 text-xs">{user.name}</div>}
                    {user.isAdmin && (
                      <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-900/60 text-indigo-300">
                        admin
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-center text-gray-300">{user._count.patterns}</td>
                <td className="px-4 py-3 text-center text-gray-300">{user._count.symbols}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(user.createdAt).toLocaleDateString("uk-UA")}
                </td>
                <td className="px-4 py-3">
                  {user.isDisabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-900/40 border border-red-800 px-2.5 py-1 text-xs text-red-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      Заблокований
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/30 border border-emerald-800 px-2.5 py-1 text-xs text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Активний
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Деталі
                    </Link>
                    {!user.isAdmin && (
                      <UserBlockButton
                        userId={user.id}
                        isDisabled={user.isDisabled}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">Користувачів не знайдено</div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Показано {offset + 1}–{Math.min(offset + limit, total)} з {total}</span>
          <div className="flex gap-2">
            {offset > 0 && (
              <Link
                href={`/admin/users?search=${search}&offset=${offset - limit}`}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                ← Попередня
              </Link>
            )}
            {offset + limit < total && (
              <Link
                href={`/admin/users?search=${search}&offset=${offset + limit}`}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Наступна →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
