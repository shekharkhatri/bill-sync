export interface AuthUser {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: string | null
}

export type SessionUser = AuthUser & {
  role: string
}

export type PermissionKey =
  | 'project:view'
  | 'project:create'
  | 'project:edit'
  | 'project:archive'
  | 'jira:manage'
  | 'billing:create'
  | 'worklog:edit'
  | 'billing:finalize'
  | 'billing:export'

export interface UserContext {
  user: AuthUser
  permissions: PermissionKey[]
}
