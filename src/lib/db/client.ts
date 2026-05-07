// This is the single database access point for the entire application.
// To move from Supabase to self-hosted Postgres, change DATABASE_URL only. No other code changes required.
import { Pool } from "pg"
import { Kysely, PostgresDialect } from "kysely"
import { DATABASE_URL } from "@/lib/env"
import type { Database } from "@/lib/db/types"

// Singleton keeps the pool alive across Next.js HMR reloads in dev,
// preventing connection exhaustion against Supabase's session-mode cap.
const globalForDb = globalThis as unknown as { _pgPool?: Pool }

const pool = globalForDb._pgPool ?? new Pool({ connectionString: DATABASE_URL, max: 5 })
if (process.env.NODE_ENV !== "production") globalForDb._pgPool = pool

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
})
