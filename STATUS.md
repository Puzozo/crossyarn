# STATUS — Crossyarn

## Next (що робити далі, див. ROADMAP-week-2026-W44.md v2)
- [ ] P1b: точність розпізнавання — зібрати 10-20 реальних фото/сканів зі «правильною» схемою, заміряти, донавчити класифікатор; ручне підлаштування 4 кутів у preview для фото
- [ ] P4d (low): перевірити малювання свайпом на телефоні
- [ ] Дрібне: рядок у CLAUDE.md про режим в'язання не закомічено
## Blocked
- P2 billing WayForPay → перенесено на тиждень 2026-11-02 (йде оформлення ФОП); Universal Premium згорає 2026-11-15 — якщо не встигаємо, продовжити дату
- Billing: мерчант-ключі WayForPay/LiqPay (ФОП) — dry-run mock покриває

## Done recently
- P5: EN-версія словника символів (Qwen + content-writer чернетка + рецензія) — нова стаття src/content/blog/posts/knitting-chart-symbols-explained.tsx (lang 'en', translationOf 'knitting-chart-symbols'), зареєстрована в index.ts; ті самі 28 id-якорів і ширини Image (24/72/96/144), що в UA; абзац-посилання на словник додано в how-to-read-a-knitting-chart.tsx. Браузером підтверджено двосторонній hreflang uk/en/x-default на обох статтях і робочий клік-перехід. tsc + eslint чисті
- P4d: favicon сайту (Qwen + рецензія) — src/app/icon.svg (Next.js file convention) повторює логотип із header-client.tsx (коло + дві дуги) з явним кольором #C4725A (--color-yarn-terracotta) замість currentColor; apple-icon.png не робили (немає інструменту рендеру растру — відповідає опису фічі). tsc чисто (eslint не застосовний — не JS/TS файл)
- P5: дата статей блогу за мовою поста (Qwen + рецензія) — /blog/[slug] і blog-list.tsx форматували дату хардкодженою/UI-локаллю замість post.lang; тепер обидва місця беруть `post.lang === "en" ? "en-US" : "uk-UA"`. tsc + eslint чисті
- P5: словник умовних позначень (UA, Qwen + рецензія) — нова стаття src/content/blog/posts/knitting-chart-symbols.tsx, зареєстрована в index.ts → у sitemap автоматично. Усі 28 символів DEFAULT_SYMBOLS з якорями і іконками BUILTIN_ICONS. tsc + eslint чисті
- P5: EN-версії 3 статей блогу (Qwen-коміт 29ebe56, рецензія) — lang:'en' + translationOf на UA-пару, двосторонній hreflang. tsc + eslint чисті
- P2: сторінка /premium через i18n (Qwen + рецензія) — тексти в ключах premium.* uk/en, розмітка в premium-content.tsx. tsc + eslint чисті
