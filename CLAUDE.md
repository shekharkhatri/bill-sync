@AGENTS.md

# BillSync — Claude Context

## Abbreviations
SC = Server Component | CC = Client Component | SA = Server Action
RH = Route Handler | KC = Kysely client (src/lib/db/client.ts) | DB = Postgres/Supabase
JA = Jira API v3 Cloud | PM = pnpm (always, never npm/yarn)

## Stack
| Layer     | Choice                         | Notes                               |
|-----------|--------------------------------|-------------------------------------|
| Framework | Next.js App Router + TS strict | all imports via @/* alias           |
| DB        | Supabase Postgres              | swap = change DATABASE_URL only     |
| Query     | Kysely (no ORM)                | single instance: src/lib/db/client  |
| Auth      | Supabase Auth + @supabase/ssr  | Google OAuth only                   |
| UI        | Shadcn/ui + Tailwind           | no inline styles, no custom CSS     |
| Jira      | REST API v3 Cloud              | server-side only, never from CC     |
| Deploy    | Vercel                         | pnpm build                          |

## Rules (non-negotiable)
1. PM only — never npm or yarn
2. All DB queries via KC only — never supabase.from() for data
3. Jira calls: server-side only — never import lib/jira/* in CC
4. Session: requireSession() or getUserContext() — never client state
5. No `any` — use `unknown` + narrow. Explicit return types on all exports
6. Tailwind only — no inline styles except dynamic % widths
7. SA: wrap in try/catch, return ActionResult<T>. Never throw from SA
8. SC default — CC only for interactive UI (forms, dialogs, toggles)
9. lib/crypto/* and lib/jira/*: SERVER ONLY — never import in CC
10. Update /docs/* on every structural change (see Doc Update Protocol below)

## ActionResult Pattern
```ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```
Every SA returns this. On error: `return { success: false, error: '...' }` — never throw.

## Quick Reference
| Need                        | Go to             |
|-----------------------------|-------------------|
| Env vars                    | docs/env.md       |
| DB schema & table map       | docs/schema.md    |
| Auth flow & RBAC            | docs/auth.md      |
| Jira API rules & pagination | docs/jira.md      |
| File/folder structure       | docs/structure.md |
| SC/CC patterns & slots      | docs/components.md|
| Billing logic & editor      | docs/billing.md   |
| API route handlers          | docs/api.md       |

## Doc Update Protocol
On every prompt that changes the codebase, update affected docs:

| Change type                     | Update                                |
|---------------------------------|---------------------------------------|
| New table or column             | docs/schema.md                        |
| New env var                     | docs/env.md                           |
| New file or folder              | docs/structure.md                     |
| New component                   | docs/structure.md + docs/components.md|
| New SA or query function        | docs/billing.md or docs/jira.md       |
| New API route                   | docs/api.md                           |
| Auth flow change                | docs/auth.md                          |
| Jira client or config change    | docs/jira.md                          |
| Permission key added            | docs/auth.md + lib/auth/types.ts      |
| Billing logic change            | docs/billing.md                       |
| Abbreviation or rule change     | CLAUDE.md                             |

Rules: edit only the relevant section · keep table/symbol format · add rows not paragraphs
Confirm at end of response: "Docs updated: {files}"

## Build Status
| Batch | Area                               | Status    |
|-------|------------------------------------|-----------|
| 1     | Scaffold, Kysely, DB schema        | ✓ done    |
| 2     | Supabase Auth, Google OAuth        | ✓ done    |
| 3     | RBAC, permissions, UserContext     | ✓ done    |
| 4     | Projects module                    | ✓ done    |
| 5     | Jira integration, crypto, settings | ✓ done    |
| 6     | Live hours, overview panel         | ✓ done    |
| 7     | Billing module, worklog pull       | ✓ done    |
| 8     | Worklog editor, status workflow    | ✓ done    |
| 9     | CSV export, ExportButton, export_logs | ✓ done  |
| 10    | Polish, toasts, error boundaries   | ⏳ pending |
| HF    | Jira POST /search/jql + pagination | ✓ done    |
| HF    | Billing editor UI overhaul         | ✓ done    |
| HF    | Manual rows, row-level summary edit| ✓ done    |
| HF    | Dev auth bypass (existing user)    | ✓ done    |
| HF    | Shareable billing invoice links    | ✓ done    |

## Known Pending
- Batch 10: Toaster in layout, error boundaries on all pages
- getLiveProjectHours: legacy, kept alongside getProjectOverviewData
