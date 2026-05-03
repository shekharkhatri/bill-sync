export interface ProjectJiraConfig {
  id: string
  projectId: string
  instanceUrl: string
  jiraProjectKey: string
  userEmail: string
  encryptedApiToken: string
  isVerified: boolean
  lastVerifiedAt: Date | null
  jqlScope: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectJiraConfigDisplay {
  id: string
  projectId: string
  instanceUrl: string
  jiraProjectKey: string
  userEmail: string
  maskedApiToken: string
  isVerified: boolean
  lastVerifiedAt: Date | null
  jqlScope: string | null
}

export type SaveJiraConfigInput = {
  instanceUrl: string
  jiraProjectKey: string
  userEmail: string
  apiToken: string
  jqlScope?: string
}
