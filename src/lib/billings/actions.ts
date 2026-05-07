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
  bulkUpdateWorklogs,
  resetAllWorklogs,
  deleteBilling,
  insertManualTask,
  updateTaskSummary,
  deleteManualTask,
  updateWorklogSummary,
  deleteWorklogRow,
} from '@/lib/billings/queries'
import { parseDateString } from '@/lib/billings/date-utils'
import { db } from '@/lib/db/client'
import type { AddManualTaskInput, BillingStatus, CreateBillingInput, UpdateWorklogInput } from '@/lib/billings/types'

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

export async function saveWorklogsAction(
  billingId: string,
  updates: UpdateWorklogInput[],
): Promise<ActionResult<{ savedCount: number }>> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'worklog:edit')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    if (billing.status !== 'draft') {
      return { success: false, error: 'Worklogs can only be edited in draft status.' }
    }

    for (const update of updates) {
      if (!update.worklogId || typeof update.worklogId !== 'string') {
        return { success: false, error: `Invalid worklogId: "${update.worklogId}".` }
      }
      if (update.modifiedSeconds !== undefined && update.modifiedSeconds !== null) {
        if (update.modifiedSeconds < 0 || update.modifiedSeconds > 86400) {
          return {
            success: false,
            error: `modifiedSeconds for worklog "${update.worklogId}" must be between 0 and 86400.`,
          }
        }
      }
      if (update.modifiedComment !== undefined && update.modifiedComment !== null) {
        if (update.modifiedComment.length > 1000) {
          return {
            success: false,
            error: `modifiedComment for worklog "${update.worklogId}" exceeds 1000 characters.`,
          }
        }
      }
    }

    await bulkUpdateWorklogs(billingId, updates)

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)

    return { success: true, data: { savedCount: updates.length } }
  } catch {
    return { success: false, error: 'Failed to save worklogs.' }
  }
}

export async function resetAllWorklogsAction(billingId: string): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'worklog:edit')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    if (billing.status !== 'draft') {
      return { success: false, error: 'Cannot reset worklogs — billing is not in draft.' }
    }

    await resetAllWorklogs(billingId)

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to reset worklogs.' }
  }
}

export async function deleteBillingAction(billingId: string): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'billing:create')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    if (billing.status !== 'draft') {
      return { success: false, error: 'Only draft billings can be deleted.' }
    }

    await deleteBilling(billingId)

    revalidatePath(`/projects/${billing.projectId}`)
    revalidatePath(`/projects/${billing.projectId}/billings`)

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to delete billing.' }
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

export async function addManualTaskAction(
  billingId: string,
  input: AddManualTaskInput,
): Promise<ActionResult<void>> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'worklog:edit')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    if (billing.status !== 'draft') {
      return { success: false, error: 'Manual tasks can only be added to draft billings.' }
    }

    const label = input.label.trim()
    if (!label || label.length > 200) {
      return { success: false, error: 'Task name must be between 1 and 200 characters.' }
    }

    if (isNaN(input.hours) || input.hours <= 0 || input.hours > 999) {
      return { success: false, error: 'Hours must be greater than 0 and at most 999.' }
    }

    if (input.comment && input.comment.length > 1000) {
      return { success: false, error: 'Comment must be at most 1000 characters.' }
    }

    await insertManualTask(billingId, { ...input, label }, user.email ?? 'unknown')

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to add manual task.' }
  }
}

export async function updateTaskSummaryAction(
  billingId: string,
  issueKey: string,
  customSummary: string,
  removeJiraReference: boolean,
): Promise<ActionResult<void>> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'worklog:edit')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    if (billing.status !== 'draft') {
      return { success: false, error: 'Task summary can only be edited in draft billings.' }
    }

    const summary = customSummary.trim()
    if (!summary || summary.length > 200) {
      return { success: false, error: 'Summary must be between 1 and 200 characters.' }
    }

    await updateTaskSummary(billingId, issueKey, summary, removeJiraReference)

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to update task summary.' }
  }
}

export async function updateWorklogSummaryAction(
  worklogId: string,
  customSummary: string,
  removeJiraReference: boolean,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'worklog:edit')
    if (permError) return { success: false, error: permError }

    const row = await db
      .selectFrom('worklogs')
      .select('billing_id')
      .where('id', '=', worklogId)
      .executeTakeFirst()
    if (!row) return { success: false, error: 'Worklog not found.' }

    const billing = await getBillingById(row.billing_id)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    if (billing.status !== 'draft') {
      return { success: false, error: 'Billing must be in draft to edit.' }
    }

    const summary = customSummary.trim()
    if (!summary || summary.length > 200) {
      return { success: false, error: 'Summary must be between 1 and 200 characters.' }
    }

    await updateWorklogSummary(worklogId, summary, removeJiraReference)

    revalidatePath(`/projects/${billing.projectId}/billings/${billing.id}`)

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to update task summary.' }
  }
}

export async function deleteWorklogRowAction(worklogId: string): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'worklog:edit')
    if (permError) return { success: false, error: permError }

    const row = await db
      .selectFrom('worklogs')
      .select('billing_id')
      .where('id', '=', worklogId)
      .executeTakeFirst()
    if (!row) return { success: false, error: 'Worklog not found.' }

    const billing = await getBillingById(row.billing_id)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    if (billing.status !== 'draft') {
      return { success: false, error: 'Rows can only be deleted from draft billings.' }
    }

    await deleteWorklogRow(worklogId)

    revalidatePath(`/projects/${billing.projectId}/billings/${billing.id}`)

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to delete worklog row.' }
  }
}

export async function addManualRowAction(
  billingId: string,
  input: { summary: string; hours: number; note: string | null },
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'worklog:edit')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    if (billing.status !== 'draft') {
      return { success: false, error: 'Manual rows can only be added to draft billings.' }
    }

    const summary = input.summary.trim()
    if (!summary || summary.length > 200) {
      return { success: false, error: 'Task summary must be between 1 and 200 characters.' }
    }

    if (isNaN(input.hours) || input.hours <= 0 || input.hours > 999) {
      return { success: false, error: 'Hours must be greater than 0 and at most 999.' }
    }

    if (input.note && input.note.length > 1000) {
      return { success: false, error: 'Note must be at most 1000 characters.' }
    }

    await db
      .insertInto('worklogs')
      .values({
        billing_id: billingId,
        jira_worklog_id: `manual-${crypto.randomUUID()}`,
        jira_issue_key: `MANUAL-${Date.now()}`,
        issue_summary: summary,
        author_name: user.email ?? 'unknown',
        author_jira_id: 'manual',
        work_started: new Date(),
        original_seconds: Math.round(input.hours * 3600),
        modified_seconds: null,
        original_comment: null,
        modified_comment: input.note,
        is_manual: true,
        custom_summary: null,
        jira_reference_removed: true,
      })
      .execute()

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to add manual row.' }
  }
}

export async function deleteManualTaskAction(
  billingId: string,
  issueKey: string,
): Promise<ActionResult<void>> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'worklog:edit')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing period not found.' }

    if (billing.status !== 'draft') {
      return { success: false, error: 'Manual tasks can only be deleted from draft billings.' }
    }

    await deleteManualTask(billingId, issueKey)

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to delete manual task.' }
  }
}
