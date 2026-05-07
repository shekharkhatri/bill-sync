export interface JiraProject {
  id: string
  key: string
  name: string
  projectTypeKey: string
  avatarUrls: Record<string, string>
}

export interface JiraUser {
  accountId: string
  displayName: string
  emailAddress: string
  avatarUrls: Record<string, string>
  active: boolean
}

export interface JiraWorklogComment {
  type: string
  version: number
  content: JiraWorklogCommentContent[]
}

export interface JiraWorklogCommentContent {
  type: string
  content?: JiraWorklogCommentText[]
}

export interface JiraWorklogCommentText {
  type: string
  text?: string
}

export interface JiraWorklog {
  id: string
  issueId: string
  // worklog author: the person who entered this time log.
  // This is NOT the issue assignee. BillSync only tracks worklog authors.
  author: JiraUser
  created: string
  updated: string
  started: string
  timeSpent: string
  timeSpentSeconds: number
  comment?: JiraWorklogComment
}

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    worklog: {
      total: number
      worklogs: JiraWorklog[]
    }
  }
}

export interface JiraSearchResult {
  // POST /rest/api/3/search/jql uses cursor-based pagination.
  // nextPageToken is absent when there are no more pages.
  nextPageToken?: string
  // Legacy fields (present on older endpoints, absent on /search/jql):
  startAt?: number
  maxResults?: number
  total?: number
  issues: JiraIssue[]
}

export interface JiraWorklogPage {
  startAt: number
  maxResults: number
  total: number
  worklogs: JiraWorklog[]
}

export interface JiraConnectionConfig {
  instanceUrl: string
  userEmail: string
  apiToken: string
  projectKey: string
  jqlScope?: string | null
}

export interface JiraWorklogEntry {
  worklogId: string
  issueKey: string
  issueSummary: string
  authorName: string
  authorJiraId: string
  workStarted: Date
  timeSpentSeconds: number
  comment: string | null
}

export type JiraApiError =
  | { type: 'unauthorized'; message: string }
  | { type: 'not_found'; message: string }
  | { type: 'rate_limited'; message: string }
  | { type: 'timeout'; message: string }
  | { type: 'unknown'; message: string }
