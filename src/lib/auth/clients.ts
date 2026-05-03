import { createServerClient as createSSRServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/lib/env"

/**
 * Use in Server Components to read data.
 * Reads cookies via next/headers (read-only).
 */
export async function createServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createSSRServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // Read-only context — intentionally no-op
      },
    },
  })
}

/**
 * Use inside Server Actions where cookies need to be written
 * (e.g. session refresh after OAuth exchange).
 */
export async function createActionClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createSSRServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Throws in Server Components — safe to swallow here
        }
      },
    },
  })
}

/**
 * Use only for privileged server-side operations that bypass RLS.
 * Never call this from any client-facing code path.
 * Uses SUPABASE_SERVICE_ROLE_KEY.
 */
export function createAdminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
