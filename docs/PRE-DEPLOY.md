# Pre-Deploy Verification Rules

Push to `main` = instant production deploy (crossyarn.online). Never push without completing these steps.

## 1. Static checks

```bash
npm run build    # 0 TypeScript errors required
```

## 2. UI verification via Playwright MCP

**Preferred: delegate to the `site-verifier` subagent** (defined in `c:\Projects\Work\.claude\agents\site-verifier.md`).
Pass it a description of what was changed; it starts the dev server, seeds data, logs in,
walks the affected flows, checks console/network, and returns a SAFE TO DEPLOY / DO NOT DEPLOY verdict.
**Do not push if the verdict is DO NOT DEPLOY.**

Manual fallback (same data the subagent uses):
- Dev server: `npm run dev` in background (http://localhost:3000)
- Test login: `test@crossyarn.local` / `test1234` (admin, seeded)
- Re-seed if needed: `npx tsx scripts/seed-dev.ts` (idempotent)
- Seeded "Test Pattern" (24×24) contains knit, purl, and a multi-cell cable-4 symbol

**Verify every flow touched by the change.** Minimum smoke set by area:

| Area changed | What to check in browser |
|---|---|
| Editor (`pattern-editor.tsx`, `editor-state.ts`) | open `/editor/[id]`, paint a cell, undo/redo, autosave badge turns "Збережено" |
| Multi-cell symbols | place cable-4, check it spans 4 cols; paint over it — fully cleared |
| Rapports | select area, save rapport, insert it elsewhere; near edge — auto-clips |
| Skip purl rows | toggle flag — even rows hide, numbering 1,3,5..., row count unchanged |
| Grid resize | +/− buttons on all four edges work; − stops at 1×1 |
| Print/PDF/SVG | open `/patterns/[id]/print`, click PDF — file downloads; open `/api/exports/[id]` — valid SVG |
| Auth | sign-in with test user, sign-out; wrong password shows error |
| Admin | `/admin/login`, check changed admin page; symbols page loads without "Unauthorized" |
| API routes | trigger via UI, check Network tab for non-2xx |

Additional rules:
- Always check browser console for errors after each flow (warnings — note, errors — failure)
- Autosave is debounced 1.2s — wait for the badge before judging save behavior
- Schema changes (`schema.prisma`): run `npx prisma db push` locally first, verify the affected flow; remember prod uses `--accept-data-loss`

## 3. Only then

```bash
git add <files> && git commit && git push origin main
```

After push: GitHub Actions must go green; spot-check crossyarn.online if the change is risky.

## Dev test data

- `scripts/seed-dev.ts` — idempotent; creates admin test user + "Test Pattern" with multi-cell symbol
- Credentials: `test@crossyarn.local` / `test1234` — dev only, never create on prod
