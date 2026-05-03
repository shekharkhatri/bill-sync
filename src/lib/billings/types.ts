export type BillingStatus = 'draft' | 'reviewed' | 'finalized'

export interface Billing {
  id: string
  projectId: string
  label: string
  startDate: Date
  endDate: Date
  status: BillingStatus
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface BillingWithStats extends Billing {
  totalOriginalHours: number
  totalModifiedHours: number
  worklogCount: number
}

export interface Worklog {
  id: string
  billingId: string
  jiraWorklogId: string
  jiraIssueKey: string
  issueSummary: string | null
  authorName: string
  authorJiraId: string
  workStarted: Date
  originalSeconds: number
  modifiedSeconds: number | null
  originalComment: string | null
  modifiedComment: string | null
  createdAt: Date
  updatedAt: Date
}

export interface WorklogWithEffective extends Worklog {
  effectiveSeconds: number
  effectiveHours: number
  effectiveComment: string | null
  isModified: boolean
}

export type CreateBillingInput = {
  label: string
  startDate: string
  endDate: string
}

export type UpdateWorklogInput = {
  worklogId: string
  modifiedSeconds?: number | null
  modifiedComment?: string | null
}

export type BillingStatusTransition =
  | { from: 'draft'; to: 'reviewed' }
  | { from: 'reviewed'; to: 'finalized' }
  | { from: 'reviewed'; to: 'draft' }

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  draft: 'Draft',
  reviewed: 'Reviewed',
  finalized: 'Finalized',
}

export const BILLING_STATUS_VARIANTS: Record<
  BillingStatus,
  'secondary' | 'outline' | 'default'
> = {
  draft: 'secondary',
  reviewed: 'outline',
  finalized: 'default',
}
