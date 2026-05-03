'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { guardAction } from '@/lib/auth/permissions'
import { getProjectById } from '@/lib/projects/queries'
import { getDecryptedJiraConfig } from '@/lib/jira/queries'
import { fetchWorklogsForProject } from '@/lib/jira/client'
import {
  getBillingById,
  updateBillingStatus,
  checkBillingOverlap,
  insertWorklogs,
} from '@/lib/billings/queries'
import { parseDateString } from '@/lib/billings/date-utils'
import { db } from '@/lib/db/client'
import type { BillingStatus, CreateBillingInput } from '@/lib/billings/types'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

type CreateBillingData = {
  id: string
  warning?: string
  pullStatus: 'success' | 'failed' | 'no_jira_config'
  worklogCount?: number
}

const ALLOWED_TRANSITIONS: Record<BillingStatus, BillingStatus[]> = {
  draft: ['reviewed'],
  reviewed: ['finalized', 'draft'],
  finalized: [],
}

export async function createBillingAction(
  projectId: string,
  input: CreateBillingInput,
): Promise<ActionResult<CreateBillingData>> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'billing:create')
    if (permError) return { success: false, error: permError }

    const project = await getProjectById(projectId)
    if (!project) return { success: false, error: 'Project not found.' }

    const label = input.label.trim()
    if (!label || label.length > 100) {
      return { success: false, error: 'Label must be between 1 and 100 characters.' }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
      return { success: false, error: 'Start date must be in YYYY-MM-DD format.' }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) {
      return { success: false, error: 'End date must be in YYYY-MM-DD format.' }
    }
    if (input.startDate > input.endDate) {
      return { success: false, error: 'Start date must be on or before end date.' }
    }

    const hasOverlap = await checkBillingOverlap(projectId, input.startDate, input.endDate)
    const warning = hasOverlap
      ? 'Date range overlaps with an existing billing period for this project.'
      : undefined

    const startDate = parseDateString(input.startDate)
    const endDate = parseDateString(input.endDate)

    const newBilling = await db
      .insertInto('billings')
      .values({
        project_id: projectId,
        label,
        start_date: startDate,
        end_date: endDate,
        status: 'draft',
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    revalidatePath(`/projects/${projectId}`)

    // Auto-pull worklogs after creation
    let pullStatus: CreateBillingData['pullStatus'] = 'failed'
    let worklogCount: number | undefined

    const jiraConfig = await getDecryptedJiraConfig(projectId)
    if (!jiraConfig) {
      pullStatus = 'no_jira_config'
    } else {
      try {
        const entries = await fetchWorklogsForProject(jiraConfig, startDate, endDate)
        await insertWorklogs(newBilling.id, entries)
        revalidatePath(`/projects/${projectId}/billings/${newBilling.id}`)
        pullStatus = 'success'
        worklogCount = entries.length
      } catch (err) {
        console.error('[createBillingAction] Auto-pull failed:', err)
        pullStatus = 'failed'
      }
    }

    return {
      success: true,
      data: { id: newBilling.id, warning, pullStatus, worklogCount },
    }
  } catch (err) {
    console.error('[createBillingAction] Unexpected error:', err)
    return { success: false, error: 'Failed to create billing period.' }
  }
}

export async function pullWorklogsAction(
  billingId: string,
): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'billing:create')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    if (billing.status !== 'draft') {
      return { success: false, error: 'Worklogs can only be pulled for draft billings.' }
    }

    const config = await getDecryptedJiraConfig(billing.projectId)
    if (!config) {
      return { success: false, error: 'No Jira configuration found for this project.' }
    }

    const entries = await fetchWorklogsForProject(config, billing.startDate, billing.endDate)
    await insertWorklogs(billingId, entries)

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)

    return { success: true, data: { count: entries.length } }
  } catch {
    return { success: false, error: 'Failed to pull worklogs from Jira.' }
  }
}

export async function updateBillingStatusAction(
  billingId: string,
  status: BillingStatus,
): Promise<ActionResult> {
  try {
    const user = await requireSession()

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    const current = billing.status
    const allowed = ALLOWED_TRANSITIONS[current]
    if (!allowed.includes(status)) {
      return { success: false, error: 'Invalid status transition.' }
    }

    const permKey =
      status === 'draft' ? ('billing:create' as const) : ('billing:finalize' as const)
    const permError = await guardAction(user.id, permKey)
    if (permError) return { success: false, error: permError }

    await updateBillingStatus(billingId, status)

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)
    revalidatePath(`/projects/${billing.projectId}`)

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to update billing status.' }
  }
}
