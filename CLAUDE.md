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
- **Bucket fill** (`isFillMode`/`fillCells` in store, toggle button in sidebar, F key, Esc exits): 4-connected flood fill over cells matching the clicked (symbolId, color); multi-cell symbols act as barriers and can't be the fill symbol (toast); one undo step; mutually exclusive with selection/rapport-insert modes
- Resize via W×H inputs; +/− buttons on all four grid edges (add/remove row/column, min 1×1)
- Multi-cell symbols up to 20×20 (`MAX_SYMBOL_SPAN` in `model.ts`) (`occupiedByAnchor` mechanism, explicit CSS grid placement)
- **Zoom**: ± toolbar + Ctrl+scroll, 40%–250% (`zoomLevel` in store, scales cell px)
- **Keyboard shortcuts**: Ctrl+Z/Y undo/redo, Esc exits selection/insert modes, 1–9 picks a palette symbol, +/− zoom (ignored while typing in inputs)
- **Rapports** (repeating motifs): select area → save named rapport → insert anywhere with 4 mirror variants (as-is / H / V / both, `mirrorRapportCells`); stored in `PatternDocument.rapports[]`; auto-clips at edges; multi-cell symbols expand selection bounds automatically
- **Skip purl rows** (`view.skipPurlRows`): hides even rows, numbering 1,3,5...; symbols anchored in a hidden row project onto the next visible row; applied in editor, print, SVG/PDF

### Patterns (`/patterns`)
- CRUD + duplicate (`POST /api/patterns/[id]/duplicate`), search
- Print page `/patterns/[id]/print` (browser print, multi-cell aware)
- SVG export `/api/exports/[id]` (titles RFC-5987 encoded; legend lists only used symbols, excludes "empty"); PDF download rasterizes that SVG to PNG then embeds it (`src/lib/export/pdf-export.ts`)
- Version history: `PatternVersion` snapshot on pattern create + every PUT (autosave); editor sidebar `VersionHistory` — `GET /api/patterns/[id]/versions` (last 10), `GET .../versions/[versionId]` (snapshot preview), `POST .../versions/[versionId]/restore` (restore creates a new version)

### Symbols
- 28 builtin symbols (`DEFAULT_SYMBOLS` in `model.ts`, base64 SVG icons in `builtin-icons.ts`)
- User custom symbols (account page, image ≤300KB, sizes 1×1 to 20×20)
- Official symbols: `UserSymbol.isOfficial = true`, served to all users via `getOfficialSymbols()`
- Builtin overrides: admin can edit builtin symbols — `UserSymbol.builtinId` record overrides the code default globally (`getBuiltinOverrides()` merge in `getAvailableSymbols()`)

### Admin panel (`/admin`, fully isolated from main site)
- Users management (list, details, block/unblock), official + builtin symbols editing, stats dashboard

### Auth & security
- Sign-in/sign-up, bcrypt, rate limiting 5/min per IP (`src/lib/auth/rate-limit.ts`); IP from trusted rightmost `X-Forwarded-For` hop (`getClientIp`)
- Password reset: `/forgot-password` → `POST /api/auth/forgot-password` (Resend, needs `RESEND_API_KEY`; hashed `User.resetToken` + `resetTokenExpiry`), `/reset-password` → `POST /api/auth/reset-password` (token consumed, nulled after use)
- Sessions re-validated against the DB on every request: `getSession` rejects `isDisabled`, `getAdminSession` rejects non-`isAdmin`/`isDisabled` (blocked/demoted users lose access immediately, not after token expiry)
- **Rate limits** (`src/lib/auth/rate-limit.ts`, in-memory, single PM2 process): `limitWrite(userId, "save"|"write"|"create")` on every authed write route (120/min, 60/min, 60/h); sign-up 5/h and reset-password 10/h per IP. IP-based limits are only sound because Next binds **127.0.0.1** (`HOSTNAME=127.0.0.1` in pm2) and Caddy is the sole entry — never bind 0.0.0.0.
- **Sessions** carry `sv` = `User.sessionVersion`; reset-password increments it → all user/admin sessions die (tokens without `sv` count as 0). Sign-out routes reject cross-site requests (`isSameOriginRequest`).
- **Symbol images** must pass `isSafeImageDataUri` (base64 data URI only) — `PatternGrid` emits each image once as a CSS class and the SVG export once in `<defs>`; never inline `imageData` per cell again (that was an anonymous DoS). Pattern docs must be height×width, ≤4MB of images.
- Limits: tags ≤40 chars / ≤20 per pattern; ≤10 `PatternVersion`s per pattern (`pruneVersions`); Caddy `request_body max_size 10MB` (prod `/etc/caddy/Caddyfile`). Import uploads: magic-byte check, deleted on save (`DELETE /api/imports/[id]`) or after 24h.
- All write APIs validate with zod (`src/lib/patterns/validation.ts`); `POST /api/patterns` uses a bounded schema (width/height ≤200) so oversized requests can't OOM; cell colors / palette hex constrained to hex format; `cell.color` escaped in SVG export (closed a stored-XSS vector)

### Public profiles & sharing
- **User profile** (`User.username`/`bio`/`location`/`website`/`profilePublic`): edited on `/account` (`ProfileEditor` → `PATCH /api/profile`). `username` is a unique lowercased handle (3–30 `[a-z0-9_]`, reserved-name list in `src/lib/profile/validation.ts`); `profilePublic` defaults **false** (private-by-default, must opt in). `website` is normalized to a safe http(s) URL server-side (`normalizeWebsite`, blocks `javascript:` etc.). Making a profile public requires a username.
- **Public profile page** `/u/[username]` (server, SEO metadata): shows name/bio/location/website + the author's **PUBLIC** patterns. 404s if the profile is private or the handle is free. Never exposes email.
- **Pattern visibility** (`Pattern.visibility` PRIVATE/UNLISTED/PUBLIC): edited via `VisibilityControl` on `/patterns/[id]` → `PATCH /api/patterns/[id]/visibility` (also accepted optionally by the editor's PUT). Card badge is localized.
- **Public read-only pattern** `/p/[id]` (server): renders the grid+legend read-only via shared `PatternGrid`/`PatternLegend` (extracted from `PrintContent`). PRIVATE → owner-only (else 404); UNLISTED → link-only + `robots noindex,nofollow`; PUBLIC → indexed + listed on the author's profile.
- **Public catalog** `/explore` (server, in header nav): all PUBLIC patterns, newest first; title search via `?q=` — SQL `OR` over `title`, `titleTranslit` and `tags` (all case-insensitive, so Cyrillic works in SQL now), tag filter `?tag=` with a filter bar built from all tags in the PUBLIC set, `?page=` pagination 24/page. Author attribution only when `profilePublic` (same rule as `/p/[id]`). Tags UI: editor sidebar (add/remove chips → `POST /api/patterns/[id]/tags`), `Pattern.tags` is a JSON string (SQLite has no `String[]`).
- **Pattern thumbnails** `GET /api/patterns/[id]/thumbnail` (`src/lib/export/pattern-thumbnail.ts`): compact grid-only SVG — RLE-merged color runs + text glyphs (never the base64 icons of the full export), 8k element budget with block downsample for huge grids. Access mirrors `/p/[id]` (PRIVATE owner-only 404, no-store; public cached 1h). Used by `/explore`, `/u/[username]` and own `/patterns` cards with `?v=<updatedAt ms>` cache-buster.
- **Avatars** (`User.avatarData` data URI ≤150KB): client center-crops to 256×256 JPEG in `ProfileEditor` before upload; `validateAvatar` enforces type + decoded size. Served binary via `GET /api/users/[username]/avatar` (public profiles only, 1h cache); `/u/[username]` falls back to the initial-letter circle. Shown as author chips on `/explore` cards and as the signed-in user's header circle via `GET /api/me/avatar` (session-scoped, `Vary: Cookie`, 5m cache).
- **SEO**: `/sitemap.xml` (hourly revalidate; PUBLIC patterns + public profiles), `/robots.txt` (blocks authed areas, allows public thumbnails), `metadataBase` + OG tags on `/p`, `/u`, `/explore` (canonical origin in `src/lib/site.ts`).
- **og:image** for `/p/[id]`: file-convention `opengraph-image.tsx` renders a 1200×630 PNG via `next/og` ImageResponse — pattern preview (thumbnail SVG in font-free `glyphs: "dot"` mode, embedded as data URI) + title text using `public/fonts/NotoSans-SemiBold.ttf` (Cyrillic-capable; read from `process.cwd()/public`, which works in dev and standalone because deploy copies `public/` and server.js chdirs). PRIVATE always 404s; falls back to a text-free card if the font is missing.
- **Knitting mode** on `/p/[id]` (client-only, no DB): `useKnittingProgress` in `src/lib/patterns/knitting-progress.ts` stores `{row, active}` in localStorage `crossyarn:knit:<patternId>`; rows = chart numbers (1 = bottom), skip-purl steps over odd rows. `KnittingModeBar` (prev/next, %, reset, ← → ↑ ↓ keys) + `PatternGrid` optional `highlightRow`/`onRowClick` (row ring overlay `data-knit-current-row`, knitted rows at opacity .35; print page passes neither).
- **Likes / saved** (`PatternLike` model, `@@unique([userId, patternId])`): `POST`/`DELETE /api/patterns/[id]/like` (idempotent, returns `{liked, count}`; likeable = viewable, same rule as `/p/[id]`). `LikeButton` client component (optimistic, redirects signed-out users to `/sign-in`) on `/p/[id]` header and `/explore` cards (counts fetched per page via one `groupBy`). `/saved` (authed, noindex, in header nav only when signed in): user's liked patterns, 24/page, unlike removes the card; likes of patterns flipped back to PRIVATE are hidden but kept.

### Not yet implemented
- Image import end-to-end in prod (sidecar not deployed), WayForPay billing provider, ads

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
- `PatternSymbol`: `width?`/`height?` (1–20); multi-cell uses `occupiedByAnchor: [row, col]` on non-anchor cells
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

## Ведення STATUS.md
Наприкінці кожної робочої сесії ОБОВ'ЯЗКОВО онови STATUS.md:
- перенеси виконане з Next у Done recently (тримай там останні ~5 пунктів)
- додай нові задачі в Next, тримай список у пріоритетному порядку (3-7 пунктів)
- онови Blocked (додай нові блокери, прибери вирішені)
Пиши коротко, одним рядком на пункт, українською.
