import { sql } from 'kysely'
import { db } from '@/lib/db/client'
import { encrypt, decrypt, maskToken } from '@/lib/crypto/encryption'
import type { ProjectJiraConfig, ProjectJiraConfigDisplay, SaveJiraConfigInput } from '@/lib/jira/config-types'
import type { JiraConnectionConfig } from '@/lib/jira/types'

function mapConfig(row: {
  id: string
  project_id: string
  instance_url: string
  jira_project_key: string
  user_email: string
  encrypted_api_token: string
  is_verified: boolean
  last_verified_at: Date | null
  jql_scope: string | null
  created_at: Date
  updated_at: Date
}): ProjectJiraConfig {
  return {
    id: row.id,
    projectId: row.project_id,
    instanceUrl: row.instance_url,
    jiraProjectKey: row.jira_project_key,
    userEmail: row.user_email,
    encryptedApiToken: row.encrypted_api_token,
    isVerified: row.is_verified,
    lastVerifiedAt: row.last_verified_at,
    jqlScope: row.jql_scope,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getJiraConfig(projectId: string): Promise<ProjectJiraConfig | null> {
  const row = await db
    .selectFrom('project_jira_configs')
    .selectAll()
    .where('project_id', '=', projectId)
    .executeTakeFirst()

  return row ? mapConfig(row) : null
}

export async function getJiraConfigForDisplay(
  projectId: string,
): Promise<ProjectJiraConfigDisplay | null> {
  const config = await getJiraConfig(projectId)
  if (!config) return null

  const plaintext = decrypt(config.encryptedApiToken)

  return {
    id: config.id,
    projectId: config.projectId,
    instanceUrl: config.instanceUrl,
    jiraProjectKey: config.jiraProjectKey,
    userEmail: config.userEmail,
    maskedApiToken: maskToken(plaintext),
    isVerified: config.isVerified,
    lastVerifiedAt: config.lastVerifiedAt,
    jqlScope: config.jqlScope,
  }
}

/**
 * Returns decrypted Jira credentials. Only call this immediately
 * before making a Jira API request. Never store or pass the result beyond
 * the calling function's scope.
 */
export async function getDecryptedJiraConfig(
  projectId: string,
): Promise<JiraConnectionConfig | null> {
  const config = await getJiraConfig(projectId)
  if (!config) return null

  return {
    instanceUrl: config.instanceUrl,
    userEmail: config.userEmail,
    apiToken: decrypt(config.encryptedApiToken),
    projectKey: config.jiraProjectKey,
    jqlScope: config.jqlScope,
  }
}

// Note: project_jira_configs.project_id must have a UNIQUE constraint for upsert to work.
// Run in Supabase SQL editor if not already applied:
// ALTER TABLE project_jira_configs ADD CONSTRAINT project_jira_configs_project_id_unique UNIQUE (project_id);
export async function upsertJiraConfig(
  projectId: string,
  input: SaveJiraConfigInput,
  verified: boolean,
): Promise<void> {
  const encryptedToken = encrypt(input.apiToken)
  const now = new Date()
  const jqlScope = input.jqlScope?.trim() || null

  await db
    .insertInto('project_jira_configs')
    .values({
      project_id: projectId,
      instance_url: input.instanceUrl,
      jira_project_key: input.jiraProjectKey,
      user_email: input.userEmail,
      encrypted_api_token: encryptedToken,
      is_verified: verified,
      last_verified_at: verified ? now : null,
      jql_scope: jqlScope,
      updated_at: now,
    })
    .onConflict((oc) =>
      oc.column('project_id').doUpdateSet({
        instance_url: input.instanceUrl,
        jira_project_key: input.jiraProjectKey,
        user_email: input.userEmail,
        encrypted_api_token: encryptedToken,
        is_verified: verified,
        last_verified_at: verified ? now : sql`last_verified_at`,
        jql_scope: jqlScope,
        updated_at: now,
      }),
    )
    .execute()
}
