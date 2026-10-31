# STATUS — Crossyarn

## Next (що робити далі, див. ROADMAP-week-2026-W44.md v2)
- [ ] P1b: точність розпізнавання — зібрати 10-20 реальних фото/сканів зі «правильною» схемою, заміряти, донавчити класифікатор; ручне підлаштування 4 кутів у preview для фото
- [ ] P4d (low): перевірити малювання свайпом на телефоні
- [ ] Дрібне: рядок у CLAUDE.md про режим в'язання не закомічено
- [ ] P5: кластер D (ажур) — supporting-статті (shawl/scarf lace deep-dives)
- [ ] mc-render: інтеграція §5 — підключити ContentRenderer/YouTubeFacade/locked-content-cta до публічних сторінок МК/постів; gallery-lightbox окремо
- [ ] mc-admin: admin-редактор МК/постів §8 (Tiptap, списки, пікери, публікація) і публічні маршрути §6
- [ ] mc-admin-ui: admin-UI поверх готового адмін-API (списки, редактор, пікери, діалоги публікації)
## Blocked
- P2 billing WayForPay → перенесено на тиждень 2026-11-02 (йде оформлення ФОП); Universal Premium згорає 2026-11-15 — якщо не встигаємо, продовжити дату
- Billing: мерчант-ключі WayForPay/LiqPay (ФОП) — dry-run mock покриває

## Done recently
- mc-render: `src/components/content/content-renderer.tsx` — серверний рендерер ContentDoc у семантичний HTML (без dangerouslySetInnerHTML, невідомі блоки → null, один findMany для patternEmbed PUBLIC/UNLISTED, MediaImage/YouTubeFacade, marks bold/italic/link, i18n translate). tsc + eslint чисті
- mc-render (частина): `src/components/content/locked-content-cta.tsx` — серверний lock-компонент для платного МК без доступу (🔒 + masterClass.locked.title/description, класи yarn-sand/cream/charcoal/warm-gray, без CTA-лінка — білінгу нема). tsc + eslint чисті
- mc-admin-api: адмін-API МК/постів (spec §6/§7) — спільний `src/lib/content/repo-shared.ts` (zod create/patch-схеми, resolveNewSlug/assertSlugAllowed з TSX+reserved-забороною, assertFresh optimistic-concurrency за updatedAt, assertSlugNotLocked для опублікованих, assertPatternsVisible PUBLIC/UNLISTED, publish-чеклісти, симетричний translationOf link/unlink у транзакції, revalidatePath). Роути `/api/admin/master-classes` (+`[id]`, `[id]/publish`), `/api/admin/posts` (+`[id]`, `[id]/publish`), `/api/admin/patterns/search` (escaped LIKE як /explore, лише PUBLIC/UNLISTED). getAdminSession на всіх, без isSameOriginRequest (admin-кука sameSite:strict). Видалення МК обнуляє translationOf пари через FK SetNull. verify:static — tsc + eslint чисті
- mc-media-api: завантаження і роздача зображень (spec §4) — `src/lib/content/media.ts` (sharp-пайплайн: EXIF `.rotate()`, 3 WebP-варіанти 480/960/1600 q80 без апскейлу, `limitInputPixels:40M`, sha256, атомарний запис tmp→rename з прибиранням, семафор ≤2, guard від traversal), `POST/GET /api/admin/media` (getAdminSession, Origin-перевірка на POST, ліміт 10MB за Content-Length+фактом, сигнатура відкидає SVG/GIF, дедуп за hash, курсорна пагінація 40/стор.), публічний `GET /api/media/[id]/[w]` (w∈480/960/1600, файл лише за записом у БД, Cache-Control immutable + nosniff), `<MediaImage>` (srcSet 3 ширин + width/height для CLS). Опусом як qwen_safe:false. tsc + eslint чисті
- mc-content-lib: `src/lib/content/` за spec §3/§7 — types.ts (блоки Tiptap-JSON) + schema.ts (zod-валідатор, білий список вузлів, .strict(), headings лише 2/3, href лише http(s)/relative, ≤300 блоків, ≤1MB), youtube.ts (parseYouTubeId; рецензія виправила `endsWith("youtube.com")`, що хибно пропускав домени типу fakeyoutube.com), gate.ts (gateContent/canAccessMasterClass-заглушка), slug.ts (slugify/isValidSlug/isTsxBlogSlug), materials.ts/gallery.ts (zod для JSON-полів МК); scripts/seed-master-class.ts (ідемпотентний seed 1 МК + 1 Post, не запускався — потрібен людині). tsc + eslint чисті
