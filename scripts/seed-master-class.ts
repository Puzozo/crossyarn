/**
 * Seeds the local dev database with a published MasterClass (uk) and a Post
 * whose content covers all non-image block types (mc-media-api is not ready yet).
 *
 * Run: npx tsx scripts/seed-master-class.ts
 * Idempotent — safe to run multiple times.
 */
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { createEmptyPattern } from "../src/lib/patterns/model";
import { validateContentDoc } from "../src/lib/content/schema";

const TEST_EMAIL = "test@crossyarn.local";
const TEST_PASSWORD = "test1234";

const db = new PrismaClient();

async function main() {
  const user = await db.user.upsert({
    where: { email: TEST_EMAIL },
    update: { isAdmin: true, isDisabled: false },
    create: {
      email: TEST_EMAIL,
      passwordHash: hashSync(TEST_PASSWORD, 10),
      name: "Test User",
      isAdmin: true
    }
  });

  let pattern = await db.pattern.findFirst({
    where: { userId: user.id, title: "Seed Pattern for MC" }
  });

  if (!pattern) {
    const doc = createEmptyPattern(12, 12);
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        doc.cells[r][c] = {
          symbolId: (r + c) % 2 === 0 ? "knit" : "purl",
          color: doc.palette[(r + c) % doc.palette.length].hex
        };
      }
    }
    pattern = await db.pattern.create({
      data: {
        userId: user.id,
        title: "Seed Pattern for MC",
        description: "Seeded pattern for master class verification",
        visibility: "PUBLIC",
        width: doc.width,
        height: doc.height,
        patternData: JSON.parse(JSON.stringify(doc)),
        paletteData: JSON.parse(JSON.stringify(doc.palette)),
        symbolSetData: JSON.parse(JSON.stringify(doc.symbols))
      }
    });
    console.log("Created pattern: Seed Pattern for MC");
  }

  const mcMaterials = JSON.stringify({
    yarn: ["Пряжа середньої толщини, 100г"],
    tools: ["Спиці №4"],
    other: []
  });

  const masterClassContent = JSON.stringify(
    validateContentDoc({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Що знадобиться" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "У цьому майстер-класі ми зв'яжемо просту шапку спицями за готовою схемою." }]
        },
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Пряжа середньої толщини" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Спиці №4" }] }] }
          ]
        },
        {
          type: "step",
          attrs: { title: "Набираємо петлі" },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Наберіть 100 петель на спиці №4." }] }]
        },
        {
          type: "step",
          attrs: { title: "В'яжемо за схемою" },
          content: [{ type: "paragraph", content: [{ type: "text", text: "В'яжіть за схемою нижче, повторюючи рапорт." }] }]
        },
        { type: "patternEmbed", attrs: { patternId: pattern.id } },
        { type: "video", attrs: { provider: "youtube", videoId: "dQw4w9WgXcQ", title: "Відео-урок" } }
      ]
    })
  );

  await db.masterClass.upsert({
    where: { slug: "vyazhemo-shapku-spicyami" },
    update: {
      authorId: user.id,
      title: "В'яжемо шапку спицями: майстер-клас зі схемою",
      summary: "Проста в'язана шапка спицями за готовою схемою — покроково, для початківців.",
      difficulty: "BEGINNER",
      durationMinutes: 90,
      status: "PUBLISHED",
      publishedAt: new Date(),
      mainPatternId: pattern.id,
      materials: mcMaterials,
      content: masterClassContent
    },
    create: {
      slug: "vyazhemo-shapku-spicyami",
      authorId: user.id,
      lang: "uk",
      title: "В'яжемо шапку спицями: майстер-клас зі схемою",
      summary: "Проста в'язана шапка спицями за готовою схемою — покроково, для початківців.",
      difficulty: "BEGINNER",
      durationMinutes: 90,
      status: "PUBLISHED",
      publishedAt: new Date(),
      mainPatternId: pattern.id,
      materials: mcMaterials,
      tags: JSON.stringify(["шапка", "спицями"]),
      content: masterClassContent
    }
  });

  const postContent = JSON.stringify(
    validateContentDoc({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Основи" }] },
        { type: "paragraph", content: [{ type: "text", text: "Схема в'язання — це графічне зображення узору." }] },
        {
          type: "blockquote",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Читайте схему знизу вгору, справа наліво для лицьового ряду." }] }
          ]
        },
        {
          type: "orderedList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Знайдіть умовні позначення" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Визначте напрямок читання" }] }] }
          ]
        }
      ]
    })
  );

  await db.post.upsert({
    where: { slug: "yak-chytaty-skhemy-vyazannya-dlya-pochatkivciv" },
    update: {
      authorId: user.id,
      title: "Як читати схеми в'язання: гід для початківців",
      heading: "Як читати схеми в'язання: гід для початківців",
      description: "Покроковий гід: як читати умовні позначення, визначати рапорт і напрямок читання схеми в'язання.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      content: postContent
    },
    create: {
      slug: "yak-chytaty-skhemy-vyazannya-dlya-pochatkivciv",
      authorId: user.id,
      lang: "uk",
      title: "Як читати схеми в'язання: гід для початківців",
      heading: "Як читати схеми в'язання: гід для початківців",
      description: "Покроковий гід: як читати умовні позначення, визначати рапорт і напрямок читання схеми в'язання.",
      tags: "[]",
      status: "PUBLISHED",
      publishedAt: new Date(),
      content: postContent
    }
  });

  console.log("Seeded master class + post:");
  console.log("  MasterClass slug: vyazhemo-shapku-spicyami (pattern: " + pattern.id + ")");
  console.log("  Post slug: yak-chytaty-skhemy-vyazannya-dlya-pochatkivciv");
}

main().finally(() => db.$disconnect());