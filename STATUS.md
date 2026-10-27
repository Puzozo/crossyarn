# STATUS — Crossyarn

## Next (що робити далі, див. ROADMAP-week-2026-W44.md v2)
- [ ] P1b: точність розпізнавання — зібрати 10-20 реальних фото/сканів зі «правильною» схемою, заміряти, донавчити класифікатор; ручне підлаштування 4 кутів у preview для фото
- [ ] P4d (low): tablet header 768, soft-404 на /patterns/[bad] (перевірити живим GET, можливо вже закрито), дрібні tap-таргети (× тегів), перевірити малювання свайпом на телефоні; білі смуги в сітці на вузькому екрані
- [ ] P5 (SEO): блог /blog/[slug] + 3-5 статей
- [ ] Дрібне: рядок у CLAUDE.md про режим в'язання не закомічено

## Blocked
- P2 billing WayForPay → перенесено на тиждень 2026-11-02 (йде оформлення ФОП); Universal Premium згорає 2026-11-15 — якщо не встигаємо, продовжити дату
- Billing: мерчант-ключі WayForPay/LiqPay (ФОП) — dry-run mock покриває

## Done recently
- P4d: /explore — пошук/тег через escaped raw SQL LIKE (ESCAPE '\\') замість Prisma `contains` (яке не вміє ESCAPE): «100%» і «_» більше не працюють як SQL-вайлдкарди; дружній порожній стан з кнопкою «Скинути фільтри» коли пошук/тег нічого не знайшли
- P4d: унікальні <title> для /patterns, /account, /editor/[id] (назва схеми), /sign-in, /sign-up, /imports/[id]/preview (раніше показували дефолтний title з layout); account/editor/patterns/imports тепер з robots noindex
- P4d cleanup: прибрано невикористані імпорти (Button, useRouter/router, useRef) у public-pattern/auth/import-preview + зайвий eslint-disable у редакторі — 5 eslint-попереджень → 0, tsc чистий
- P4c: ConfirmDialog замість confirm() (відновлення версії, видалення схеми/позначки), історія версій (бейдж «Поточна», мініатюра замість JSON, дата за мовою, тост), підказки імпорту + тост після збереження — ЗАДЕПЛОЄНО 28aa938
- P4b: редактор — sticky тулбар над сіткою, згортання панелей, «Вмістити»; виправлено lg:grid-cols-[a,b] (Tailwind v4 потребує `_`) у редакторі, на головній і в preview імпорту — ЗАДЕПЛОЄНО e903b27
