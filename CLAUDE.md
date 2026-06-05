# Crossyarn — Claude Instructions

## Stack
- Next.js 15 App Router, TypeScript, Tailwind CSS v4, Prisma/SQLite, Zustand, JWT (jose), bcryptjs
- Deploy: GitHub Actions self-hosted runner → Hostinger VPS (187.124.130.31), PM2, Caddy reverse proxy

## Build & Deploy
```bash
npm run build
# Next.js standalone mode requires:
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```
Deploy is automatic on push to `main` via `.github/workflows/deploy.yml`.
The workflow runs `prisma generate` + `prisma db push --skip-generate` before build.

## Database
- SQLite at `prisma/dev.db` (local), `/opt/crossyarn/prisma/prod.db` (prod)
- Schema changes: `npx prisma db push` (no migrations, direct push)
- Never run `prisma migrate` — this project uses `db push` only

## Auth
- **Main site session**: cookie `crossyarn-session`, 7d expiry, secret = `AUTH_SECRET`
- **Admin session**: cookie `crossyarn-admin`, path `/admin`, 8h expiry, secret = `AUTH_SECRET + "_admin"`
- Admin user: set `isAdmin: true` in DB manually after first registration

## Admin Panel
- URL: `/admin/login` (completely isolated from main site)
- No links from main site to admin
- Route group `(panel)` protects all admin pages except login
- `ConditionalLayout` client component hides main Header for `/admin/*` paths

## Key Patterns
- `requireSession()` / `requireUserPage()` — main site auth guards (redirect to `/sign-in`)
- `requireAdminPage()` — admin guard (redirect to `/admin/login`)
- Official symbols: `UserSymbol.isOfficial = true`, served to all users via `getOfficialSymbols()`
- Rate limiting: in-memory `Map` per IP key, 5 attempts/min (`src/lib/auth/rate-limit.ts`)

## Symbol System
- `PatternSymbol`: `width?: number` (1–6), `height?: number` (1–6)
- Multi-cell symbols use `occupiedByAnchor: [row, col]` on non-anchor cells
- Pattern grid uses explicit CSS `grid-row`/`grid-column` (not auto-placement) for multi-row symbols
- Image limit: 300KB (any size), recommended: `width*64 × height*64` px

## Production Setup (first time)
```bash
# On VPS after first registration:
cd /opt/crossyarn && node -e "
const {PrismaClient} = require('@prisma/client');
const db = new PrismaClient();
db.user.update({
  where: { email: 'vkpuzenko@gmail.com' },
  data: { isAdmin: true }
}).then(u => console.log('Admin set:', u.email)).finally(() => db.\$disconnect());
"
```

## i18n
- Translations in `src/lib/i18n/translations.ts` — both `uk` and `en` blocks must be updated together
- Interpolation: `t("key", { variable: value })`
