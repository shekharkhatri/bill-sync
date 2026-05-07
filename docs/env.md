# Env Vars

## Variables
| Variable                      | Used in                  | Notes                              |
|-------------------------------|--------------------------|-------------------------------------|
| NEXT_PUBLIC_SUPABASE_URL      | lib/auth/clients.ts      | public, browser-safe               |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | lib/auth/clients.ts      | public, browser-safe               |
| SUPABASE_SERVICE_ROLE_KEY     | lib/auth/clients.ts      | server only — never expose         |
| DATABASE_URL                  | lib/db/client.ts         | pg Pool conn string                |
| ENCRYPTION_KEY                | lib/crypto/encryption.ts | 32-byte hex, AES-256-GCM key       |
| NEXT_PUBLIC_APP_URL           | lib/auth/actions.ts      | OAuth redirect base URL            |
| DEV_BYPASS_EMAIL              | lib/auth/actions.ts      | dev only — email for `signInDev()`, defaults to `shekhar@thehivecraft.com` |

## Validation
src/lib/env.ts → `validateEnv()` runs at module load, throws on missing required vars.
Exports typed consts: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`DATABASE_URL`, `ENCRYPTION_KEY`, `APP_URL`.

Import from env.ts — never call `process.env` directly elsewhere in the codebase.
