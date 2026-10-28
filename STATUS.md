# STATUS — Crossyarn

## Next (що робити далі, див. ROADMAP-week-2026-W44.md v2)
- [ ] P1b: точність розпізнавання — зібрати 10-20 реальних фото/сканів зі «правильною» схемою, заміряти, донавчити класифікатор; ручне підлаштування 4 кутів у preview для фото
- [ ] P4d (low): перевірити малювання свайпом на телефоні
- [ ] Дрібне: рядок у CLAUDE.md про режим в'язання не закомічено
- [ ] P5: кластер D (ажур) — supporting-статті (shawl/scarf lace deep-dives)
## Blocked
- P2 billing WayForPay → перенесено на тиждень 2026-11-02 (йде оформлення ФОП); Universal Premium згорає 2026-11-15 — якщо не встигаємо, продовжити дату
- Billing: мерчант-ключі WayForPay/LiqPay (ФОП) — dry-run mock покриває

## Done recently
- P5: EN-пара pillar-статті кластера D «ажур» (content-writer чернетка + Qwen + рецензія) — нова стаття src/content/blog/posts/lace-knitting-charts-explained.tsx (lang 'en', translationOf 'lace-knitting-charts'), worker написав файл, але не встиг зареєструвати (timeout) — зареєстровано в index.ts рецензією. Посилання на якорі EN-словника #yarn-over/#k2tog-left/#k2tog-right, на /blog/how-to-read-a-knitting-chart, /explore, /patterns. Браузером підтверджено двосторонній hreflang uk/en/x-default, робочі якорі, стаття в списку /blog. tsc + eslint чисті
- P5: EN-пара pillar-статті кластера C «коси» (content-writer чернетка + Qwen + рецензія) — нова стаття src/content/blog/posts/cable-knitting-charts-explained.tsx (lang 'en', translationOf 'cable-knitting-charts'), зареєстрована в index.ts; посилання на якорі EN-словника #cable-4/#cable-6, на /blog/how-to-read-a-knitting-chart, /explore, /patterns. Браузером підтверджено двосторонній hreflang uk/en/x-default і робочі якорі. tsc + eslint чисті
- P5: прибрано 5 посилань /explore?tag=… з 4 статей блогу (cable-, fair-isle-jacquard-, how-to-read-, lace-knitting-charts.tsx) — усі ведуть на /explore, бо на проді ще немає схем із тегами й фільтр давав порожній каталог. tsc чистий
- P4d: повторний i18n-аудит клієнтського коду (qwen_agent i18n-auditor впав через max_turns без браузерних інструментів → аудит зробив сам механічним grep по Cyrillic/aria-label/placeholder у src/components і клієнтських частинах src/app (без admin/)) — знайшов 1 реальну проблему: хардкоджений `aria-label="Pagination"` (англійською, завжди, незалежно від мови UI) у explore-content.tsx і saved-content.tsx; додав ключ `common.pagination` (uk/en) і замінив на `t("common.pagination")` в обох місцях. Структурна звірка uk/en блоків translations.ts підтвердила повну 1:1 відповідність ключів (жодного пропущеного). tsc + eslint чисті
- P5: pillar-стаття кластера C «коси та аранські візерунки» (UA, content-writer чернетка + Qwen + рецензія) — нова стаття src/content/blog/posts/cable-knitting-charts.tsx, зареєстрована в index.ts; 6 H2 + 1 H3, посилання на якорі словника #cable-4/#cable-6, на /blog/how-to-read-knitting-chart, /patterns. Браузером підтверджено 0 консольних помилок на статті, на /blog (стаття в списку) і на всіх внутрішніх посиланнях. tsc + eslint чисті
