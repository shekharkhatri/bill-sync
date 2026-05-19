import { sql } from 'kysely'
import { db } from '@/lib/db/client'
import { parseDateString } from '@/lib/billings/date-utils'
import type { AddManualTaskInput, Billing, BillingStatus, BillingTaskSummary, BillingWithStats, UpdateWorklogInput, WorklogWithEffective } from '@/lib/billings/types'
import type { JiraWorklogEntry } from '@/lib/jira/types'

function mapBilling(row: {
  id: string
  project_id: string
  label: string
  start_date: Date
  end_date: Date
  status: string
  created_by: string | null
  created_at: Date
  updated_at: Date
}): Billing {
  return {
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as BillingStatus,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function secondsToHours(seconds: number): number {
  return Math.round(seconds / 36) / 100
}

export async function getBillingsByProject(projectId: string): Promise<BillingWithStats[]> {
  const rows = await db
    .selectFrom('billings as b')
    .leftJoin('worklogs as w', 'w.billing_id', 'b.id')
    .select([
      'b.id',
      'b.project_id',
      'b.label',
      'b.start_date',
      'b.end_date',
      'b.status',
      'b.created_by',
      'b.created_at',
      'b.updated_at',
      sql<string>`COALESCE(SUM(w.original_seconds), 0)`.as('total_original_seconds'),
      sql<string>`COALESCE(SUM(COALESCE(w.modified_seconds, w.original_seconds)), 0)`.as(
        'total_modified_seconds',
      ),
      sql<string>`COUNT(w.id)`.as('worklog_count'),
    ])
    .where('b.project_id', '=', projectId)
    .groupBy('b.id')
    .orderBy('b.created_at', 'desc')
    .execute()

  return rows.map((row) => ({
    ...mapBilling(row),
    totalOriginalHours: secondsToHours(Number(row.total_original_seconds)),
    totalModifiedHours: secondsToHours(Number(row.total_modified_seconds)),
    worklogCount: Number(row.worklog_count),
  }))
}

export async function getBillingById(billingId: string): Promise<Billing | null> {
  const row = await db
    .selectFrom('billings')
    .selectAll()
    .where('id', '=', billingId)
    .executeTakeFirst()

  return row ? mapBilling(row) : null
}

export async function getBillingWithStats(billingId: string): Promise<BillingWithStats | null> {
  const row = await db
    .selectFrom('billings as b')
    .leftJoin('worklogs as w', 'w.billing_id', 'b.id')
    .select([
      'b.id',
      'b.project_id',
      'b.label',
      'b.start_date',
      'b.end_date',
      'b.status',
      'b.created_by',
      'b.created_at',
      'b.updated_at',
      sql<string>`COALESCE(SUM(w.original_seconds), 0)`.as('total_original_seconds'),
      sql<string>`COALESCE(SUM(COALESCE(w.modified_seconds, w.original_seconds)), 0)`.as(
        'total_modified_seconds',
      ),
      sql<string>`COUNT(w.id)`.as('worklog_count'),
    ])
    .where('b.id', '=', billingId)
    .groupBy('b.id')
    .executeTakeFirst()

  if (!row) return null

  return {
    ...mapBilling(row),
    totalOriginalHours: secondsToHours(Number(row.total_original_seconds)),
    totalModifiedHours: secondsToHours(Number(row.total_modified_seconds)),
    worklogCount: Number(row.worklog_count),
  }
}

export async function getWorklogsByBilling(billingId: string): Promise<WorklogWithEffective[]> {
  const rows = await db
    .selectFrom('worklogs')
    .selectAll()
    .where('billing_id', '=', billingId)
    .orderBy('work_started', 'asc')
    .orderBy('author_name', 'asc')
    .execute()

  return rows.map((row) => {
    const effectiveSeconds = row.modified_seconds ?? row.original_seconds
    return {
      id: row.id,
      billingId: row.billing_id,
      jiraWorklogId: row.jira_worklog_id,
      jiraIssueKey: row.jira_issue_key,
      issueSummary: row.issue_summary,
      authorName: row.author_name,
      authorJiraId: row.author_jira_id,
      workStarted: row.work_started,
      originalSeconds: row.original_seconds,
      modifiedSeconds: row.modified_seconds,
      originalComment: row.original_comment,
      modifiedComment: row.modified_comment,
      isManual: row.is_manual,
      customSummary: row.custom_summary,
      jiraReferenceRemoved: row.jira_reference_removed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      effectiveSeconds,
      effectiveHours: Math.round((effectiveSeconds / 3600) * 100) / 100,
      effectiveComment: row.modified_comment,
      isModified: row.modified_seconds !== null || row.modified_comment !== null,
      displaySummary: row.custom_summary ?? row.issue_summary ?? row.jira_issue_key,
      displayIssueKey: row.jira_reference_removed ? null : row.jira_issue_key,
    }
  })
}

export async function insertWorklogs(
  billingId: string,
  entries: JiraWorklogEntry[],
): Promise<void> {
  await db
    .deleteFrom('worklogs')
    .where('billing_id', '=', billingId)
    .where('is_manual', '=', false)
    .execute()

  if (entries.length === 0) return

  await db
    .insertInto('worklogs')
    .values(
      entries.map((entry) => ({
        billing_id: billingId,
        jira_worklog_id: entry.worklogId,
        jira_issue_key: entry.issueKey,
        issue_summary: entry.issueSummary,
        author_name: entry.authorName,
        author_jira_id: entry.authorJiraId,
        work_started: entry.workStarted,
        original_seconds: entry.timeSpentSeconds,
        original_comment: entry.comment,
        modified_seconds: null,
        modified_comment: null,
      })),
    )
    .execute()
}

export async function updateBillingStatus(
  billingId: string,
  status: BillingStatus,
): Promise<void> {
  await db
    .updateTable('billings')
    .set({ status, updated_at: new Date() })
    .where('id', '=', billingId)
    .execute()
}

export async function checkBillingOverlap(
  projectId: string,
  startDate: string,
  endDate: string,
  excludeBillingId?: string,
): Promise<boolean> {
  const startParsed = parseDateString(startDate)
  const endParsed = parseDateString(endDate)

  let query = db
    .selectFrom('billings')
    .select('id')
    .where('project_id', '=', projectId)
    .where('start_date', '<=', endParsed)
    .where('end_date', '>=', startParsed)

  if (excludeBillingId) {
    query = query.where('id', '!=', excludeBillingId)
  }

  const row = await query.executeTakeFirst()
  return row !== undefined
}

export async function updateWorklog(
  worklogId: string,
  input: Pick<UpdateWorklogInput, 'modifiedSeconds' | 'modifiedComment'>,
): Promise<void> {
  try {
    await db
      .updateTable('worklogs')
      .set({
        modified_seconds: input.modifiedSeconds ?? null,
        modified_comment: input.modifiedComment ?? null,
        updated_at: new Date(),
      })
      .where('id', '=', worklogId)
      .execute()
  } catch (err) {
    console.error('[updateWorklog] Failed:', err)
    throw err
  }
}

/**
 * Updates multiple worklogs for a billing. Called when user saves
 * the editor. Each update is applied individually — partial success is acceptable.
 */
export async function bulkUpdateWorklogs(
  billingId: string,
  updates: UpdateWorklogInput[],
): Promise<void> {
  try {
    for (const update of updates) {
      await updateWorklog(update.worklogId, {
        modifiedSeconds: update.modifiedSeconds,
        modifiedComment: update.modifiedComment,
      })
    }
    await db
      .updateTable('billings')
      .set({ updated_at: new Date() })
      .where('id', '=', billingId)
      .execute()
  } catch (err) {
    console.error('[bulkUpdateWorklogs] Failed:', err)
    throw err
  }
}

/**
 * Resets all worklog modifications for a billing back to original values.
 */
export async function resetAllWorklogs(billingId: string): Promise<void> {
  try {
    await db
      .updateTable('worklogs')
      .set({
        modified_seconds: null,
        modified_comment: null,
        updated_at: new Date(),
      })
      .where('billing_id', '=', billingId)
      .execute()
    await db
      .updateTable('billings')
      .set({ updated_at: new Date() })
      .where('id', '=', billingId)
      .execute()
  } catch (err) {
    console.error('[resetAllWorklogs] Failed:', err)
    throw err
  }
}

/**
 * Permanently deletes a draft billing and all its worklogs.
 * Throws if the billing is not in draft status. This is irreversible.
 */
export async function deleteBilling(billingId: string): Promise<void> {
  try {
    await db.deleteFrom('worklogs').where('billing_id', '=', billingId).execute()

    const result = await db
      .deleteFrom('billings')
      .where('id', '=', billingId)
      .where('status', '=', 'draft')
      .executeTakeFirst()

    if (!result || result.numDeletedRows === BigInt(0)) {
      throw new Error('Only draft billings can be deleted.')
    }
  } catch (err) {
    console.error('[deleteBilling] Failed:', err)
    throw err
  }
}

export async function getBillingTaskSummaries(billingId: string): Promise<BillingTaskSummary[]> {
  const rows = await db
    .selectFrom('worklogs')
    .select([
      'jira_issue_key',
      'issue_summary',
      'is_manual',
      'custom_summary',
      'jira_reference_removed',
      sql<string>`SUM(original_seconds)`.as('total_original_seconds'),
      sql<string>`SUM(COALESCE(modified_seconds, original_seconds))`.as('total_modified_seconds'),
      sql<string>`COUNT(id)`.as('worklog_count'),
      sql<string>`array_agg(DISTINCT author_name ORDER BY author_name)`.as('authors'),
    ])
    .where('billing_id', '=', billingId)
    .groupBy(['jira_issue_key', 'issue_summary', 'is_manual', 'custom_summary', 'jira_reference_removed'])
    .orderBy('jira_issue_key', 'asc')
    .execute()

  return rows.map((row) => {
    const effectiveSeconds = Number(row.total_modified_seconds)
    const isManual = row.is_manual
    const jiraReferenceRemoved = row.jira_reference_removed
    const displaySummary =
      row.custom_summary?.trim() || row.issue_summary || row.jira_issue_key
    const displayIssueKey = jiraReferenceRemoved ? null : row.jira_issue_key

    return {
      jiraIssueKey: row.jira_issue_key,
      issueSummary: row.issue_summary,
      isManual,
      customSummary: row.custom_summary,
      jiraReferenceRemoved,
      displaySummary,
      displayIssueKey,
      totalOriginalSeconds: Number(row.total_original_seconds),
      totalModifiedSeconds: Number(row.total_modified_seconds),
      effectiveSeconds,
      worklogCount: Number(row.worklog_count),
      authors: row.authors as unknown as string[],
    }
  })
}

/**
 * Updates the billed hours for all worklogs under a given issue key,
 * distributing totalModifiedSeconds proportionally by original_seconds.
 * The last worklog absorbs any rounding remainder.
 */
export async function updateTaskHours(
  billingId: string,
  jiraIssueKey: string,
  totalModifiedSeconds: number,
): Promise<void> {
  const rows = await db
    .selectFrom('worklogs')
    .select(['id', 'original_seconds'])
    .where('billing_id', '=', billingId)
    .where('jira_issue_key', '=', jiraIssueKey)
    .execute()

  if (rows.length === 0) return

  const totalOriginal = rows.reduce((sum, r) => sum + r.original_seconds, 0)

  // Proportional distribution; equal split when all originals are 0
  const shares: number[] = []
  for (let i = 0; i < rows.length - 1; i++) {
    shares.push(
      totalOriginal === 0
        ? Math.round(totalModifiedSeconds / rows.length)
        : Math.round((totalModifiedSeconds * rows[i].original_seconds) / totalOriginal),
    )
  }
  // Last row absorbs rounding remainder
  shares.push(totalModifiedSeconds - shares.reduce((s, n) => s + n, 0))

  await Promise.all(
    rows.map((row, i) =>
      db
        .updateTable('worklogs')
        .set({ modified_seconds: shares[i], updated_at: new Date() })
        .where('id', '=', row.id)
        .execute(),
    ),
  )
}

/**
 * Inserts a manually-added billing task as a single worklog row.
 * The synthetic issue key (MANUAL-<timestamp>) is used for grouping only
 * and is never shown in the UI since is_manual = true and jira_reference_removed = true.
 * @param createdBy - the BillSync user email who added this task
 */
export async function insertManualTask(
  billingId: string,
  input: AddManualTaskInput,
  createdBy: string,
): Promise<void> {
  const syntheticKey = `MANUAL-${Date.now()}`
  await db
    .insertInto('worklogs')
    .values({
      billing_id: billingId,
      jira_worklog_id: `manual-${crypto.randomUUID()}`,
      jira_issue_key: syntheticKey,
      issue_summary: input.label,
      author_name: createdBy,
      author_jira_id: 'manual',
      work_started: new Date(),
      original_seconds: Math.round(input.hours * 3600),
      modified_seconds: null,
      original_comment: input.comment,
      modified_comment: null,
      is_manual: true,
      custom_summary: null,
      jira_reference_removed: true,
    })
    .execute()
}

/**
 * Sets a custom display summary for all worklog rows belonging to this task.
 * When removeJiraReference is true, the Jira issue key is hidden from the UI.
 * The original jira_issue_key is preserved in the database for audit.
 */
export async function updateTaskSummary(
  billingId: string,
  issueKey: string,
  customSummary: string,
  removeJiraReference: boolean,
): Promise<void> {
  await db
    .updateTable('worklogs')
    .set({
      custom_summary: customSummary,
      jira_reference_removed: removeJiraReference,
      updated_at: new Date(),
    })
    .where('billing_id', '=', billingId)
    .where('jira_issue_key', '=', issueKey)
    .execute()
}

export async function deleteManualTask(billingId: string, issueKey: string): Promise<void> {
  await db
    .deleteFrom('worklogs')
    .where('billing_id', '=', billingId)
    .where('jira_issue_key', '=', issueKey)
    .where('is_manual', '=', true)
    .execute()
}

/**
 * Deletes all worklog rows for a given issue key in a billing (Jira or manual).
 * Used by the task-aggregated billing editor.
 */
export async function deleteTaskWorklogs(billingId: string, issueKey: string): Promise<void> {
  await db
    .deleteFrom('worklogs')
    .where('billing_id', '=', billingId)
    .where('jira_issue_key', '=', issueKey)
    .execute()
}

/**
 * Updates the custom summary and Jira reference visibility for a single worklog row.
 * Used when the user edits the task name in the billing editor (per-row, not per-issue).
 */
export async function updateWorklogSummary(
  worklogId: string,
  customSummary: string,
  removeJiraReference: boolean,
): Promise<void> {
  await db
    .updateTable('worklogs')
    .set({
      custom_summary: customSummary,
      jira_reference_removed: removeJiraReference,
      updated_at: new Date(),
    })
    .where('id', '=', worklogId)
    .execute()
}

/**
 * Permanently removes a worklog row from a billing snapshot.
 * Only call this when billing is in draft status — enforced at action layer.
 */
export async function deleteWorklogRow(worklogId: string): Promise<void> {
  try {
    await db.deleteFrom('worklogs').where('id', '=', worklogId).execute()
  } catch (err) {
    console.error('[deleteWorklogRow] Failed:', err)
    throw err
  }
}

/**
 * Returns the internal note for each task in a billing, keyed by jira_issue_key.
 * Used for CSV export. Returns the first non-null modified_comment per task.
 */
export async function getTaskNotes(
  billingId: string,
): Promise<Record<string, string | null>> {
  try {
    const rows = await db
      .selectFrom('worklogs')
      .select([
        'jira_issue_key',
        sql<string | null>`MAX(modified_comment)`.as('modified_comment'),
      ])
      .where('billing_id', '=', billingId)
      .groupBy('jira_issue_key')
      .execute()

    const result: Record<string, string | null> = {}
    for (const row of rows) {
      result[row.jira_issue_key] = row.modified_comment ?? null
    }
    return result
  } catch (err) {
    console.error('[getTaskNotes] Failed:', err)
    return {}
  }
}

// Re-export parseDateString for use in actions
export { parseDateString }
