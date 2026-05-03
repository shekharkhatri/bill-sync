import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import type { PermissionKey } from '@/lib/auth/types'

interface PermissionGuardProps {
  permission: PermissionKey
  children: React.ReactNode
  fallback?: React.ReactNode
}

export async function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps): Promise<React.JSX.Element> {
  const context = await getUserContext()
  if (!hasPermission(context, permission)) return <>{fallback}</>
  return <>{children}</>
}
