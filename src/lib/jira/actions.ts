'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { guardAction } from '@/lib/auth/permissions'
import { getProjectById } from '@/lib/projects/queries'
import { testJiraConnection, validateJqlScope } from '@/lib/jira/client'
import { upsertJiraConfig } from '@/lib/jira/queries'
import { mapJiraError } from '@/lib/jira/error-messages'
import type { SaveJiraConfigInput } from '@/lib/jira/config-types'
import type { JiraConnectionConfig } from '@/lib/jira/types'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function testJiraConnectionAction(
  projectId: string,
  input: SaveJiraConfigInput,
): Promise<ActionResult<{ projectName: string; jqlScopeSet: boolean; jqlMatchCount?: number }>> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'jira:manage')
    if (permError) return { success: false, error: permError }

    const project = await getProjectById(projectId)
    if (!project) return { success: false, error: 'Project not found' }

    const config: JiraConnectionConfig = {
      instanceUrl: input.instanceUrl,
      userEmail: input.userEmail,
      apiToken: input.apiToken,
      projectKey: input.jiraProjectKey,
      jqlScope: input.jqlScope,
    }

    const result = await testJiraConnection(config)
    if (!result.success) return { success: false, error: mapJiraError(result.error) }

    const jqlScope = input.jqlScope?.trim()
    let jqlMatchCount: number | undefined

    if (jqlScope) {
      const jqlResult = await validateJqlScope(config, jqlScope)
      if (!jqlResult.valid) {
        return {
          success: false,
          error: 'JQL scope is invalid. Check your JQL syntax and try again.',
        }
      }
      jqlMatchCount = jqlResult.count
    }

    return {
      success: true,
      data: {
        projectName: result.project.name,
        jqlScopeSet: !!jqlScope,
        jqlMatchCount,
      },
    }
  } catch {
    return { success: false, error: 'Connection test failed unexpectedly' }
  }
}

export async function saveJiraConfigAction(
  projectId: string,
  input: SaveJiraConfigInput,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'jira:manage')
    if (permError) return { success: false, error: permError }

    const project = await getProjectById(projectId)
    if (!project) return { success: false, error: 'Project not found' }

    const config: JiraConnectionConfig = {
      instanceUrl: input.instanceUrl,
      userEmail: input.userEmail,
      apiToken: input.apiToken,
      projectKey: input.jiraProjectKey,
      jqlScope: input.jqlScope,
    }

    const testResult = await testJiraConnection(config)
    if (!testResult.success) return { success: false, error: mapJiraError(testResult.error) }

    await upsertJiraConfig(projectId, input, true)
    revalidatePath(`/projects/${projectId}/settings`)
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to save Jira configuration' }
  }
}

export async function saveUnverifiedJiraConfigAction(
  projectId: string,
  input: SaveJiraConfigInput,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'jira:manage')
    if (permError) return { success: false, error: permError }

    const project = await getProjectById(projectId)
    if (!project) return { success: false, error: 'Project not found' }

    await upsertJiraConfig(projectId, input, false)
    revalidatePath(`/projects/${projectId}/settings`)
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to save Jira configuration' }
  }
}
