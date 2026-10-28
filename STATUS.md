# STATUS — Crossyarn

## Next (що робити далі, див. ROADMAP-week-2026-W44.md v2)
- [ ] P1b: точність розпізнавання — зібрати 10-20 реальних фото/сканів зі «правильною» схемою, заміряти, донавчити класифікатор; ручне підлаштування 4 кутів у preview для фото
- [ ] P4d (low): перевірити малювання свайпом на телефоні
- [ ] Дрібне: рядок у CLAUDE.md про режим в'язання не закомічено
- [ ] P5: кластер C (коси) — supporting-статті (аранські візерунки з описом, коси для шапки) + EN-пара pillar-статті cable-knitting-charts
- [ ] P5: кластер D (ажур) — EN-пара pillar-статті lace-knitting-charts + supporting-статті
## Blocked
- P2 billing WayForPay → перенесено на тиждень 2026-11-02 (йде оформлення ФОП); Universal Premium згорає 2026-11-15 — якщо не встигаємо, продовжити дату
- Billing: мерчант-ключі WayForPay/LiqPay (ФОП) — dry-run mock покриває

## Done recently
- P4d: повторний i18n-аудит клієнтського коду (qwen_agent i18n-auditor впав через max_turns без браузерних інструментів → аудит зробив сам механічним grep по Cyrillic/aria-label/placeholder у src/components і клієнтських частинах src/app (без admin/)) — знайшов 1 реальну проблему: хардкоджений `aria-label="Pagination"` (англійською, завжди, незалежно від мови UI) у explore-content.tsx і saved-content.tsx; додав ключ `common.pagination` (uk/en) і замінив на `t("common.pagination")` в обох місцях. Структурна звірка uk/en блоків translations.ts підтвердила повну 1:1 відповідність ключів (жодного пропущеного). tsc + eslint чисті
- P5: pillar-стаття кластера D «ажур і мереживо» (UA, content-writer чернетка + Qwen + рецензія) — нова стаття src/content/blog/posts/lace-knitting-charts.tsx, зареєстрована в index.ts; 6 H2 + 1 H3 (накид/зменшення, раппорт з розкладкою по рядах, типові помилки, ажур для шалі/шарфа/топа), посилання на якорі словника #yarn-over/#k2tog-left/#k2tog-right, на /blog/how-to-read-knitting-chart, /explore?tag=ажур, /patterns. Браузером підтверджено 0 консольних помилок на статті й на /blog (стаття в списку), якорі словника резолвляться. tsc + eslint чисті
- P5: pillar-стаття кластера C «коси та аранські візерунки» (UA, content-writer чернетка + Qwen + рецензія) — нова стаття src/content/blog/posts/cable-knitting-charts.tsx, зареєстрована в index.ts; 6 H2 + 1 H3, посилання на якорі словника #cable-4/#cable-6, на /blog/how-to-read-knitting-chart, /explore?tag=коси, /patterns. Браузером підтверджено 0 консольних помилок на статті, на /blog (стаття в списку) і на всіх 4 внутрішніх посиланнях; тег "коси" у каталозі поки без збігів (порожній стан каталогу в dev, не помилка маршруту). tsc + eslint чисті
- P5: EN-версія словника символів (Qwen + content-writer чернетка + рецензія) — нова стаття src/content/blog/posts/knitting-chart-symbols-explained.tsx (lang 'en', translationOf 'knitting-chart-symbols'), зареєстрована в index.ts; ті самі 28 id-якорів і ширини Image (24/72/96/144), що в UA; абзац-посилання на словник додано в how-to-read-a-knitting-chart.tsx. Браузером підтверджено двосторонній hreflang uk/en/x-default на обох статтях і робочий клік-перехід. tsc + eslint чисті
- P4d: favicon сайту (Qwen + рецензія) — src/app/icon.svg (Next.js file convention) повторює логотип із header-client.tsx (коло + дві дуги) з явним кольором #C4725A (--color-yarn-terracotta) замість currentColor; apple-icon.png не робили (немає інструменту рендеру растру — відповідає опису фічі). tsc чисто (eslint не застосовний — не JS/TS файл)
