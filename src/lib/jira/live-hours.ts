// SERVER ONLY — never import from Client Components
import { fetchWorklogsForProject } from '@/lib/jira/client'
import { getDecryptedJiraConfig } from '@/lib/jira/queries'
import type {
  JiraMemberSummary,
  JiraProjectSummary,
  JiraWorklogPreviewEntry,
  LiveHoursResult,
} from '@/lib/jira/dashboard-types'
import type {
  OverviewTaskSummary,
  OverviewTaskAuthorEntry,
  OverviewAuthorSummary,
  OverviewAuthorTaskEntry,
  ProjectOverviewData,
  OverviewResult,
} from '@/lib/jira/overview-types'

function formatDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function resolveDefaultDates(startDate?: Date, endDate?: Date): { start: Date; end: Date } {
  const now = new Date()
  return {
    start: startDate ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    end: endDate ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)),
  }
}

/**
 * Fetches and aggregates live worklog data from Jira for a project.
 * Date range defaults to current month if not specified.
 */
export async function getLiveProjectHours(
  projectId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<LiveHoursResult> {
  try {
    const config = await getDecryptedJiraConfig(projectId)
    if (!config) return { success: false, error: 'no_config' }

    const { start: resolvedStart, end: resolvedEnd } = resolveDefaultDates(startDate, endDate)
    const entries = await fetchWorklogsForProject(config, resolvedStart, resolvedEnd)

    const totalSeconds = entries.reduce((sum, e) => sum + e.timeSpentSeconds, 0)
    const totalHours = Math.round(totalSeconds / 36) / 100

    const memberMap = new Map<
      string,
      { displayName: string; totalSeconds: number; issueKeys: Set<string> }
    >()
    for (const entry of entries) {
      const existing = memberMap.get(entry.authorJiraId)
      if (existing) {
        existing.totalSeconds += entry.timeSpentSeconds
        existing.issueKeys.add(entry.issueKey)
      } else {
        memberMap.set(entry.authorJiraId, {
          displayName: entry.authorName,
          totalSeconds: entry.timeSpentSeconds,
          issueKeys: new Set([entry.issueKey]),
        })
      }
    }

    const memberSummaries: JiraMemberSummary[] = Array.from(memberMap.entries())
      .map(([accountId, m]) => ({
        accountId,
        displayName: m.displayName,
        totalSeconds: m.totalSeconds,
        totalHours: Math.round(m.totalSeconds / 36) / 100,
        issueCount: m.issueKeys.size,
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)

    const recentWorklogs: JiraWorklogPreviewEntry[] = entries
      .slice()
      .sort((a, b) => b.workStarted.getTime() - a.workStarted.getTime())
      .slice(0, 10)
      .map((e) => ({
        worklogId: e.worklogId,
        issueKey: e.issueKey,
        issueSummary: e.issueSummary,
        authorName: e.authorName,
        authorJiraId: e.authorJiraId,
        workStarted: e.workStarted,
        timeSpentSeconds: e.timeSpentSeconds,
        timeSpentHours: Math.round(e.timeSpentSeconds / 36) / 100,
        comment: e.comment,
      }))

    const summary: JiraProjectSummary = {
      projectKey: config.projectKey,
      projectName: config.projectKey,
      totalSeconds,
      totalHours,
      memberSummaries,
      recentWorklogs,
      fetchedAt: new Date(),
    }

    return { success: true, data: summary }
  } catch (err) {
    console.error('[getLiveProjectHours] Unexpected error:', err)
    return { success: false, error: 'fetch_failed' }
  }
}

/**
 * Fetches live worklogs and builds a full task + worklog-author overview for a project.
 * Date range defaults to current month if not specified.
 * Author = worklog author (person who logged time), never issue assignee.
 */
export async function getProjectOverviewData(
  projectId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<OverviewResult> {
  try {
    const config = await getDecryptedJiraConfig(projectId)
    if (!config) return { success: false, error: 'no_config' }

    const { start: resolvedStart, end: resolvedEnd } = resolveDefaultDates(startDate, endDate)
    const entries = await fetchWorklogsForProject(config, resolvedStart, resolvedEnd)

    // Build task map keyed by issueKey
    const tasksMap = new Map<
      string,
      {
        issueKey: string
        issueSummary: string
        totalSeconds: number
        authors: Map<
          string,
          { accountId: string; displayName: string; seconds: number; worklogCount: number }
        >
      }
    >()

    for (const entry of entries) {
      let task = tasksMap.get(entry.issueKey)
      if (!task) {
        task = {
          issueKey: entry.issueKey,
          issueSummary: entry.issueSummary,
          totalSeconds: 0,
          authors: new Map(),
        }
        tasksMap.set(entry.issueKey, task)
      }
      task.totalSeconds += entry.timeSpentSeconds

      const authorEntry = task.authors.get(entry.authorJiraId)
      if (authorEntry) {
        authorEntry.seconds += entry.timeSpentSeconds
        authorEntry.worklogCount += 1
      } else {
        task.authors.set(entry.authorJiraId, {
          accountId: entry.authorJiraId,
          displayName: entry.authorName,
          seconds: entry.timeSpentSeconds,
          worklogCount: 1,
        })
      }
    }

    // Build authors map keyed by authorJiraId
    const authorsMap = new Map<
      string,
      {
        accountId: string
        displayName: string
        totalSeconds: number
        tasks: Map<string, { issueKey: string; issueSummary: string; seconds: number; worklogCount: number }>
      }
    >()

    for (const entry of entries) {
      let author = authorsMap.get(entry.authorJiraId)
      if (!author) {
        author = {
          accountId: entry.authorJiraId,
          displayName: entry.authorName,
          totalSeconds: 0,
          tasks: new Map(),
        }
        authorsMap.set(entry.authorJiraId, author)
      }
      author.totalSeconds += entry.timeSpentSeconds

      const taskEntry = author.tasks.get(entry.issueKey)
      if (taskEntry) {
        taskEntry.seconds += entry.timeSpentSeconds
        taskEntry.worklogCount += 1
      } else {
        author.tasks.set(entry.issueKey, {
          issueKey: entry.issueKey,
          issueSummary: entry.issueSummary,
          seconds: entry.timeSpentSeconds,
          worklogCount: 1,
        })
      }
    }

    const tasks: OverviewTaskSummary[] = Array.from(tasksMap.values())
      .map((t) => {
        const authors: OverviewTaskAuthorEntry[] = Array.from(t.authors.values())
          .map((a) => ({ ...a, hours: Math.round(a.seconds / 36) / 100 }))
          .sort((a, b) => b.seconds - a.seconds)
        return {
          issueKey: t.issueKey,
          issueSummary: t.issueSummary,
          totalSeconds: t.totalSeconds,
          totalHours: Math.round(t.totalSeconds / 36) / 100,
          worklogAuthorCount: t.authors.size,
          authors,
        }
      })
      .sort((a, b) => b.totalSeconds - a.totalSeconds)

    const authors: OverviewAuthorSummary[] = Array.from(authorsMap.values())
      .map((a) => {
        const authorTasks: OverviewAuthorTaskEntry[] = Array.from(a.tasks.values())
          .map((t) => ({ ...t, hours: Math.round(t.seconds / 36) / 100 }))
          .sort((a, b) => b.seconds - a.seconds)
        return {
          accountId: a.accountId,
          displayName: a.displayName,
          totalSeconds: a.totalSeconds,
          totalHours: Math.round(a.totalSeconds / 36) / 100,
          taskCount: a.tasks.size,
          tasks: authorTasks,
        }
      })
      .sort((a, b) => b.totalSeconds - a.totalSeconds)

    const totalSeconds = entries.reduce((sum, e) => sum + e.timeSpentSeconds, 0)

    return {
      success: true,
      data: {
        tasks,
        authors,
        totalSeconds,
        totalHours: Math.round(totalSeconds / 36) / 100,
        totalTasks: tasks.length,
        totalAuthors: authors.length,
        fetchedAt: new Date(),
        dateRange: {
          startDate: formatDate(resolvedStart),
          endDate: formatDate(resolvedEnd),
        },
      },
    }
  } catch (err) {
    console.error('[getProjectOverviewData] Unexpected error:', err)
    return { success: false, error: 'fetch_failed' }
  }
}
