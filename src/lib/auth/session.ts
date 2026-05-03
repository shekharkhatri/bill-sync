import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/auth/clients"
import { db } from "@/lib/db/client"
import type { AuthUser } from "@/lib/auth/types"

export async function getUser(): Promise<User | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireSession(): Promise<User> {
  const user = await getUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function getUserWithRole(): Promise<AuthUser | null> {
  const user = await getUser()
  if (!user) return null

  const row = await db
    .selectFrom("users as u")
    .leftJoin("user_roles as ur", "ur.user_id", "u.id")
    .leftJoin("roles as r", "r.id", "ur.role_id")
    .select([
      "u.id",
      "u.email",
      "u.name",
      "u.avatar_url",
      "r.name as role",
    ])
    .where("u.id", "=", user.id)
    .executeTakeFirst()

  if (!row) return null

  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    avatarUrl: row.avatar_url ?? null,
    role: row.role ?? null,
  }
}
