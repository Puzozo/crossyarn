import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/guards";
import { ImportPreviewContent } from "@/components/import/import-preview-content";

export default async function ImportPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUserPage();
  const { id } = await params;

  const job = await db.patternImportJob.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true }
  });
  if (!job || job.userId !== session.userId) {
    notFound();
  }

  return <ImportPreviewContent importId={job.id} initialStatus={job.status} />;
}
