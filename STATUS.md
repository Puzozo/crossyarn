# STATUS — Crossyarn

## Next (що робити далі, див. ROADMAP-week-2026-W44.md v2)
- [ ] P1b: точність розпізнавання — зібрати 10-20 реальних фото/сканів зі «правильною» схемою, заміряти, донавчити класифікатор; ручне підлаштування 4 кутів у preview для фото
- [ ] P4d (low): перевірити малювання свайпом на телефоні
- [ ] Дрібне: рядок у CLAUDE.md про режим в'язання не закомічено
- [ ] P5: кластер D (ажур) — supporting-статті (shawl/scarf lace deep-dives)
- [ ] mc-admin: admin-редактор МК/постів §8 (Tiptap, списки, пікери, публікація)
- [ ] mc-admin-ui: admin-UI поверх готового адмін-API (списки, редактор, пікери, діалоги публікації)
- [ ] mc-catalog: публічний каталог `/master-classes` §9 (зараз лише `/master-classes/[slug]`, хлібна крихта веде на 404)
- [ ] /blog, nav.masterClasses/footer.masterClasses — підключити публічні МК-сторінки до навігації й сайтмапу
## Blocked
- P2 billing WayForPay → перенесено на тиждень 2026-11-02 (йде оформлення ФОП); Universal Premium згорає 2026-11-15 — якщо не встигаємо, продовжити дату
- Billing: мерчант-ключі WayForPay/LiqPay (ФОП) — dry-run mock покриває

## Done recently
- mc-public-page: `/master-classes/[slug]` (spec §9/§10) — хлібні крихти, hero (`next/image priority`), мета-бар (рівень/час/мова/переклад), Матеріали, Основна схема (мініатюра + заглушка «Схема недоступна» без 500 для PRIVATE/видаленої), ContentRenderer+gateContent на сервері (locked CTA, перевірено: гостьовий fetch без previewBlockCount-блоків у HTML), галерея, теги; `buildContentMetadata` (canonical/hreflang/og:image), JSON-LD Article+BreadcrumbList (без VideoObject — uploadDate невідомий). DRAFT/неіснуючий slug → 404. Заразом: CSP `img-src`/`frame-src` доповнено під YouTube-фасад (мав консольну помилку), seed-скрипт — прибрано дубль суфіксу в title. tsc+eslint чисті, перевірено Playwright на 375/1280 і прямими fetch-тестами гейтування
- p-page: блок «Майстер-клас до цієї схеми» на /p/[id] — `db.masterClass.findFirst` (mainPatternId + PUBLISHED) у page.tsx, проп `relatedMasterClass` у `PublicPatternContent` (Link → /master-classes/[slug], badge/заголовок/CTA), нові i18n-ключі `masterClass.relatedBlock.badge/cta` (uk+en). tsc + eslint чисті
- mc-render: `src/components/content/content-renderer.tsx` — серверний рендерер ContentDoc у семантичний HTML (без dangerouslySetInnerHTML, невідомі блоки → null, один findMany для patternEmbed PUBLIC/UNLISTED, MediaImage/YouTubeFacade, marks bold/italic/link, i18n translate). tsc + eslint чисті
- mc-render (частина): `src/components/content/locked-content-cta.tsx` — серверний lock-компонент для платного МК без доступу (🔒 + masterClass.locked.title/description, класи yarn-sand/cream/charcoal/warm-gray, без CTA-лінка — білінгу нема). tsc + eslint чисті
- mc-admin-api: адмін-API МК/постів (spec §6/§7) — спільний `src/lib/content/repo-shared.ts` (zod create/patch-схеми, resolveNewSlug/assertSlugAllowed з TSX+reserved-забороною, assertFresh optimistic-concurrency за updatedAt, assertSlugNotLocked для опублікованих, assertPatternsVisible PUBLIC/UNLISTED, publish-чеклісти, симетричний translationOf link/unlink у транзакції, revalidatePath). Роути `/api/admin/master-classes` (+`[id]`, `[id]/publish`), `/api/admin/posts` (+`[id]`, `[id]/publish`), `/api/admin/patterns/search` (escaped LIKE як /explore, лише PUBLIC/UNLISTED). getAdminSession на всіх, без isSameOriginRequest (admin-кука sameSite:strict). Видалення МК обнуляє translationOf пари через FK SetNull. verify:static — tsc + eslint чисті
