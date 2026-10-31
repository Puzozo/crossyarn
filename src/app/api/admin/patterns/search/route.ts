import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import { escapeSqlLike } from "@/lib/utils";
import { translit } from "@/lib/translit";

const LIMIT = 20;

/** PUBLIC/UNLISTED patterns for the master-class pattern picker (§6). */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();

  // Only PUBLIC/UNLISTED patterns can be embedded; mirror /explore's escaped LIKE so a
  // Cyrillic query is case-insensitive (matched against the ASCII titleTranslit too).
  const conditions: Prisma.Sql[] = [Prisma.sql`"visibility" IN ('PUBLIC', 'UNLISTED')`];
  if (q) {
    const escaped = `%${escapeSqlLike(q)}%`;
    const escapedTranslit = `%${escapeSqlLike(translit(q))}%`;
    conditions.push(
      Prisma.sql`("title" LIKE ${escaped} ESCAPE '\\' OR "titleTranslit" LIKE ${escapedTranslit} ESCAPE '\\')`
    );
  }

  const rows = await db.$queryRaw<{ id: string; title: string; width: number; height: number; visibility: string }[]>(
    Prisma.sql`SELECT "id", "title", "width", "height", "visibility" FROM "Pattern"
      WHERE ${Prisma.join(conditions, " AND ")} ORDER BY "updatedAt" DESC LIMIT ${LIMIT}`
  );

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      width: r.width,
      height: r.height,
      visibility: r.visibility,
      thumbnailUrl: `/api/patterns/${r.id}/thumbnail`
    }))
  });
}
