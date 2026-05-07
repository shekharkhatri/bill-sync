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

// buildJql assembles the JQL query for issue search.
// worklogDate filters ISSUES that have any worklog in the range;
// individual worklog date filtering still happens in post-processing.
//
// Examples:
// No scope:
// project = "ENG" AND worklogDate >= "2025-04-01" AND worklogDate <= "2025-04-30"
//
// With label scope:
// project = "ENG" AND worklogDate >= "2025-04-01" AND worklogDate <= "2025-04-30"
//   AND (labels = "billable")
//
// With complex scope:
// project = "ENG" AND worklogDate >= "2025-04-01" AND worklogDate <= "2025-04-30"
//   AND (issuetype in (Story, Bug) AND sprint in openSprints())
function buildJql(config: JiraConnectionConfig, startDate: Date, endDate: Date): string {
  const scopeClause = config.jqlScope?.trim() ? ` AND (${config.jqlScope.trim()})` : ''
  return `project = "${config.projectKey}" AND worklogDate >= "${formatDate(startDate)}" AND worklogDate <= "${formatDate(endDate)}"${scopeClause}`
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
    // POST /rest/api/3/search/jql — GET /rest/api/3/search returns 410 Gone on Jira Cloud.
    const res = await fetch(buildUrl(config, '/search/jql'), {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(config),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jql, fields: ['id'], maxResults: 1 }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) return { valid: false }

    const data = (await res.json()) as JiraSearchResult
    return { valid: true, count: data.total ?? data.issues.length }
  } catch {
    clearTimeout(timer)
    return { valid: false }
  }
}

/**
 * Fetches all worklogs for a project within a date range.
 * Uses POST /rest/api/3/search/jql (the GET /rest/api/3/search endpoint returns 410 Gone).
 * The new endpoint uses cursor-based pagination via nextPageToken — no startAt.
 * Handles per-issue worklog pagination separately for issues with >20 worklogs.
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

  // POST /rest/api/3/search/jql uses cursor-based pagination via nextPageToken.
  let nextPageToken: string | undefined = undefined

  for (let page = 0; page < MAX_PAGES; page++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)

    let searchResult: JiraSearchResult
    try {
      const body: Record<string, unknown> = {
        jql,
        fields: ['summary', 'worklog'],
        maxResults: MAX_RESULTS,
      }
      // Only include nextPageToken on subsequent pages — omitting it on the first request.
      if (nextPageToken !== undefined) {
        body.nextPageToken = nextPageToken
      }

      const res = await fetch(buildUrl(config, '/search/jql'), {
        method: 'POST',
        headers: {
          Authorization: buildAuthHeader(config),
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (!res.ok) {
        const errBody: unknown = await res.json().catch(() => null)
        console.error('[fetchWorklogsForProject] Search failed:', res.status, JSON.stringify(errBody))
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
        // IMPORTANT: Filter on worklog.started (when work was performed by the author),
        // NOT on issue created date, updated date, or any other field.
        // worklog.started is the authoritative date for billing period inclusion.
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

    // No nextPageToken in response = no more pages.
    if (!searchResult.nextPageToken) break

    if (page === MAX_PAGES - 1) {
      console.warn('[fetchWorklogsForProject] Safety page cap reached — some issues may be missing')
      break
    }

    nextPageToken = searchResult.nextPageToken
  }

  const seen = new Set<string>()
  return allEntries.filter((entry) => {
    if (seen.has(entry.worklogId)) return false
    seen.add(entry.worklogId)
    return true
  })
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
