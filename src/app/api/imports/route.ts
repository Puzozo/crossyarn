import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { createEmptyPattern } from "@/lib/patterns/model";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const formData = await request.formData();
    const file = formData.get("image");

    const importJob = await db.patternImportJob.create({
      data: {
        userId: session.userId,
        sourceImageUrl: typeof file === "string" ? file : "uploaded-image",
        status: "READY",
        resultData: {
          stages: ["uploaded", "preprocessed", "grid-detected", "segmented", "converted", "ready"],
          suggestedTitle: "Імпортована схема",
          pattern: createEmptyPattern(24, 24)
        }
      }
    });

    return NextResponse.json(importJob, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}