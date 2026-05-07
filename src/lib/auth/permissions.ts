import { cache } from 'react'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { PermissionKey, UserContext } from '@/lib/auth/types'

const ALL_PERMISSIONS: PermissionKey[] = [
  'project:view', 'project:create', 'project:edit', 'project:archive',
  'jira:manage', 'billing:create', 'worklog:edit', 'billing:finalize', 'billing:export',
]

/**
 * Returns the current user with their resolved permission list.
 * Cached per request — safe to call multiple times in one render pass.
 * Redirects to /login if the session is missing or the user record is absent.
 */
export const getUserContext = cache(async (): Promise<UserContext> => {
  const supabaseUser = await requireSession()

  const userRow = await db
    .selectFrom('users as u')
    .leftJoin('user_roles as ur', 'ur.user_id', 'u.id')
    .leftJoin('roles as r', 'r.id', 'ur.role_id')
    .select(['u.id', 'u.email', 'u.name', 'u.avatar_url', 'r.name as role'])
    .where('u.id', '=', supabaseUser.id)
    .executeTakeFirst()

  if (!userRow) redirect('/login')

  const permRows = await db
    .selectFrom('permissions as p')
    .innerJoin('role_permissions as rp', 'rp.permission_id', 'p.id')
    .innerJoin('user_roles as ur', 'ur.role_id', 'rp.role_id')
    .select('p.key')
    .where('ur.user_id', '=', supabaseUser.id)
    .execute()

  return {
    user: {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name ?? null,
      avatarUrl: userRow.avatar_url ?? null,
      role: userRow.role ?? null,
    },
    permissions: permRows.map((r) => r.key as PermissionKey),
  }
})

export function hasPermission(context: UserContext, permission: PermissionKey): boolean {
  return context.permissions.includes(permission)
}

/**
 * Checks a permission inside a Server Action.
 * Returns null if allowed, or an error string if denied.
 * Query is direct (not cached) since Server Actions run outside RSC render.
 */
export async function guardAction(
  userId: string,
  permission: PermissionKey,
): Promise<string | null> {
  try {
    const row = await db
      .selectFrom('permissions as p')
      .innerJoin('role_permissions as rp', 'rp.permission_id', 'p.id')
      .innerJoin('user_roles as ur', 'ur.role_id', 'rp.role_id')
      .select('p.key')
      .where('ur.user_id', '=', userId)
      .where('p.key', '=', permission)
      .executeTakeFirst()

    return row ? null : 'You do not have permission to perform this action'
  } catch (err) {
    console.error('[guardAction] Permission check failed:', err)
    return 'Permission check failed'
  }
}
