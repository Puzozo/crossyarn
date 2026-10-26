# Crossyarn — Roadmap на тиждень 2026-10-26 → 2026-11-01 (v2)

> v2 від 2026-10-26 — переписано під фактичний стан коду (git + STATUS.md). v1 зберігається в git.
> 6 днів робочих (Пн–Сб). **Головний ризик тижня:** Universal Premium сгорає **2026-11-15** (20 днів) — billing треба мати у dry-run до вівторка.
> **Правило:** жоден пуш без `npm run build` + site-verifier SAFE (docs/PRE-DEPLOY.md).

## Підсумок Пн 2026-10-26 (зроблено за день, усе в проді)

- ✅ **P0** — Resend підключено (домен verified, DNS в adm.tools), reset-лист доходить у «Вхідні»
- ✅ **P1** — імпорт з фото в проді (pm2 `crossyarn-import`, Python 3.12, tesseract ukr); точність — окремо в P1b (потрібні реальні фото)
- ✅ **P3** — аудит безпеки: усі High/Medium/Low закрито (порт 3000, DoS через символи, сесії, rate-limit, ліміти, Caddy 10MB)
- ✅ **P4** — UX аудит #2 + редизайн редактора (тулбар, згортання панелей), ConfirmDialog, підказки імпорту
- ✅ Поза планом: режим в'язання на /p/[id], власні позначки до 20×20
- ⏭ **P2 billing перенесено на тиждень 2026-11-02** (оформлення ФОП); якщо не встигаємо до 15.11 — продовжити Universal Premium
- Далі: P4d (дрібний UX), P5 (блог), P1b (точність розпізнавання)

---

## Що вже зроблено (не плануємо)

- ✅ P1 (v1): likes/saved, og:image, bucket fill — **задеплоєно**
- ✅ P4 (v1): історія версій (sidebar + API) — **задеплоєно**
- ✅ P5 (v1): кириличний SQL-пошук (titleTranslit) + теги (UI в редакторі, `/explore?tag=`)
- ✅ UI/UX аудит #1: всі фікси (password reset flow, footer, sort, private page, tags JSON migration) — **задеплоєно**

---

## P0 — Ops: production-готовність (0.5 дня, Понеділок)

**Чому:** паролі-reset і пошук уже в прод-коді, але в проді не працюють без env і перевірки. 2 години роботи = реальні користувачі.

- [ ] Виставити `RESEND_API_KEY` на VPS (hPanel → VPS → browser terminal → env pm2 `crossyarn` → `pm2 restart crossyarn`)
- [ ] E2E в проді: `/forgot-password` → лист приходить → token → нова параол
- [ ] `/explore`: перевірити кириличний пошук + фільтр `?tag=` після деплою
- [ ] Переконатись, що `prisma db push` застосовано в проді (`resetToken`, `resetTokenExpiry`, `titleTranslit`, `tags`)

---

## P1 — Image import end-to-end у проді (2 дні) — flagship

**Чому:** `python-service` вже **валідований** (grid 40/40, empty cells 100%, classifier val 0.9995 / end-to-end 0.79, color 1.000, legend 24/24, multi-cell + wide CNN). Бракує лише розгортання. Blocker «чекаємо на залізо» **сумнівний** — сервіс CPU-only (onnxruntime + opencv), спочатку пробуємо наявний VPS.

- [ ] VPS: python venv + `requirements.txt`, `apt install tesseract-ocr tesseract-ocr-ukr` (legend OCR)
- [ ] `pm2 start "uvicorn app:app --host 127.0.0.1 --port 8001" --name crossyarn-import` (env: `INTERNAL_API_KEY`, `NEXT_CALLBACK_URL`, `IMPORT_UPLOAD_DIR`, `MODEL_PATH`)
- [ ] Next env: `IMPORT_PYTHON_URL=http://127.0.0.1:8001`
- [ ] Caddy: не проксіювати :8001; перевірити, що `/api/internal/*` не доступний з публічного listener'а
- [ ] Site-verifier: upload → preview → correct → save (повний цикл)
- [ ] Якщо VPS зависає → тоді вже «чекаємо на залізо» (або підняти RAM-ліміт VPS)

**Файли:** `python-service/*`, `src/lib/import-pipeline/queue.ts`

---

## P2 — Billing WayForPay: dry-run до ключів (2 дні)

**Чому:** Premium сгорає 15.11 (20 днів). Мерчант-ключі ще не готові (ФОП) — тому весь код пишемо **заразі**, а ключі підставимо за годину. Без цього тижня монетизації не буде.

- [ ] Дослідження: `billing-integration` agent — WayForPay API (HMAC-сигнатура, hostable page, callback-формат) vs LiqPay (резерв)
- [ ] `src/lib/billing/provider.ts` — інтерфейс (`createPayment`, `handleCallback`, `verify`) + **mock-провайдер** (DRY_RUN) + реальний WayForPay
- [ ] `POST /api/billing/checkout` → form/redirect URL
- [ ] `POST /api/billing/callback` → HMAC verify → `User.plan`/`premiumUntil` + GRACE_DAYS; idempotency по `TransactionId`
- [ ] `/premium`: banner → реальний CTA + ціни (коментар у `page.tsx` уже про це каже)
- [ ] Тести: success / fail / duplicate callback

**Блокери:** мерчант-ключі WayForPay/LiqPay (зовнішні) — dry-run це мігрує.

**Файли:** `src/lib/billing/*`, `src/app/api/billing/*` (нові), `src/app/premium/page.tsx`

---

## P3 — Безпека: reliability-security-auditor (1 день, Чт)

**Чому:** P6 з v1, не зроблено. Аудит #1 UI/UX уже відпрацював — зараз час на security-аудит, доки код не розріс ще більше.

- [ ] `reliability-security-auditor` agent: IDOR (усі write-API перевіряють `userId`), ізоляція `/api/admin/*`, SVG/XSS, CSP, security headers
- [ ] Rate limiting на **всіх** write-endpoint'ах (зараз тільки auth + imports; `src/lib/auth/rate-limit.ts` вже є — поширити)
- [ ] `error.tsx` на router segments (зараз відсутня)
- [ ] DB-індекси: `userId`, `visibility`, `createdAt`
- [ ] Фікси HIGH/Critical після аудиту (деплой перед вихідними)

---

## P4 — UX аудит #2 (0.5 дня, Пт)

**Чому:** нові фічі (теги, історія версій, лайки, /saved, password reset) ще ніким не прокликані в браузері як користувач.

- [ ] `ux-auditor` agent: перевірка фіксів аудиту #1 + нові фічі, desktop/tablet/mobile
- [ ] Перевірити: autosave toast, Ctrl+S (якщо немає — додати), empty-state `/patterns`
- [ ] Фікси HIGH/MEDIUM

---

## P5 — SEO контент: блог (1–1.5 дня, Пт–Сб)

**Чому:** фичевий MVP завершено — зростання тепер через органіку. Контент під цільові запити = трафік.

- [ ] `seo-specialist` agent: семантичні кластери (UA + EN), URL-структура
- [ ] `/blog/[slug]` — сторінки статей (metadata, OG, canonical)
- [ ] `content-writer` agent: 3–5 гайдів (схеми в'язання, як читати позначки, як працювати в редакторі)
- [ ] Внутрішні посилання: стаття → `/explore?tag=...`, `/p/[id]`
- [ ] `sitemap.xml` — додати URL статей

---

## Розклад (Пн–Сб)

| День | П1 import | P2 billing | P3 sec | P4 UX | P5 SEO | P0 ops |
|---|---|---|---|---|---|---|
| Пн | setup VPS | research + provider.ts | | | | RESEND + прод-перевірки |
| Вт | deploy + test | checkout + callback | | | | |
| Ср | fix / E2E | /premium CTA + тести | | | | |
| Чт | — | dry-run smoke | **аудит + фікси** | | | |
| Пт | — | | | **аудит + фікси** | **блог 1–2** | |
| Сб | буфер | буфер | деплой фіксів | | **блог 3–5** | |

> **Must-have:** P0, P1, P2 (dry-run). **Best-effort:** P3–P5 (за наявності часу, в порядку таблиці).

## Ризики

| Ризик | Мітигація |
|---|---|
| VPS не тягне ONNX+OpenCV | P1 починається з тесту на VPS; fallback — підняти VPS або нове залізо |
| Мерчант-ключі не до 15.11 | dry-run mock-провайдер: переключення = 1 env + деплой |
| Аудит безпеки знайде критичне | Чтв — повний день під P3, деплой фіксів до вихідних |
