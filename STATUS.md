# STATUS — Crossyarn

## Next (що робити далі, див. ROADMAP-week-2026-W44.md v2)
- [ ] P1b: точність розпізнавання — зібрати 10-20 реальних фото/сканів зі «правильною» схемою, заміряти, донавчити класифікатор; ручне підлаштування 4 кутів у preview для фото
- [ ] P4d (low): перевірити малювання свайпом на телефоні
- [ ] Дрібне: рядок у CLAUDE.md про режим в'язання не закомічено
- [ ] P5: кластер D (ажур) — supporting-статті (shawl/scarf lace deep-dives)
- [ ] mc-admin: admin-редактор МК/постів §8 (Tiptap, списки, пікери, публікація)
- [ ] mc-admin-ui: admin-UI поверх готового адмін-API (списки, редактор, пікери, діалоги публікації)
## Blocked
- P2 billing WayForPay → перенесено на тиждень 2026-11-02 (йде оформлення ФОП); Universal Premium згорає 2026-11-15 — якщо не встигаємо, продовжити дату
- Billing: мерчант-ключі WayForPay/LiqPay (ФОП) — dry-run mock покриває

## Done recently
- mc-lightbox: `GalleryLightbox` (портал, role=dialog, Esc/←→, лічильник, свайп, блок скролу body, повернення фокуса на тригер) + клієнтська `GalleryGrid`, підключені в МК-сторінці («Готовий виріб») і в `case "gallery"` content-renderer; ключі `masterClass.lightbox.*`. Перевірено Playwright (375/1280): клік+Enter відкриває, Esc/клік по фону закриває, стрілки й свайп гортають, фокус повертається, body overflow lock/unlock, 0 помилок у консолі (крім стороннього таймауту i.ytimg.com). tsc+eslint чисті
- mc-catalog-nav: публічний `/master-classes` (spec §9/§10) — фільтри level/lang через query (2 ряди пілюль, зміна фільтра скидає page), 12/сторінку, `page>totalPages → notFound()`, canonical: з фільтрами → `/master-classes` без query, `?page=N>1` без фільтрів → self-canonical + «— сторінка N»; `loading.tsx` 6 скелетонів; порожні стани («скоро з'являться» / «Нічого не знайдено» + «Скинути фільтри»); nav.masterClasses у шапці (desktop+мобільне) і футері; `/master-classes` + PUBLISHED МК у sitemap.ts з `alternates.languages`. Запит каталогу не вибирає `content`. Перевірено curl: canonical collapse/suffix, 404 на page=2, картка з seed-МК, нав-посилання в HTML. tsc+eslint чисті
- mc-catalog (компоненти): `src/components/master-classes/level-badge.tsx` (серверний LevelBadge, та сама мапа ключів difficulty що в [slug]/page.tsx) + `master-class-card.tsx` (серверна картка сітки: aspect-[4/3] обкладинка object-cover, LevelBadge absolute left-2 top-2, трек-тайм + мова) — тил під `/master-classes` каталог. tsc + eslint чисті
- mc-public-page: `/master-classes/[slug]` (spec §9/§10) — хлібні крихти, hero (`next/image priority`), мета-бар (рівень/час/мова/переклад), Матеріали, Основна схема (мініатюра + заглушка «Схема недоступна» без 500 для PRIVATE/видаленої), ContentRenderer+gateContent на сервері (locked CTA, перевірено: гостьовий fetch без previewBlockCount-блоків у HTML), галерея, теги; `buildContentMetadata` (canonical/hreflang/og:image), JSON-LD Article+BreadcrumbList (без VideoObject — uploadDate невідомий). DRAFT/неіснуючий slug → 404. Заразом: CSP `img-src`/`frame-src` доповнено під YouTube-фасад (мав консольну помилку), seed-скрипт — прибрано дубль суфіксу в title. tsc+eslint чисті, перевірено Playwright на 375/1280 і прямими fetch-тестами гейтування
