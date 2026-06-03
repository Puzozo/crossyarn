import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/guards";
import { PatternsContent } from "@/components/patterns/patterns-content";

export default async function PatternsPage() {
  const session = await requireUserPage();
  const patterns = await db.pattern.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" }
  });

  const serialized = patterns.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    width: p.width,
    height: p.height,
    visibility: p.visibility,
    updatedAt: p.updatedAt.toISOString()
  }));

  return <PatternsContent patterns={serialized} />;
}
