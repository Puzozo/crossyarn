# Crossyarn — Claude Instructions

Платформа для створення та редагування схем в'язання — crossyarn.online.

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS v4, Prisma/SQLite, Zustand, JWT (jose), bcryptjs
- PDF export: jspdf (client-side); SVG is rasterized to PNG via canvas, then embedded (avoids jsPDF's no-Cyrillic font issue)
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) set in `next.config.ts`; `poweredByHeader: false`
- Deploy: GitHub Actions self-hosted runner → Hostinger VPS (187.124.130.31), PM2, Caddy reverse proxy

## Implemented Features

### Pattern editor (`/editor/[id]`, `pattern-editor.tsx` + `editor-state.ts` Zustand store)
- Grid painting with symbols + color palette, undo/redo, autosave (1.2s debounce)
- Resize via W×H inputs; +/− buttons on all four grid edges (add/remove row/column, min 1×1)
- Multi-cell symbols up to 6×6 (`occupiedByAnchor` mechanism, explicit CSS grid placement)
- **Zoom**: ± toolbar + Ctrl+scroll, 40%–250% (`zoomLevel` in store, scales cell px)
- **Keyboard shortcuts**: Ctrl+Z/Y undo/redo, Esc exits selection/insert modes, 1–9 picks a palette symbol, +/− zoom (ignored while typing in inputs)
- **Rapports** (repeating motifs): select area → save named rapport → insert anywhere with 4 mirror variants (as-is / H / V / both, `mirrorRapportCells`); stored in `PatternDocument.rapports[]`; auto-clips at edges; multi-cell symbols expand selection bounds automatically
- **Skip purl rows** (`view.skipPurlRows`): hides even rows, numbering 1,3,5...; symbols anchored in a hidden row project onto the next visible row; applied in editor, print, SVG/PDF

### Patterns (`/patterns`)
- CRUD + duplicate (`POST /api/patterns/[id]/duplicate`), search
- Print page `/patterns/[id]/print` (browser print, multi-cell aware)
- SVG export `/api/exports/[id]` (titles RFC-5987 encoded; legend lists only used symbols, excludes "empty"); PDF download rasterizes that SVG to PNG then embeds it (`src/lib/export/pdf-export.ts`)
- Versioning in DB (`PatternVersion`, not yet surfaced in UI)

### Symbols
- 28 builtin symbols (`DEFAULT_SYMBOLS` in `model.ts`, base64 SVG icons in `builtin-icons.ts`)
- User custom symbols (account page, image ≤300KB, sizes 1×1 to 6×6)
- Official symbols: `UserSymbol.isOfficial = true`, served to all users via `getOfficialSymbols()`
- Builtin overrides: admin can edit builtin symbols — `UserSymbol.builtinId` record overrides the code default globally (`getBuiltinOverrides()` merge in `getAvailableSymbols()`)

### Admin panel (`/admin`, fully isolated from main site)
- Users management (list, details, block/unblock), official + builtin symbols editing, stats dashboard

### Auth & security
- Sign-in/sign-up, bcrypt, rate limiting 5/min per IP (`src/lib/auth/rate-limit.ts`); IP from trusted rightmost `X-Forwarded-For` hop (`getClientIp`)
- Sessions re-validated against the DB on every request: `getSession` rejects `isDisabled`, `getAdminSession` rejects non-`isAdmin`/`isDisabled` (blocked/demoted users lose access immediately, not after token expiry)
- All write APIs validate with zod (`src/lib/patterns/validation.ts`); `POST /api/patterns` uses a bounded schema (width/height ≤200) so oversized requests can't OOM; cell colors / palette hex constrained to hex format; `cell.color` escaped in SVG export (closed a stored-XSS vector)

### Not yet implemented
- Public catalog / visibility UI (DB field exists), profile editing, bucket fill, image import (stub), Stripe / premium, ads

## Build & Deploy
```bash
npm run build
# Next.js standalone mode requires:
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```
Deploy is automatic on push to `main` via `.github/workflows/deploy.yml`.
The workflow runs `prisma generate` + `prisma db push --skip-generate --accept-data-loss` before build.

## Pre-Deploy Verification — MANDATORY
**Follow `docs/PRE-DEPLOY.md` before every push to main.**
Short version: `npm run build` → delegate UI verification to the `site-verifier` subagent → push only on SAFE TO DEPLOY verdict.

## Subagents (defined in `c:\Projects\Work\.claude\agents\`)
- `site-verifier` — browser verification of a specific change before deploy (see PRE-DEPLOY.md)
- `competitor-research` — investigates how tamica.ru / ravelry.com implement a feature; use when designing new functionality
- `ux-auditor` — periodic UX/UI audit from a user's perspective (usability, mobile, copy/i18n, a11y, polish); read-only
- `reliability-security-auditor` — periodic reliability + security audit of our own site (IDOR/auth, validation, XSS, headers, error handling); authorized, non-destructive, read-only

## Database
- SQLite at `prisma/dev.db` (local), `/opt/crossyarn/prisma/prod.db` (prod)
- Schema changes: `npx prisma db push` (no migrations, direct push)
- Never run `prisma migrate` — this project uses `db push` only
- Dev seed: `npx tsx scripts/seed-dev.ts` → `test@crossyarn.local` / `test1234` (admin)

## Auth internals
- **Main site session**: cookie `crossyarn_session` (underscore), 7d expiry, secret = `AUTH_SECRET`
- **Admin session**: cookie `crossyarn-admin`, path `/` (NOT `/admin` — API routes need it), 8h expiry, secret = `AUTH_SECRET + "_admin"`
- Guards: `requireSession()` / `requireUserPage()` (main), `requireAdminPage()` (admin) — all read DB-validated sessions
- Admin user: set `isAdmin: true` in DB manually after first registration

## Admin Panel internals
- URL: `/admin/login`; no links from main site
- Route group `(panel)` protects all admin pages except login
- `ConditionalLayout` hides main Header for `/admin/*` paths

## Symbol System internals
- `PatternSymbol`: `width?`/`height?` (1–6); multi-cell uses `occupiedByAnchor: [row, col]` on non-anchor cells
- Pattern grid uses explicit CSS `grid-row`/`grid-column` (not auto-placement)
- Image limit: 300KB, recommended `width*64 × height*64` px

## i18n
- Translations in `src/lib/i18n/translations.ts` — both `uk` and `en` blocks must be updated together
- Interpolation: `t("key", { variable: value })`

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
