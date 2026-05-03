// This is the single database access point for the entire application.
// To move from Supabase to self-hosted Postgres, change DATABASE_URL only. No other code changes required.
import { Pool } from "pg"
import { Kysely, PostgresDialect } from "kysely"
import { DATABASE_URL } from "@/lib/env"
import type { Database } from "@/lib/db/types"

const pool = new Pool({ connectionString: DATABASE_URL })

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
})
