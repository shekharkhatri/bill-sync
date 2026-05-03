// SERVER ONLY — never import this file from a Client Component or client-side code
import type {
  JiraProject,
  JiraConnectionConfig,
  JiraWorklogEntry,
  JiraWorklogComment,
  JiraSearchResult,
  JiraWorklogPage,
  JiraApiError,
} from '@/lib/jira/types'

function buildAuthHeader(config: JiraConnectionConfig): string {
  return 'Basic ' + btoa(`${config.userEmail}:${config.apiToken}`)
}

function buildUrl(config: JiraConnectionConfig, path: string): string {
  const base = config.instanceUrl.replace(/\/$/, '')
  return `${base}/rest/api/3${path}`
}

function handleJiraError(status: number, _body: unknown): JiraApiError {
  switch (status) {
    case 401:
    case 403:
      return { type: 'unauthorized', message: 'Authentication failed' }
    case 404:
      return { type: 'not_found', message: 'Resource not found' }
    case 429:
      return { type: 'rate_limited', message: 'Rate limit exceeded' }
    case 408:
      return { type: 'timeout', message: 'Request timed out' }
    default:
      return { type: 'unknown', message: `Unexpected status ${status}` }
  }
}

function extractCommentText(comment: JiraWorklogComment | undefined): string | null {
  if (!comment) return null
  const texts: string[] = []
  for (const block of comment.content ?? []) {
    for (const inline of block.content ?? []) {
      if (inline.type === 'text' && inline.text) {
        texts.push(inline.text)
      }
    }
  }
  const result = texts.join('').trim()
  return result.length > 0 ? result : null
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// project clause first — Jira indexes project queries most efficiently;
// scope clause last so the date index is applied before the optional JQL filter.
function buildJql(config: JiraConnectionConfig, startDate: Date, endDate: Date): string {
  const base = `project = "${config.projectKey}"`
  const dates = `worklogDate >= "${formatDate(startDate)}" AND worklogDate <= "${formatDate(endDate)}"`
  const scopeClause = config.jqlScope?.trim() ? `AND (${config.jqlScope.trim()})` : ''
  return `${base} AND ${dates}${scopeClause ? ' ' + scopeClause : ''}`
}

/**
 * Tests a Jira connection by fetching the project by key.
 * Use this to validate credentials before saving them.
 */
export async function testJiraConnection(
  config: JiraConnectionConfig,
): Promise<{ success: true; project: JiraProject } | { success: false; error: JiraApiError }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(buildUrl(config, `/project/${config.projectKey}`), {
      headers: {
        Authorization: buildAuthHeader(config),
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!res.ok) {
      const body: unknown = await res.json().catch(() => null)
      return { success: false, error: handleJiraError(res.status, body) }
    }

    const project = (await res.json()) as JiraProject
    return { success: true, project }
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: { type: 'timeout', message: 'Request timed out' } }
    }
    return { success: false, error: { type: 'unknown', message: String(err) } }
  }
}

/**
 * Validates a JQL scope string against a real Jira project.
 * Returns { valid: true, count } on success, { valid: false } on JQL error.
 */
export async function validateJqlScope(
  config: JiraConnectionConfig,
  jqlScope: string,
): Promise<{ valid: true; count: number } | { valid: false }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)

  try {
    const jql = `project = "${config.projectKey}" AND ${jqlScope.trim()}`
    const params = new URLSearchParams({ jql, fields: 'id', maxResults: '1' })
    const res = await fetch(`${buildUrl(config, '/search')}?${params.toString()}`, {
      headers: {
        Authorization: buildAuthHeader(config),
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) return { valid: false }

    const data = (await res.json()) as JiraSearchResult
    return { valid: true, count: data.total }
  } catch {
    clearTimeout(timer)
    return { valid: false }
  }
}

/**
 * Fetches all worklogs for a project within a date range.
 * Uses GET /rest/api/3/search with query parameters (POST is deprecated/gone).
 * Handles Jira pagination for both issue search and per-issue worklogs.
 */
export async function fetchWorklogsForProject(
  config: JiraConnectionConfig,
  startDate: Date,
  endDate: Date,
): Promise<JiraWorklogEntry[]> {
  const jql = buildJql(config, startDate, endDate)
  const startStr = formatDate(startDate)
  const endStr = formatDate(endDate)

  const MAX_RESULTS = 50
  const MAX_PAGES = 10
  const allEntries: JiraWorklogEntry[] = []

  let startAt = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)

    let searchResult: JiraSearchResult
    try {
      const params = new URLSearchParams({
        jql,
        fields: 'summary,worklog',
        maxResults: String(MAX_RESULTS),
        startAt: String(startAt),
      })
      const res = await fetch(`${buildUrl(config, '/search/jql')}?${params.toString()}`, {
        headers: {
          Authorization: buildAuthHeader(config),
          Accept: 'application/json',
        },
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (!res.ok) {
        console.error('[fetchWorklogsForProject] Search failed:', res.status)
        break
      }
      searchResult = (await res.json()) as JiraSearchResult
    } catch {
      clearTimeout(timer)
      break
    }

    for (const issue of searchResult.issues) {
      const worklogs = await fetchAllWorklogsForIssue(config, issue.key, issue.fields.worklog)
      for (const wl of worklogs) {
        const started = wl.started.substring(0, 10)
        if (started < startStr || started > endStr) continue

        allEntries.push({
          worklogId: wl.id,
          issueKey: issue.key,
          issueSummary: issue.fields.summary,
          authorName: wl.author.displayName,
          authorJiraId: wl.author.accountId,
          workStarted: new Date(wl.started),
          timeSpentSeconds: wl.timeSpentSeconds,
          comment: extractCommentText(wl.comment),
        })
      }
    }

    const fetched = startAt + searchResult.issues.length
    if (fetched >= searchResult.total) break

    if (page === MAX_PAGES - 1) {
      console.warn('[fetchWorklogsForProject] Safety page cap reached — some issues may be missing')
      break
    }

    startAt += MAX_RESULTS
  }

  return allEntries
}

async function fetchAllWorklogsForIssue(
  config: JiraConnectionConfig,
  issueKey: string,
  initial: { total: number; worklogs: import('@/lib/jira/types').JiraWorklog[] },
): Promise<import('@/lib/jira/types').JiraWorklog[]> {
  if (initial.total <= initial.worklogs.length) {
    return initial.worklogs
  }

  const MAX_RESULTS = 50
  const MAX_PAGES = 20
  const allWorklogs = [...initial.worklogs]
  let startAt = initial.worklogs.length

  for (let page = 0; page < MAX_PAGES; page++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)

    try {
      const params = new URLSearchParams({
        startAt: String(startAt),
        maxResults: String(MAX_RESULTS),
      })
      const res = await fetch(
        `${buildUrl(config, `/issue/${issueKey}/worklog`)}?${params.toString()}`,
        {
          headers: { Authorization: buildAuthHeader(config), Accept: 'application/json' },
          signal: controller.signal,
        },
      )
      clearTimeout(timer)

      if (!res.ok) break

      const data = (await res.json()) as JiraWorklogPage
      allWorklogs.push(...data.worklogs)

      const fetched = startAt + data.worklogs.length
      if (fetched >= data.total) break

      if (page === MAX_PAGES - 1) {
        console.warn(`[fetchAllWorklogsForIssue] Safety cap reached for issue ${issueKey}`)
        break
      }

      startAt += MAX_RESULTS
    } catch {
      clearTimeout(timer)
      break
    }
  }

  return allWorklogs
}
