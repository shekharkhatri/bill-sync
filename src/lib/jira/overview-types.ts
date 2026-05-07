// All "author" references in this file refer to the WORKLOG AUTHOR —
// the person who logged time on a Jira issue.
// Issue assignees are intentionally ignored by BillSync.

export interface OverviewTaskSummary {
  issueKey: string
  issueSummary: string
  totalSeconds: number
  totalHours: number          // rounded to 2dp
  worklogAuthorCount: number  // number of distinct worklog authors on this task
  authors: OverviewTaskAuthorEntry[]
}

export interface OverviewTaskAuthorEntry {
  accountId: string
  displayName: string         // worklog author display name from Jira
  seconds: number
  hours: number               // rounded to 2dp
  worklogCount: number        // number of individual worklog entries
}

export interface OverviewAuthorSummary {
  accountId: string
  displayName: string         // worklog author display name
  totalSeconds: number
  totalHours: number
  taskCount: number           // distinct tasks this author logged time on
  tasks: OverviewAuthorTaskEntry[]
}

export interface OverviewAuthorTaskEntry {
  issueKey: string
  issueSummary: string
  seconds: number
  hours: number
  worklogCount: number
}

export interface ProjectOverviewData {
  tasks: OverviewTaskSummary[]
  authors: OverviewAuthorSummary[]
  totalSeconds: number
  totalHours: number
  totalTasks: number
  totalAuthors: number          // distinct worklog authors
  fetchedAt: Date
  dateRange: { startDate: string; endDate: string }
}

export type OverviewResult =
  | { success: true; data: ProjectOverviewData }
  | { success: false; error: string }
