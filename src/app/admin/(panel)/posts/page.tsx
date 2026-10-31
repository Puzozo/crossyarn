import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { AdminContentList } from "@/components/admin/content/admin-content-list";
import { CreatePostButton } from "@/components/admin/content/create-post-button";

export default async function AdminPostsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; lang?: string; q?: string; page?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;

  const PAGE_SIZE = 20;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const status = params.status ?? "";
  const lang = params.lang ?? "";
  const q = (params.q ?? "").trim();

  const where: Prisma.PostWhereInput = {};
  if (status && ["DRAFT", "PUBLISHED", "PENDING_REVIEW", "REJECTED"].includes(status)) {
    where.status = status as Prisma.PostWhereInput["status"];
  }
  if (lang === "uk" || lang === "en") where.lang = lang;
  if (q) where.title = { contains: q };

  const [rows, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        lang: true,
        status: true,
        updatedAt: true,
        publishedAt: true
      }
    }),
    db.post.count({ where })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const items = rows.map((i) => ({
    ...i,
    updatedAt: i.updatedAt.toISOString(),
    publishedAt: i.publishedAt ? i.publishedAt.toISOString() : null
  }));

  const filtersActive = Boolean(status || lang || q);
  const filterQuery = "status=" + status + "&lang=" + lang + "&q=" + q;
  const baseHref = "/admin/posts?";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Пости</h1>
          <p className="text-gray-400 text-sm mt-1">Всього: {total}</p>
        </div>
        <CreatePostButton />
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/posts" className="flex flex-wrap items-center gap-3">
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">Усі</option>
          <option value="DRAFT">Чернетка</option>
          <option value="PUBLISHED">Опубліковано</option>
          <option value="PENDING_REVIEW">На розгляді</option>
          <option value="REJECTED">Відхилено</option>
        </select>
        <select
          name="lang"
          defaultValue={lang}
          className="rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">Усі</option>
          <option value="uk">uk</option>
          <option value="en">en</option>
        </select>
        <input
          name="q"
          defaultValue={q}
          placeholder="Пошук за назвою..."
          className="flex-1 max-w-sm rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Фільтрувати
        </button>
        {filtersActive && (
          <Link
            href="/admin/posts"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Скинути
          </Link>
        )}
      </form>

      <AdminContentList kind="post" items={items} />

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Показано {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} з {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={baseHref + filterQuery + "&page=" + (page - 1)}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                ← Попередня
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={baseHref + filterQuery + "&page=" + (page + 1)}
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
