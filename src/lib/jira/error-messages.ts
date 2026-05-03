import type { JiraApiError } from '@/lib/jira/types'

export function mapJiraError(error: JiraApiError): string {
  switch (error.type) {
    case 'unauthorized':
      return 'Invalid credentials. Check your Jira email and API token.'
    case 'not_found':
      return 'Project key not found. Verify the Jira project key is correct.'
    case 'rate_limited':
      return 'Jira rate limit reached. Please wait a moment and try again.'
    case 'timeout':
      return 'Connection timed out. Check your Jira instance URL is accessible.'
    case 'unknown':
      return 'Could not connect to Jira. Verify all settings and try again.'
  }
}
