# Спек: Майстер-класи + блог з адмінки

Зведено 2026-10-29 з виводів ba-analyst, ui-designer, seo-specialist. Фічі лупу `mc-*` посилаються на розділи цього файла (§N).

## §1 Рішення (зафіксовані власником)
- Контент створює **лише admin** (`getAdminSession()` / `requireAdminPage()`). Модель готова до авторства всіх: `authorId`, статуси `PENDING_REVIEW`/`REJECTED` є в enum, але UI їх не використовує.
- Відео — **лише YouTube**: зберігаємо `{provider:"youtube", videoId}`, рендер — lite-фасад, iframe `youtube-nocookie.com` тільки після кліку. `provider` — задел під Bunny Stream.
- Продаж — **пізніше**. Зараз поля `priceUah` (Int?, копійки) і `previewBlockCount` + серверне гейтування; `canAccessMasterClass()` — заглушка (`priceUah == null || isAdmin`). Білінг не реалізуємо.
- Адмінка — **тільки UA, хардкод** (як решта адмінки, без i18n). Публічні тексти — `translations.ts` uk+en.
- EN-назва розділу в UI: **"Tutorials"** (запити «knitting tutorial»), URL `/master-classes`.
- Публічна сторона **не тягне Tiptap**: власний серверний рендерер JSON (§5). Tiptap — лише в адмін-редакторі.
- Без `@dnd-kit` і без нових shadcn-компонентів у MVP: перевпорядкування кнопками ↑↓, діалоги — за зразком `src/components/ui/confirm-dialog.tsx`.

## §2 Модель даних (prisma, SQLite) — робиться вручну у mc-0
```prisma
enum ContentStatus { DRAFT PUBLISHED PENDING_REVIEW REJECTED }
enum Difficulty    { BEGINNER INTERMEDIATE ADVANCED }

model MasterClass {
  id                String        @id @default(cuid())
  authorId          String
  slug              String        @unique
  lang              String        // "uk" | "en"
  translationOfId   String?       @unique
  title             String
  summary           String        @default("")
  coverAssetId      String?
  coverAlt          String        @default("")
  difficulty        Difficulty    @default(BEGINNER)
  durationMinutes   Int?
  materials         String        @default("{\"yarn\":[],\"tools\":[],\"other\":[]}") // JSON
  tags              String        @default("[]")   // JSON, як Pattern.tags
  mainPatternId     String?       // Pattern; SetNull
  gallery           String        @default("[]")   // JSON [{assetId, alt, caption}] ≤30
  content           String        @default("{\"type\":\"doc\",\"content\":[]}") // Tiptap JSON
  status            ContentStatus @default(DRAFT)
  publishedAt       DateTime?
  priceUah          Int?          // копійки; null = безкоштовно
  previewBlockCount Int           @default(0)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  // relations: author User (Cascade), translationOf self (SetNull), mainPattern Pattern (SetNull)
  @@index([status, lang, publishedAt])
  @@index([status, difficulty])
}

model Post {
  id            String        @id @default(cuid())
  authorId      String
  slug          String        @unique
  lang          String
  translationOf String?       // slug пари (може бути TSX-стаття)
  title         String        // SEO-title ≤60
  heading       String        // H1
  description   String        // ≤155
  tags          String        @default("[]")
  coverAssetId  String?
  coverAlt      String        @default("")
  content       String        @default("{\"type\":\"doc\",\"content\":[]}")
  status        ContentStatus @default(DRAFT)
  publishedAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  @@index([status, lang, publishedAt])
}

model MediaAsset {
  id           String   @id @default(cuid())
  ownerId      String
  kind         String   @default("IMAGE")
  originalName String
  mime         String   // вихідний mime
  sizeBytes    Int
  width        Int
  height       Int
  hash         String   // sha256 оригіналу
  variants     String   // JSON {"480":"<file>","960":"<file>","1600":"<file>"}
  createdAt    DateTime @default(now())
  @@index([hash])
  @@index([ownerId, createdAt])
}
```
JSON-поля — `String` (як у наявному коді `Pattern.tags`), парсити через zod-схеми з §3.

## §3 Контент-JSON (Tiptap) — `src/lib/content/`
Верхній рівень: `{type:"doc", content: Block[]}`. Білий список вузлів:
- StarterKit: `paragraph`, `heading` (level 2|3 лише), `bulletList`, `orderedList`, `listItem`, `blockquote`, `hardBreak`, `text`; марки `bold`, `italic`, `link` (`href` лише `https:`/`http:`/відносний `/…`; рендер `rel="noopener noreferrer"` для зовнішніх).
- `image` `{assetId, alt, caption?}`; `patternImage` — те саме + мітка «Схема».
- `gallery` `{items:[{assetId, alt, caption?}] ≤12}`.
- `step` `{title}` + `content: (paragraph|bulletList|orderedList|image)[]`; номер — порядковий серед `step` у документі, не зберігається.
- `patternEmbed` `{patternId}`.
- `video` `{provider:"youtube", videoId: /^[A-Za-z0-9_-]{11}$/, title?}`.
Ліміти: JSON ≤ 1 MB, ≤ 300 блоків верхнього рівня. Невідомий вузол/атрибут → помилка валідації (на збереженні) і пропуск (на рендері).
`parseYouTubeId(url)`: `youtube.com/watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, `m.`/`www.`; інше → null.
Гейтування: `previewBlockCount` = кількість **блоків верхнього рівня**. `gateContent(doc, {priceUah, previewBlockCount}, hasAccess)` → `{doc, locked:boolean}`; викликається на сервері ДО передачі в будь-який клієнтський компонент.

## §4 Медіа
- `POST /api/admin/media` (multipart, admin): JPEG/PNG/WebP за сигнатурою (sharp `metadata().format`), ≤10 MB (перевірка `Content-Length` і фактичного розміру), `limitInputPixels: 40_000_000`, `.rotate()` (EXIF-орієнтація), метадані не зберігаються (sharp за замовчуванням), WebP q≈80 ширин 480/960/1600 (без апскейлу). Імена файлів `<assetId>-<w>.webp` у `MEDIA_UPLOAD_DIR` (default `media-uploads`, поза `public/`). Дедуп за sha256 → повертає наявний asset. Паралельно ≤2 обробки. Відповідь `{id, width, height}`.
- `GET /api/media/[id]/[w]` — `w ∈ {480,960,1600}`, файл лише за записом у БД, `Cache-Control: public, max-age=31536000, immutable`, `X-Content-Type-Options: nosniff`, 404 якщо нема. Публічний (обкладинки чернеток не секрет — id неперебірні).
- `GET /api/admin/media?cursor=` — медіатека (admin), 40 на сторінку.
- Компонент `<MediaImage assetId alt sizes priority?>` — `<img srcset>` з трьох ширин + width/height для CLS (next/image не потрібен — варіанти вже готові).

## §5 Публічний рендер
- `src/components/content/content-renderer.tsx` — server component, рендерить §3 у `.blog-prose`; заздалегідь одним запитом підтягує `patternEmbed`/`mainPattern` (лише PUBLIC/UNLISTED, інакше заглушка «Схема недоступна»).
- `youtube-facade.tsx` (client): `aspect-video`, `i.ytimg.com/vi/ID/hqdefault.jpg` lazy, `<button aria-label>` Play → iframe `https://www.youtube-nocookie.com/embed/ID?autoplay=1&rel=0`; поряд `<a href="https://www.youtube.com/watch?v=ID">` (для crawler і без JS).
- `gallery-lightbox.tsx` (client): `role=dialog aria-modal`, focus-trap, Esc, ←/→, лічильник, повернення фокуса, свайп, `prefers-reduced-motion`.
- `locked-content-cta.tsx`: dashed-картка з замком, `role="note"`, тексти `masterClass.locked.*`.

## §6 Маршрути
Публічні: `/master-classes` (`?level=beginner|intermediate|advanced&lang=uk|en&page=N`, 12/стор., за замовчуванням lang = мова UI, «Усі» = `lang=all`), `/master-classes/[slug]` (404 для не-PUBLISHED), `/blog`, `/blog/[slug]` (спершу TSX, потім DB).
Адмін: `/admin/master-classes`, `/admin/master-classes/new`, `/admin/master-classes/[id]`, `/admin/master-classes/[id]/preview`; те саме для `/admin/posts`. Редагування за `id`.
API (admin): `/api/admin/master-classes` (GET list, POST create), `/api/admin/master-classes/[id]` (GET, PATCH, DELETE), `/api/admin/master-classes/[id]/publish` (POST publish / DELETE unpublish); аналогічно `/api/admin/posts`. `GET /api/admin/patterns/search?q=` — PUBLIC/UNLISTED схеми для пікера.

## §7 Правила збереження / публікації (сервер)
- Slug: lowercase kebab `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤80; авто з title через `src/lib/translit.ts`; унікальний у своїй таблиці; для Post — також не збігається з TSX-слагами (`src/content/blog`); зарезервовані `new`, `admin`, `tag`, `page`. Після першої публікації (`publishedAt != null`) slug не змінюється (PATCH зі зміною → 409).
- `mainPatternId`/`patternEmbed` — лише PUBLIC/UNLISTED на момент збереження.
- `translationOfId`: існує, інша мова; встановлення симетричне (пара отримує зворотний зв'язок, попередній партнер обнуляється). Зміна `lang` скидає зв'язок.
- Публікація МК вимагає: title, slug, summary, обкладинка з alt, ≥1 блок, difficulty, durationMinutes, alt у всіх зображеннях/галереї. Post: title ≤60, heading, description ≤155, ≥1 блок. Відповідь 422 зі списком полів.
- Optimistic concurrency: PATCH несе `updatedAt`; якщо застарів → 409 «Хтось змінив запис».
- Після publish/unpublish/PATCH опублікованого — `revalidatePath` відповідних сторінок, `/master-classes`, `/blog`, `/sitemap.xml`.

## §8 Адмін-UI (темна тема `bg-gray-900`, акцент `indigo-600`)
- `admin-sidebar.tsx`: пункти «Майстер-класи», «Пости».
- Список `AdminContentList kind="masterClass"|"post"`: фільтр статусу (`?status=`), мова, пошук за назвою; mobile — картки, ≥768 — таблиця; меню дій Редагувати/Прев'ю/Опублікувати|Зняти/Видалити (ConfirmDialog).
- Редактор: sticky top bar (← Список, назва, стан «Не збережено/Збереження…/Збережено», Прев'ю, Опублікувати); desktop 2 колонки `1fr 360px`, mobile вкладки «Вміст | Налаштування». Налаштування — `CollapsiblePanel`-и: Основне (slug, мова, переклад, summary), Обкладинка, Параметри (складність-пілюлі, час), Матеріали (3 списки yarn/tools/other, ↑↓, ×), Теги (чіпи), Основна схема (PatternPickerDialog), Галерея (≤30, ↑↓, alt обов'язковий — червона крапка без alt), Продаж (скоро) — disabled поля + пояснення, Чекліст публікації (пункти-якорі). Автозбереження DRAFT debounce 2 с; для PUBLISHED — явна «Зберегти зміни»; `beforeunload` при незбережених.
- `ImageUploadDialog`: вкладки «Завантажити» (drag&drop + кнопка, рядок на файл з прогресом/помилкою/«Повторити») і «Медіатека».
- Блочний редактор Tiptap: тулбар H2/H3/B/I/списки/посилання + «+ Блок» (Зображення, Галерея, Крок, Схема Crossyarn, Зображення схеми, YouTube); node views з рамкою, лейблом, видаленням і ↑↓. YouTube: вставка URL → `parseYouTubeId` → мініатюра або помилка «Вставте посилання на YouTube-відео». Next SSR: `useEditor({ immediatelyRender: false })` (перевірити за актуальною докою Tiptap, Context7).
- Тексти адмінки — з виводу ui-designer (UA-стовпчик таблиці `adminContent.*`), хардкодом.

## §9 Публічний UI (yarn-палітра)
- Каталог: H1 + intro, 2 ряди пілюль-фільтрів (як `/explore`, `overflow-x-auto` на mobile), сітка 1/2/3, `MasterClassCard` (cover 4:3, `LevelBadge`, ⏱ хв, UA/EN, назва 2 рядки), пагінація «Назад · 1 / N · Далі»; стани: `loading.tsx` 6 скелетонів, порожньо без фільтрів «Майстер-класи скоро з'являться», з фільтрами «Нічого не знайдено» + «Скинути фільтри».
- Сторінка: хлібні крихти, hero 16:9 (`priority`), H1, мета-бар (рівень · час · мова · посилання на переклад якщо є), summary, картка «Матеріали» (3 колонки ≥768, порожні групи приховані), картка «Основна схема» (мініатюра `/api/patterns/{id}/thumbnail`, «Відкрити схему» → `/p/{id}`) або заглушка, контент (§5), `LockedContentCta` якщо `locked`, «Готовий виріб» (галерея + лайтбокс), теги.
- Навігація: `nav.masterClasses` у `header-client.tsx` (між «Каталог» і «Мої схеми»), `footer.masterClasses` у `footer.tsx`.
- i18n-ключі `masterClass.*`, `nav.masterClasses`, `footer.masterClasses` — таблиця ui-designer, EN «Workshops» → **«Tutorials»** (§1).

## §10 SEO
- Спільний `buildContentMetadata()` (`src/lib/seo/content-metadata.ts`): canonical, hreflang (`uk`/`en` + self-reference для одномовних; `x-default` → EN-версія якщо є, інакше self), OG `type: article` з обкладинкою 1200 px, `locale`, `publishedTime`/`modifiedTime=updatedAt`, `twitter: summary_large_image`, `robots: noindex` для не-PUBLISHED і прев'ю.
- Title МК: UA `{title}: майстер-клас зі схемою`, EN `{title}: Step-by-Step Tutorial`; description — summary (≤155). Каталог: UA «Майстер-класи з в'язання спицями та гачком», EN «Knitting & Crochet Tutorials with Charts»; `?level`/`?lang` → canonical на `/master-classes`; `?page=N>1` — self-canonical + « — сторінка N»; `page > total` → 404.
- JSON-LD МК: `Article` (image, datePublished, dateModified, inLanguage, author) + `BreadcrumbList` + `VideoObject` на кожне відео (`embedUrl`, `thumbnailUrl`; `uploadDate` невідомий → не вигадувати, тоді VideoObject не додавати). HowTo не робимо. Платні (майбутнє): `isAccessibleForFree:false` + `hasPart` `.paywall`.
- Sitemap: PUBLISHED МК і Post з `lastModified: updatedAt` і `alternates.languages` для пар; `/master-classes` у статичних. Фільтровані URL не включати.
- Перелінковка: `/p/[id]` → блок «Майстер-клас до цієї схеми» (МК з `mainPatternId = id`, PUBLISHED).

## §11 Поза обсягом (зараз)
Авторство користувачів і модерація, покупка/WayForPay, Bunny Stream, коментарі/лайки, повнотекстовий пошук, версіонування, відкладена публікація, імпорт 13 TSX-статей у БД, `@dnd-kit`.

## §12 Верифікація після всієї фічі
site-verifier (адмін: створити → завантажити фото → блоки → опублікувати → публічна сторінка → зняти; блог із DB-постом), reliability-security-auditor (upload, admin API, XSS у JSON, гейтування в RSC payload), performance-auditor (LCP сторінки МК, фасад), i18n-auditor / `i18n_scan.py`, ux-auditor (каталог, сторінка, редактор mobile).
