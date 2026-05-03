export interface Project {
  id: string
  name: string
  clientName: string
  description: string | null
  color: string | null
  status: 'active' | 'archived'
  createdBy: string | null
  createdAt: Date
  deletedAt: Date | null
}

export interface ProjectWithJiraStatus extends Project {
  hasJiraConfig: boolean
  jiraProjectKey: string | null
  jiraVerified: boolean | null
}

export type CreateProjectInput = {
  name: string
  clientName: string
  description?: string
  color?: string
}

export type UpdateProjectInput = Partial<CreateProjectInput>

export type ProjectColor =
  | 'slate'
  | 'blue'
  | 'violet'
  | 'amber'
  | 'emerald'
  | 'rose'

export const PROJECT_COLORS: Record<ProjectColor, string> = {
  slate:   'bg-slate-500',
  blue:    'bg-blue-500',
  violet:  'bg-violet-500',
  amber:   'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose:    'bg-rose-500',
}
