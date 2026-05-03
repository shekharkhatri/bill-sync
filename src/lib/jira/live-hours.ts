// SERVER ONLY — never import from Client Components
import { fetchWorklogsForProject } from '@/lib/jira/client'
import { getDecryptedJiraConfig } from '@/lib/jira/queries'
import type {
  JiraMemberSummary,
  JiraProjectSummary,
  JiraWorklogPreviewEntry,
  LiveHoursResult,
} from '@/lib/jira/dashboard-types'

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

    const now = new Date()
    const resolvedEnd =
      endDate ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    const resolvedStart =
      startDate ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

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

    const projectKey = config.projectKey
    const projectName = config.projectKey

    const summary: JiraProjectSummary = {
      projectKey,
      projectName,
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
 * Formats a duration in seconds to a readable string e.g. '3h 20m'
 */
export function formatHours(seconds: number): string {
  if (seconds < 60) return '< 1m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatDateShort(date: Date): string {
  return shortDateFormatter.format(date)
}

export function formatDateFull(date: Date): string {
  return fullDateFormatter.format(date)
}
