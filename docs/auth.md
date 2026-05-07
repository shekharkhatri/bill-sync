# Auth

## Login Flow
Browser → /login → signInWithGoogle() SA → Supabase OAuth → Google
→ /api/auth/callback → exchangeCodeForSession(code) → getUser()
→ isEmailAllowed(email): if false → signOut + redirect /login?error=not_authorized
→ bootstrapUser(user): upsert users row, assign default role if new
→ redirect /dashboard

## Route Protection
src/middleware.ts (NOT proxy.ts).
Matcher: all routes except /login, /api/auth/callback, static assets.
Uses `supabase.auth.getUser()` (validates JWT server-side, not just cookie read).

## Supabase Client Factories (src/lib/auth/clients.ts)
| Function              | Use in           | Cookie mode  |
|-----------------------|------------------|--------------|
| createServerClient()  | SC data fetches  | read-only    |
| createActionClient()  | SA / RH          | read + write |
| createAdminClient()   | bootstrap only   | service role |

## Session Helpers (src/lib/auth/session.ts)
| Function          | Returns          | On no session |
|-------------------|------------------|---------------|
| getSession()      | Session \| null  | returns null  |
| requireSession()  | Session          | redirect /login|
| getUserContext()  | UserContext      | redirect /login|

`getUserContext()` = requireSession + getUserWithRole + getUserPermissions in parallel.
Use this as the single call at the top of every protected page.

## Allowlist (src/lib/auth/allowlist.ts)
Table: `allowed_emails`. Check: `isEmailAllowed(email): Promise<boolean>`.
Fails closed on DB error (returns false). Secondary guard inside bootstrapUser().

## RBAC (src/lib/auth/permissions.ts)
| Function                          | Use case                              |
|-----------------------------------|---------------------------------------|
| hasPermission(ctx, key)           | conditional UI rendering in SC        |
| guardAction(userId, key)          | first call in every SA after session  |
| getUserPermissions(userId)        | fetches all permissions at once       |

`guardAction` returns `null` if allowed, error string if denied.
Call pattern in SA:
```ts
const user = await requireSession()
const permError = await guardAction(user.id, 'billing:create')
if (permError) return { success: false, error: permError }
```

## Permission Keys (src/lib/auth/types.ts)
```
project:view | project:create | project:edit | project:archive
jira:manage | billing:create | worklog:edit | billing:finalize | billing:export
```

## Dev Bypass (development only)
Allows signing in without Google OAuth using an existing Supabase user's email + password.
Only rendered/executed when `NODE_ENV === "development"`.

| Item                       | Detail                                                                        |
|----------------------------|-------------------------------------------------------------------------------|
| SA                         | `signInDev()` in `src/lib/auth/actions.ts`                                   |
| Guard                      | First line: `if (NODE_ENV !== 'development') redirect /login?error=not_available` |
| Email                      | `DEV_BYPASS_EMAIL` from `env.ts` (defaults to `shekhar@thehivecraft.com`)    |
| Auth method                | Admin `generateLink({ type: 'magiclink' })` → `verifyOtp({ token_hash })` — no password, no email sent |
| UI                         | Amber dashed section in login page, hidden in production (`isDev` guard)     |
| Error codes                | `not_available`, `dev_auth_failed`                                            |

The resulting session is identical to a Google login session — all middleware, RBAC, and session helpers behave the same.
