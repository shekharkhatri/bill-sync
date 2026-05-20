import type { BillingStatus } from '@/lib/billings/types'

export interface BillingShareToken {
  id: string
  billingId: string
  token: string
  createdBy: string | null
  createdAt: Date
  expiresAt: Date | null
  isActive: boolean
  csvEnabled: boolean
}

export interface SharedBillingView {
  billing: {
    id: string
    label: string
    startDate: Date
    endDate: Date
    status: BillingStatus
    totalOriginalHours: number
    totalModifiedHours: number
  }
  project: {
    name: string
    clientName: string
  }
  tasks: SharedTaskRow[]
  generatedAt: Date
  tokenId: string
  csvEnabled: boolean
}

export interface SharedTaskRow {
  displaySummary: string
  displayIssueKey: string | null
  effectiveHours: number
  isManual: boolean
}
