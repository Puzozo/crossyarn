import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";

export default async function AdminStatsPage() {
  await requireAdminPage();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersLast30d,
    newUsersLast7d,
    disabledUsers,
    totalPatterns,
    patternsByVisibility,
    totalCustomSymbols,
    totalOfficialSymbols,
    recentUsers,
    recentPatterns
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.user.count({ where: { isDisabled: true } }),
    db.pattern.count(),
    db.pattern.groupBy({ by: ["visibility"], _count: true }),
    db.userSymbol.count({ where: { isOfficial: false } }),
    db.userSymbol.count({ where: { isOfficial: true } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, name: true, createdAt: true }
    }),
    db.pattern.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, title: true, width: true, height: true,
        visibility: true, createdAt: true,
        user: { select: { email: true } }
      }
    })
  ]);

  const byVis = Object.fromEntries(patternsByVisibility.map((r) => [r.visibility, r._count]));
  const privateCount = byVis["PRIVATE"] ?? 0;
  const unlistedCount = byVis["UNLISTED"] ?? 0;
  const publicCount = byVis["PUBLIC"] ?? 0;
  const visMax = Math.max(privateCount, unlistedCount, publicCount, 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Статистика</h1>
        <p className="text-gray-400 text-sm mt-1">Загальний стан платформи</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Користувачів" value={totalUsers} sub={`+${newUsersLast7d} за тиждень`} color="indigo" />
        <MetricCard label="Нових за 30 днів" value={newUsersLast30d} sub={`${disabledUsers} заблоковано`} color="sky" />
        <MetricCard label="Схем" value={totalPatterns} sub={`${publicCount} публічних`} color="violet" />
        <MetricCard
          label="Символів"
          value={totalCustomSymbols + totalOfficialSymbols}
          sub={`${totalOfficialSymbols} офіційних`}
          color="emerald"
        />
      </div>

      {/* Pattern visibility chart */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h2 className="text-base font-semibold text-white mb-5">Схеми за видимістю</h2>
        <div className="space-y-3">
          <BarRow label="Приватні" count={privateCount} max={visMax} color="bg-gray-500" />
          <BarRow label="За посиланням" count={unlistedCount} max={visMax} color="bg-amber-500" />
          <BarRow label="Публічні" count={publicCount} max={visMax} color="bg-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Нові користувачі</h2>
            <Link href="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Всі →
            </Link>
          </div>
          <div className="space-y-1">
            {recentUsers.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="flex items-center justify-between -mx-2 px-2 py-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <div className="text-white text-sm">{u.email}</div>
                  {u.name && <div className="text-gray-500 text-xs">{u.name}</div>}
                </div>
                <div className="text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString("uk-UA")}</div>
              </Link>
            ))}
            {recentUsers.length === 0 && <p className="text-gray-600 text-sm">Немає даних</p>}
          </div>
        </div>

        {/* Recent patterns */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-base font-semibold text-white mb-4">Нові схеми</h2>
          <div className="space-y-1">
            {recentPatterns.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-white text-sm">{p.title}</div>
                  <div className="text-gray-500 text-xs">{p.user.email} · {p.width}×{p.height}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    p.visibility === "PUBLIC" ? "bg-emerald-900/40 text-emerald-300" :
                    p.visibility === "UNLISTED" ? "bg-amber-900/40 text-amber-300" :
                    "bg-gray-800 text-gray-400"
                  }`}>
                    {p.visibility}
                  </span>
                  <div className="text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString("uk-UA")}</div>
                </div>
              </div>
            ))}
            {recentPatterns.length === 0 && <p className="text-gray-600 text-sm">Немає даних</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, sub, color
}: {
  label: string; value: number; sub: string;
  color: "indigo" | "sky" | "violet" | "emerald";
}) {
  const colors = {
    indigo: "border-indigo-800 text-indigo-400",
    sky: "border-sky-800 text-sky-400",
    violet: "border-violet-800 text-violet-400",
    emerald: "border-emerald-800 text-emerald-400"
  };
  return (
    <div className={`rounded-xl border bg-gray-900/50 p-4 ${colors[color]}`}>
      <div className="text-3xl font-bold text-white">{value.toLocaleString("uk-UA")}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}

function BarRow({
  label, count, max, color
}: {
  label: string; count: number; max: number; color: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-sm text-gray-400 shrink-0">{label}</div>
      <div className="flex-1 bg-gray-800 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 text-right text-sm text-white font-medium">{count}</div>
    </div>
  );
}
