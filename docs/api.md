# API Routes

## Route Handlers
| Method | Path                      | Auth | Purpose                         |
|--------|---------------------------|------|---------------------------------|
| GET    | /api/auth/callback        | —    | OAuth code exchange + bootstrap |

Pending (Batch 9):
| GET    | /api/billings/[id]/export | ✓    | xlsx file download              |

All other mutations go through Server Actions (not RH).

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

## No RH for Mutations
All create/update/delete operations use Server Actions.
RH is only used when a binary response (file download) or OAuth exchange is needed.
