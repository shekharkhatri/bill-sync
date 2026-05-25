# API Routes

## Route Handlers
| Method | Path                                    | Auth   | Purpose                                              |
|--------|-----------------------------------------|--------|------------------------------------------------------|
| GET    | /api/auth/callback                      | —      | OAuth code exchange + bootstrap                      |
| GET    | /api/billings/[id]/export               | ✓      | CSV download, logs to export_logs                    |
| GET    | /api/share/[token]/export               | public | CSV export via share token, logs format='csv-shared' |
| POST   | /api/share/[token]/verify-password      | public | Verify share link password, issue HttpOnly cookie    |

All other mutations go through Server Actions (not RH).

## Export Route Detail
Auth: session check (`supabase.auth.getUser()`) + `guardAction('billing:export')`
Available: `billing.status` in `('reviewed', 'finalized')`
Output: `text/csv; charset=utf-8`, `Content-Disposition: attachment`
Filename: `{client}-{label}-billing.csv`
Logging: inserts into `export_logs` (fire and forget, non-blocking)
Builder: `src/lib/export/csv.ts` → `buildBillingCSV()`

## Auth Callback (/api/auth/callback/route.ts)
```
1. exchangeCodeForSession(code)          ← from URL ?code=
2. getUser()
3. isEmailAllowed(email) → false: signOut + redirect /login?error=not_authorized
4. bootstrapUser(user)                   ← upsert users row, assign role if new
5. redirect /dashboard
```
On any error: redirect `/login?error=server_error`.

## Error Responses
All RH return `Response.json({ error: string }, { status: N })`.
401 if no session · 403 if insufficient permission · 404 if not found · 500 on throw.

## Share Token Export Detail (/api/share/[token]/export)
Auth: token-based only — no session. `getSharedBillingView()` validates token.
Token invalid/revoked/expired → 403. Never reveal why (treat all as same error).
`csv_enabled=false` on token → 403 `"CSV export is not enabled for this shared link."` (checked before building CSV).
Output columns: Task, Jira Issue, Hours — no original hours, no internal notes, no status.
Filename: `{client}-{label}-worklog.csv`
Builder: `src/lib/export/csv.ts` → `buildSharedBillingCSV()`
Rate limiting: not yet implemented — see comment in `src/app/api/share/[token]/export/route.ts`.

## Share Token Routes (Public)
Auth: token-based only — no session. `getSharedBillingView()` validates token.
Token invalid/revoked/expired → 403. Never reveal why (treat all as same error).
Rate limiting: not yet implemented — see comment in `src/app/api/share/[token]/export/route.ts`.

## Verify Password Route Detail (/api/share/[token]/verify-password)
Auth: none (public endpoint).
Body: `{ password: string }`.
Validates token is active, passwordEnabled, checks bcrypt hash.
On success: issues `share_auth_{token[0:8]}` HttpOnly cookie (HMAC-SHA256 signed, 24h Max-Age, Path=/share/{token}).
Responses: 200 `{ok:true}` | 400 (missing/invalid body, not password-protected) | 401 (wrong password) | 404 (token not found/inactive).

## No RH for Mutations
All create/update/delete operations use Server Actions.
RH is only used when a binary response (file download), OAuth exchange, or cookie-setting (password verify) is needed.
