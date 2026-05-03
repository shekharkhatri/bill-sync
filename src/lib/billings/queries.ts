import { sql } from 'kysely'
import { db } from '@/lib/db/client'
import { parseDateString } from '@/lib/billings/date-utils'
import type { Billing, BillingStatus, BillingWithStats, WorklogWithEffective } from '@/lib/billings/types'
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      effectiveSeconds,
      effectiveHours: Math.round((effectiveSeconds / 3600) * 100) / 100,
      effectiveComment: row.modified_comment ?? row.original_comment,
      isModified: row.modified_seconds !== null || row.modified_comment !== null,
    }
  })
}

export async function insertWorklogs(
  billingId: string,
  entries: JiraWorklogEntry[],
): Promise<void> {
  await db.deleteFrom('worklogs').where('billing_id', '=', billingId).execute()

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

// Re-export parseDateString for use in actions
export { parseDateString }
