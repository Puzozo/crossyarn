# Crossyarn — Roadmap на тиждень 2026-10-26 → 2026-11-01

> 6 днів робочих (Пн–Сб). Пріоритети: виправлення блокерів → завершення скелетів → покращення.

---

## Пріоритет 1 — Завершити deployed-скелети (1 день)

### 1.1 Випустити те, що вже SAFE і чекає на пуш
**Чому:** likes/saved, og:image, bucket fill — вже верифіковані, код є. Кожна година затримки = користувачі без цих функцій.

- [ ] `git add` + commit + push
- [ ] Перевірити деплой через GitHub Actions
- [ ] Оновити STATUS.md

**Файли:** `src/components/patterns/like-button.tsx`, `src/components/patterns/saved-content.tsx`, `src/app/saved/page.tsx`, `src/app/api/patterns/[id]/like/route.ts`, `src/app/patterns/[id]/opengraph-image.tsx`, `src/components/editor/pattern-editor.tsx` (bucket fill)

---

## Пріоритет 2 — WayForPay billing інтеграція (2 дні)

**Чому:** `lib/billing/premium.ts` вже має `isPremium()` та `requirePremium()`. `/premium` сторінка є. Але немає реального провайдера. Це ключова монетизація.

### 2.1 Дослідження WayForPay API
- [ ] Використати `competitor-research` / `billing-integration` agent для аналізу документації WayForPay
- [ ] Визначити: payment page vs hostable page, webhook callback формат, HMAC signature
- [ ] Обрати платіж: LiqPay (простіший) vs WayForPay (більше контролю)

### 2.2 Реалізація
- [ ] Створити `lib/billing/wayforpay.ts` — HMAC signature генератор + verifier
- [ ] API route `POST /api/billing/checkout` → створює платіж → повертає form URL
- [ ] Callback route `POST /api/billing/callback` → верифікує HMAC → оновлює `User.plan`/`premiumUntil`
- [ ] Idempotency: перевіряти `TransactionId` у БД
- [ ] Оновити `/premium` сторінку: реальний CTA → checkout
- [ ] Додати `GRACE_DAYS` логіку в `isPremium()` (вже є, 3 дні)

**Блокери:** потрібні мерчант-ключі WayForPay (test mode)

---

## Пріоритет 3 — Image import end-to-end (1.5 дня)

**Чому:** `mock-recognizer.ts` вже працює, черга (`queue.ts`) є, UI (`import-preview-content.tsx`) є. Але Python-сайдкар не деплойнутий.

### 3.1 Python-сайдкар
- [ ] Створити `python-service/` з `app.py` (FastAPI) + `recognize.py` (ONNX/CV)
- [ ] Ендпоінт `POST /process` — приймає jobId + imageRef, повертає `ImportResult`
- [ ] `requirements.txt` з opencv-python, Pillow, numpy, onnxruntime
- [ ] Додати PM2 config (2-й процес на VPS)
- [ ] Налаштувати `IMPORT_PYTHON_URL` на VPS

### 3.2 Інтеграція
- [ ] `queue.ts` вже має fallback: `if (PYTHON_URL)` → real, else mock
- [ ] Додати retry logic для `startJob()` (attemptCount)
- [ ] Створити cleanup cron для `import-uploads/` (старі файли)
- [ ] Протестувати: upload → preview → correct → save

---

## Пріоритет 4 — Version history UI (1 день)

**Чому:** `PatternVersion` пишеться в БД, ніде не показується. Користувачі втрачають дані при редагуванні.

### 4.1 API
- [ ] `GET /api/patterns/[id]/versions` → список версій (id, createdAt, snapshot)
- [ ] `GET /api/patterns/[id]/versions/[versionId]` → конкретний snapshot
- [ ] `POST /api/patterns/[id]/versions/[versionId]/restore` → відновити (створює new pattern)

### 4.2 UI
- [ ] Додати "Історія версій" у sidebar редактора
- [ ] Список: дата + час (locale-aware) + кнопка "Відновити"
- [ ] Модалка підтвердження (створить новий патерн)
- [ ] Limit: останні 10 версій (щоб не гальмувало)

**Файли:** `src/lib/patterns/model.ts` (PatternVersion), `src/components/editor/`

---

## Пріоритет 5 — Покращення SEO (1 день)

**Чому:** SQLite LIKE only folds ASCII — кириличний пошук на `/explore` фільтрується в JS. Каталог росте, потрібен SQL.

### 5.1 Кириличний пошук
- [ ] Додати `titleNormalized` column (lowercase + transliteration)
- [ ] `prisma db push` з новою колонкою
- [ ] `POST /api/patterns` → зберігати транслітерований title
- [ ] `/explore` → SQL `WHERE titleNormalized LIKE %q%`

### 5.2 Категорії / теги
- [ ] Додати `tags` (JSON array) до Pattern
- [ ] Категорії: "Шарфи", "Шкарпетки", "В'язання кола" тощо
- [ ] `/explore?tag=...` фільтрація
- [ ] `sitemap.xml` → додати `/explore?tag=...` URL

### 5.3 Контент для SEO
- [ ] Створити `/blog/[slug]` сторінки (в'язальні гайди)
- [ ] `content-writer` agent для текстів
- [ ] `seo-specialist` agent для кластерів ключів

---

## Пріоритет 6 — Надійність і безпека (0.5 дня)

### 6.1 IDOR check
- [ ] `reliability-security-auditor` agent для перевірки:
  - API routes: чи перевіряють `userId` власності?
  - `/api/admin/*`: чи ізоляція від основного сайту?
  - SVG import: чи екранується `<script>`?
  - CSP: чи достатній для jspdf blob URLs?

### 6.2 Error handling
- [ ] Перевірити всі API routes на обробку помилок (try/catch → JSON error)
- [ ] `not-found.tsx` та `error.tsx` — кастомні сторінки
- [ ] Rate limiting на всіх write endpoints (зараз тільки sign-up)

### 6.3 Database
- [ ] Протестувати `prisma db push` на локальному `dev.db`
- [ ] Перевірити, що schema синхронізована з кодом
- [ ] Додати індекси для частих запитів (`userId`, `visibility`, `createdAt`)

---

## Пріоритет 7 — UX покращення (0.5 дня)

### 7.1 Editor
- [ ] "Save as copy" кнопка (дублювання з редактора)
- [ ] Toast notification при autosave success/error
- [ ] Keyboard shortcut: Ctrl+S → manual save

### 7.2 Profiles
- [ ] `ux-auditor` agent для аудиту публічних профілів
- [ ] Перевірити: чи показується аватар, чи працює fallback, чи правильний 404

### 7.3 Mobile
- [ ] `ux-auditor` для mobile viewports
- [ ] Перевірити: editor на мобільному, header, навігація

---

## Резюме на тиждень

| Пріоритет | Опис | Дні | Статус |
|-----------|------|-----|--------|
| P1 | Deploy likes/saved + og:image + bucket fill | 0.5 | ⬜ Код є, чекає на пуш |
| P2 | WayForPay billing інтеграція | 2 | ⬜ Блокери: мерчант-ключі |
| P3 | Image import Python-сайдкар | 1.5 | ⬜ Mock працює, потрібен prod |
| P4 | Version history UI | 1 | ⬜ Schema є, UI відсутній |
| P5 | SEO: кириличний пошук + теги | 1 | ⬜ LIKE → SQL нормалізація |
| P6 | Безпека + надійність | 0.5 | ⬜ Аудит agent-ом |
| P7 | UX покращення | 0.5 | ⬜ Аудит agent-ом |
| **Разом** | | **7** | |

> ⚠️ 6 робочих днів, 7 пріоритетів. P1–P3 — must-have. P4–P7 — best-effort.
