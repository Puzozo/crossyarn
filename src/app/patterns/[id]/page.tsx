import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/guards";
import { PatternDetailContent } from "@/components/patterns/pattern-detail-content";

export default async function PatternDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUserPage();
  const { id } = await params;

  const pattern = await db.pattern.findFirst({
    where: {
      id,
      userId: session.userId
    }
  });

  if (!pattern) {
    notFound();
  }

  return (
    <PatternDetailContent
      pattern={{
        id: pattern.id,
        title: pattern.title,
        description: pattern.description,
        width: pattern.width,
        height: pattern.height
      }}
    />
  );
}
