# Crossyarn — Roadmap (тиждень 43, 2025-10-26 → 2025-11-01)

> **Контекст:** Next.js 16, React 19, Prisma/SQLite, Zustand, JWT, Tailwind v4.
> Прод: Hostinger VPS, PM2, Caddy. GitHub Actions CI/CD.
> **Правило:** жоден пуш без `npm run build` + site-verifier SAFE.
> **Примітка:** всі користувачі мають тимчасовий Premium до 2026-11-15.
> Billing і image-import sidecar відкладено (чекаємо на залізо/ФОП).

---

## Приоритет P0 — Критичне для монетизації та стабільності

### 1. Підключити WayForPay (або LiqPay) як провайдера білінгу
**Чому:** `User.plan`/`premiumUntil` вже в моделі, `/premium` page є, `requirePremium()` є — бракує тільки платіжного шлюзу. Без цього немає монетизації.

**Що зробити:**
- [ ] Вибрати провайдера (WayForPay чи LiqPay — український, підтримує Visa/MC/Apple Pay)
- [ ] Створити `src/lib/billing/provider.ts` — єдиний інтерфейс `createPaymentLink()`, `handleCallback()`, `verifyPayment()`
- [ ] API `POST /api/billing/checkout` — повертає redirect URL на провайдера
- [ ] API `POST /api/billing/callback` — обробляє webhook, перевіряє хеш-сигнатуру, оновлює `User.plan = "PREMIUM"` + `premiumUntil`
- [ ] Іدипотентність: `idempotencyKey` на транзакціях, перевірка дублікатів
- [ ] Оновити `/premium` page — реальні ціни та CTA
- [ ] Додати `GRACE_DAYS` логіку в callback (продовжити підписку)
- [ ] Тест: seed-кордони (success / fail / timeout / дублікат)

**Файли:** `src/lib/billing/provider.ts`, `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/callback/route.ts`, `src/app/premium/page.tsx`

**Блокери:** потрібен мерчант-аккаунт WayForPay + API ключі

---

### 2. Image-import sidecar — деплой у прод
**Чому:** `lib/import-pipeline` вже написаний (queue, storage, contracts, mock-recognizer), але продакшн-рекогнайзер (ONNX CPU) не запущений.

**Що зробити:**
- [ ] Взяти `scripts/setup-server.sh` і додати PM2-процес для Python-сайдкара
- [ ] Налаштувати `/api/imports` на реального recognizer-ендпоінт (замість mock)
- [ ] Додати health-check в Caddyfile (або Caddy proxy pass)
- [ ] Перевірити, що `PatternImportJob` черга працює асинхронно
- [ ] Site-verifier: завантажити тестове зображення → перевірити статус → preview

**Файли:** `src/lib/import-pipeline/queue.ts`, `src/app/api/imports/route.ts`, `src/app/api/imports/[id]/route.ts`, `scripts/setup-server.sh`

**Блокери:** Python-сайдкар має бути зібраний і готовий

---

## Приоритет P1 — Впевненість користувача та якість

### 3. UI історії версій (`PatternVersion`)
**Чому:** Версії вже пишуться в БД (`PatternVersion[]`), але ніде не показуються. Користувач не знає, що його дані захищені.

**Що зробити:**
- [ ] API `GET /api/patterns/[id]/versions` — список версій (createdAt, snapshot preview)
- [ ] Сторінка `/patterns/[id]/history` — таймлайн версій + кнопка "Відновити"
- [ ] Підтвердження перед відновленням (toast: "Відновити з [дата]?")
- [ ] Ліміт: зберігати max N версій (напр. 50), старі видаляти при PUT

**Файли:** `src/app/patterns/[id]/history/page.tsx`, `src/app/api/patterns/[id]/versions/route.ts`, `src/lib/patterns/model.ts` (версія snapshot структури)

---

### 4. Помічник онбордингу для нових користувачів
**Чому:** Перший досвід критичний. Наразі новий користувач потрапляє на `/sign-up` → `/patterns` — порожній список без підказки.

**Що зробити:**
- [ ] Після sign-up → redirect на `/patterns` з toast "Вітаємо! Створіть першу схему" + CTA
- [ ] Пустий стан `/patterns` → велика кнопка "Створити схему" + "Імпорт зображення"
- [ ] Підказка в редакторі при першому відкритті (tooltip)
- [ ] Пропустити онбординг, якщо вже був (`onboardedAt` на User)

**Файли:** `src/app/(auth)/sign-up/page.tsx`, `src/components/patterns/patterns-content.tsx`, `src/components/editor/editor-page-content.tsx`

---

### 5. Помилки та fallback — покращення
**Чому:** Поточна обробка помилок фрагментарна. Користувач бачить "Щось пішло не так" без контексту.

**Що зробити:**
- [ ] Error boundary на кожному router segment (помилки не "пролітають" крізь layout)
- [ ] Єдиний `ErrorPage` компонент з retry кнопкою
- [ ] API: повертати `{error: "message"}` заміко generic 500 (без деталей в production)
- [ ] `try/catch` на autosave з retry-logic (3 спроби, експоненційний backoff)
- [ ] Фатальні помилки (DB down, Prisma error) → окрема toast

**Файли:** `src/app/not-found.tsx`, `src/components/layout/conditional-layout.tsx`, `src/components/editor/editor-page-content.tsx`

---

## Приоритет P2 — SEO та продуктивність

### 6. SEO: SQL LIKE для кирилиці в каталозі
**Чому:** `LIKE` тільки ASCII-fold. Пошук "шапочка" не працює. Каталог виросте — 500-елементний cap стане вузьким місцем.

**Що зробити:**
- [ ] Додати `searchTitle` (TEXT, collate NOCASE) у Pattern — нормалізована версія title
- [ ] `npx prisma db push` — додати колонку
- [ ] Міграція: скопіювати існуючі `title` → `searchTitle`
- [ ] `PUT /api/patterns/[id]` — оновлювати `searchTitle` разом із `title`
- [ ] `POST /api/patterns` — писати `searchTitle`
- [ ] `/explore` page: `WHERE searchTitle LIKE '%query%'` замість JS-фільтра
- [ ] Зняти cap 500, дозволити повний каталог

**Файли:** `prisma/schema.prisma`, `src/app/explore/page.tsx`, `src/app/api/patterns/route.ts`, `src/app/api/patterns/[id]/route.ts`

---

### 7. Core Web Vitals — аудит і виправлення
**Чому:** Google ranking залежить від LCP/CLS/INP. Canvas/SVG editor — потенційна проблема на великих сітках.

**Що зробити:**
- [ ] Запустити `ux-auditor` subagent для повного аудиту
- [ ] **LCP:** lazy-load hero на home, preconnect до шрифтів (Noto Sans вже в `public/fonts`)
- [ ] **CLS:** зафіксувати розміри всіх зображень (аватари, прев'ю патернів)
- [ ] **INP:** `editor-state.ts` Zustand — перевірити, що сторе розбитий (не один великий об'єкт)
- [ ] **Bundle:** `next bundle analyzer` — перевірити size of jspdf + svg2pdf + canvas
- [ ] Image optimization: `next/image` для прев'ю патернів (натомість статичні файли)

**Файли:** `src/lib/export/pattern-thumbnail.ts`, `src/lib/export/pdf-export.ts`, `src/lib/patterns/editor-state.ts` (якщо є), `next.config.ts`

---

## Приоритет P3 — Надійність і безпека

### 8. IDOR-аудит API
**Чому:** `requireUserPage()` перевіряє сесію, але чи перевіряє кожен endpoint, що ресурс належить користувачу?

**Що зробити:**
- [ ] Перевірити кожен write API: `userId` з session → `WHERE userId = session.userId AND id = inputId`
- [ ] `PATCH /api/patterns/[id]/visibility` — чи перевіряє owner?
- [ ] `GET /api/patterns/[id]` — чи фільтрує по userId?
- [ ] `DELETE /api/patterns/[id]` — чи перевіряє owner?
- [ ] `GET /api/imports/[id]` — чи перевіряє owner?
- [ ] `PATCH /api/symbols/[id]` — (official symbols) — чи перевіряє admin?
- [ ] [x] Додати `reliability-security-auditor` для чорного ящика

**Файли:** Всі `src/app/api/**/route.ts`

---

### 9. XSS-аудит SVG-експорту
**Чому:** `cell.color` вже escaped (закрито stored-XSS). Але `patternData` — це JSON з даними користувача. Перевірити:
- [ ] Чи всі string-поля (`title`, `description`, `symbol.name`) escaped в SVG?
- [ ] Чи `dompurify` застосовується до user-provided SVG (custom symbols)?
- [ ] Чи `src` атрибут кастомних символів санітизований?

**Файли:** `src/lib/export/pdf-export.ts`, `src/lib/export/pattern-thumbnail.ts`, `src/lib/patterns/normalize-symbols.ts`

---

## Приоритет P4 — Дрібниці, які помітні

### 10. Покращити empty state на `/explore`
**Чому:** "У каталозі поки що немає публічних схем" — погано для SEO і довіри.

**Що зробити:**
- [ ] Додати CTA "Стати першим автором" з посиланням на sign-up
- [ ] Додати "featured" патерни з `SiteSettings.featuredPatternIds` (вже є в моделі!)
- [ ] Якщо featured порожній → показати 3 випадкових публічних зверху

---

### 11. Email-верифікація при реєстрації
**Чому:** Наразі sign-up → миттєвий доступ. Немає верифікації email.

**Що зробити:**
- [ ] `emailVerified: Boolean @default(false)` на User
- [ ] `verificationToken: String? @unique` — токен на 24 години
- [ ] `POST /api/auth/verify-email` → надсилати email через Resend/SendGrid
- [ ] `GET /auth/verify/:token` → `PATCH /api/auth/verify-email` → `emailVerified = true`
- [ ] Redirect на `/account?verify=required` якщо не верифікований
- [ ] **Примітка:** Resend має free tier ($5/mo → 500 email). Альтернатива: SendGrid free tier (100/day)

**Файли:** `prisma/schema.prisma`, `src/app/api/auth/verify-email/route.ts`, `src/app/auth/verify/[token]/page.tsx`

---

### 12. Категорії/теги для патернів
**Чому:** `Pattern` має тільки `title`/`description`/`visibility`. Немає категоризації. Каталог `?q=` шукає тільки по назві.

**Що зробити:**
- [ ] `tags String[] @default([])` на Pattern (SQLite JSON-колонка)
- [ ] Пресети тегів: "шапка", "шарф", "шкарпетки", "дітям", "дорослим"
- [ ] Теги в editor (multi-select під час створення)
- [ ] Фільтр по тегах на `/explore?tag=шапка`
- [ ] Теги в `searchTitle` (об'єднати для пошуку)

**Файли:** `prisma/schema.prisma`, `src/app/explore/page.tsx`, `src/components/patterns/create-pattern-button.tsx`

---

## Не в цьому тижні (backlog)

| # | Задача | Чому не зараз |
|---|--------|---------------|
| 13 | Підписка на патерни (follow authors) | Потрібен `Follow` model + UI, не критичне |
| 14 | Rating/review патернів | Потрібен `Review` model, контент-модерація |
| 15 | Колаборація над патернами | `Collaboration` model, real-time, складно |
| 16 | PWA / mobile app | Потрібен `manifest.json`, service worker |
| 17 | Тести (Jest/Playwright) | Важливо, але не blocker для деплою |
| 18 | Analytics (Google Analytics / Plausible) | Потрібен вибір провайдера + privacy compliance |
| 19 | Dark mode | Користувачі просили, але не blocker |
| 20 | Коментарі до патернів | `Comment` model, notification система |

---

## План тижня

| День | Фокус | Очікуваний результат |
|------|-------|---------------------|
| Пн | WayForPay інтеграція | `provider.ts` + checkout API + callback handler |
| Вт | WayForPay тест + `/premium` page | Робочий payment flow (sandbox) |
| Ср | Image-import sidecar | Python-процес в PM2, health-check, робочий import |
| Чт | Version history UI | `/patterns/[id]/history` + відновлення |
| Пт | SEO (searchTitle) + IDOR-аудит | SQL LIKE кирилиця + безпека всіх API |
| Сб | Фініш: error boundaries + онбординг | Готово до деплою |
| Нд | Вихідний | |

---

**Загальний час:** ~5-7 днів роботи (залежить від WayForPay мерчант-аккаунту)
**Ризики:**
- WayForPay мерчант-аккаунт може зайняти дні на апровацію → мати fallback LiqPay
- Python-сайдкар: ONNX модель має бути збілена під VPS (Linux x64)
- SQLite: `searchTitle` migration на великій БД може блокувати
