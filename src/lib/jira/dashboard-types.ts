export interface JiraMemberSummary {
  accountId: string
  displayName: string
  totalSeconds: number
  totalHours: number
  issueCount: number
}

export interface JiraWorklogPreviewEntry {
  worklogId: string
  issueKey: string
  issueSummary: string
  authorName: string
  authorJiraId: string
  workStarted: Date
  timeSpentSeconds: number
  timeSpentHours: number
  comment: string | null
}

export interface JiraProjectSummary {
  projectKey: string
  projectName: string
  totalSeconds: number
  totalHours: number
  memberSummaries: JiraMemberSummary[]
  recentWorklogs: JiraWorklogPreviewEntry[]
  fetchedAt: Date
}

export type LiveHoursResult =
  | { success: true; data: JiraProjectSummary }
  | { success: false; error: string }
