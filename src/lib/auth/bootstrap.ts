import type { User } from "@supabase/supabase-js"
import { db } from "@/lib/db/client"
import { isEmailAllowed } from "@/lib/auth/allowlist"

/**
 * Called once per login after OAuth exchange. Safe to call multiple times.
 */
export async function bootstrapUser(supabaseUser: User): Promise<void> {
  if (!supabaseUser.email || !(await isEmailAllowed(supabaseUser.email))) {
    console.warn(
      `[bootstrap] Blocked attempt to bootstrap non-allowlisted email: ${supabaseUser.email}`
    )
    return
  }

  try {
    const existing = await db
      .selectFrom("users")
      .select("id")
      .where("id", "=", supabaseUser.id)
      .executeTakeFirst()

    if (existing) return

    const meta = supabaseUser.user_metadata as Record<string, unknown>
    const name =
      typeof meta.full_name === "string"
        ? meta.full_name
        : typeof meta.name === "string"
          ? meta.name
          : null
    const avatarUrl =
      typeof meta.avatar_url === "string" ? meta.avatar_url : null

    await db
      .insertInto("users")
      .values({
        id: supabaseUser.id,
        email: supabaseUser.email,
        name,
        avatar_url: avatarUrl,
      })
      .execute()

    const adminRole = await db
      .selectFrom("roles")
      .select("id")
      .where("name", "=", "admin")
      .executeTakeFirst()

    if (adminRole) {
      await db
        .insertInto("user_roles")
        .values({
          user_id: supabaseUser.id,
          role_id: adminRole.id,
        })
        .execute()
    }
  } catch (err) {
    console.error("[bootstrapUser] Failed to bootstrap user:", {
      userId: supabaseUser.id,
      email: supabaseUser.email,
      error: err,
    })
  }
}
