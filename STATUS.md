# STATUS — Crossyarn

## Next (що робити далі, див. ROADMAP-week-2026-W44.md v2)
- [ ] P1b: точність розпізнавання — зібрати 10-20 реальних фото/сканів зі «правильною» схемою, заміряти, донавчити класифікатор; ручне підлаштування 4 кутів у preview для фото
- [ ] P4d (low): перевірити малювання свайпом на телефоні
- [ ] Дрібне: рядок у CLAUDE.md про режим в'язання не закомічено
- [ ] P5: EN-версія словника символів (knitting-chart-symbols) через translationOf + hreflang

## Blocked
- P2 billing WayForPay → перенесено на тиждень 2026-11-02 (йде оформлення ФОП); Universal Premium згорає 2026-11-15 — якщо не встигаємо, продовжити дату
- Billing: мерчант-ключі WayForPay/LiqPay (ФОП) — dry-run mock покриває

## Done recently
- P4d: favicon сайту (Qwen + рецензія) — src/app/icon.svg (Next.js file convention) повторює логотип із header-client.tsx (коло + дві дуги) з явним кольором #C4725A (--color-yarn-terracotta) замість currentColor; apple-icon.png не робили (немає інструменту рендеру растру — відповідає опису фічі). Перевірено: `<link rel="icon" href="/icon.svg...">` у <head>, /icon.svg → 200 image/svg+xml; браузером (Playwright) на / — консоль чиста, 0 errors/warnings, зник шумовий favicon.ico 404, що фігурував у попередніх рецензіях цієї сесії. tsc чисто (eslint не застосовний — не JS/TS файл)
- P5: дата статей блогу за мовою поста (Qwen + рецензія) — /blog/[slug] і blog-list.tsx форматували дату хардкодженою/UI-локаллю замість post.lang; тепер обидва місця беруть `post.lang === "en" ? "en-US" : "uk-UA"`. tsc + eslint чисті
- P5: словник умовних позначень (UA, Qwen + рецензія) — нова стаття src/content/blog/posts/knitting-chart-symbols.tsx, зареєстрована в index.ts → у sitemap автоматично. Усі 28 символів DEFAULT_SYMBOLS з якорями і іконками BUILTIN_ICONS. tsc + eslint чисті
- P5: EN-версії 3 статей блогу (Qwen-коміт 29ebe56, рецензія) — lang:'en' + translationOf на UA-пару, двосторонній hreflang. tsc + eslint чисті
- P5: інфра EN-статей блогу + hreflang (Qwen×3 + рецензія) — BlogPost.lang/translationOf, getPostSummaries/getPostTranslations, /blog клієнтський список з фільтром за мовою. tsc + eslint чисті
- P2: сторінка /premium через i18n (Qwen + рецензія) — тексти в ключах premium.* uk/en, розмітка в premium-content.tsx. tsc + eslint чисті
