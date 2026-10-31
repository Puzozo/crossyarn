# STATUS — Crossyarn

## Next (що робити далі, див. ROADMAP-week-2026-W44.md v2)
- [ ] P1b: точність розпізнавання — зібрати 10-20 реальних фото/сканів зі «правильною» схемою, заміряти, донавчити класифікатор; ручне підлаштування 4 кутів у preview для фото
- [ ] P4d (low): перевірити малювання свайпом на телефоні
- [ ] Дрібне: рядок у CLAUDE.md про режим в'язання не закомічено
- [ ] P5: кластер D (ажур) — supporting-статті (shawl/scarf lace deep-dives)
- [ ] mc-1: медіа API (`/api/admin/media`, sharp-варіанти), публічний рендерер контенту і admin-редактор МК/постів (docs/master-classes-spec.md §4/§5/§8) — без них записи в БД невидимі на сайті
## Blocked
- P2 billing WayForPay → перенесено на тиждень 2026-11-02 (йде оформлення ФОП); Universal Premium згорає 2026-11-15 — якщо не встигаємо, продовжити дату
- Billing: мерчант-ключі WayForPay/LiqPay (ФОП) — dry-run mock покриває

## Done recently
- mc-content-lib: `src/lib/content/` за spec §3/§7 — types.ts (блоки Tiptap-JSON) + schema.ts (zod-валідатор, білий список вузлів, .strict(), headings лише 2/3, href лише http(s)/relative, ≤300 блоків, ≤1MB), youtube.ts (parseYouTubeId; рецензія виправила `endsWith("youtube.com")`, що хибно пропускав домени типу fakeyoutube.com), gate.ts (gateContent/canAccessMasterClass-заглушка), slug.ts (slugify/isValidSlug/isTsxBlogSlug), materials.ts/gallery.ts (zod для JSON-полів МК); scripts/seed-master-class.ts (ідемпотентний seed 1 МК + 1 Post, не запускався — потрібен людині). tsc + eslint чисті
- P5: supporting-стаття кластера B «жаккард для початківців» (UA, content-writer чернетка + Qwen + рецензія) — нова стаття src/content/blog/posts/jacquard-knitting-for-beginners.tsx, зареєстрована в index.ts; 5 H2, посилання на pillar /blog/fair-isle-jacquard-charts, /blog/how-to-read-knitting-chart, /blog/knitting-chart-symbols, /explore, /patterns. Рецензія виправила кілька граматичних ляпів чернетки (рід прикметників, русизм «блокировка», зіпсовані фрази). Браузером підтверджено 0 консольних помилок і всі посилання робочі. tsc + eslint чисті
- P5: EN-пара pillar-статті кластера D «ажур» (content-writer чернетка + Qwen + рецензія) — нова стаття src/content/blog/posts/lace-knitting-charts-explained.tsx (lang 'en', translationOf 'lace-knitting-charts'), worker написав файл, але не встиг зареєструвати (timeout) — зареєстровано в index.ts рецензією. Посилання на якорі EN-словника #yarn-over/#k2tog-left/#k2tog-right, на /blog/how-to-read-a-knitting-chart, /explore, /patterns. Браузером підтверджено двосторонній hreflang uk/en/x-default, робочі якорі, стаття в списку /blog. tsc + eslint чисті
- P5: EN-пара pillar-статті кластера C «коси» (content-writer чернетка + Qwen + рецензія) — нова стаття src/content/blog/posts/cable-knitting-charts-explained.tsx (lang 'en', translationOf 'cable-knitting-charts'), зареєстрована в index.ts; посилання на якорі EN-словника #cable-4/#cable-6, на /blog/how-to-read-a-knitting-chart, /explore, /patterns. Браузером підтверджено двосторонній hreflang uk/en/x-default і робочі якорі. tsc + eslint чисті
- P5: прибрано 5 посилань /explore?tag=… з 4 статей блогу (cable-, fair-isle-jacquard-, how-to-read-, lace-knitting-charts.tsx) — усі ведуть на /explore, бо на проді ще немає схем із тегами й фільтр давав порожній каталог. tsc чистий
