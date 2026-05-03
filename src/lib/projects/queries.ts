import { sql } from 'kysely'
import { db } from '@/lib/db/client'
import type { Project, ProjectWithJiraStatus, CreateProjectInput } from '@/lib/projects/types'

function mapProject(row: {
  id: string
  name: string
  client_name: string
  description: string | null
  color: string | null
  status: string
  created_by: string | null
  created_at: Date | null
  deleted_at: Date | null
}): Project {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    description: row.description,
    color: row.color,
    status: row.status as 'active' | 'archived',
    createdBy: row.created_by,
    createdAt: row.created_at ?? new Date(),
    deletedAt: row.deleted_at,
  }
}

/** Returns all active projects with their Jira config status. */
export async function getProjects(userId: string): Promise<ProjectWithJiraStatus[]> {
  const rows = await db
    .selectFrom('projects as p')
    .leftJoin('project_jira_configs as jc', 'jc.project_id', 'p.id')
    .select([
      'p.id',
      'p.name',
      'p.client_name',
      'p.description',
      'p.color',
      'p.status',
      'p.created_by',
      'p.created_at',
      'p.deleted_at',
      sql<boolean>`jc.id IS NOT NULL`.as('has_jira_config'),
      'jc.jira_project_key',
      'jc.is_verified',
    ])
    .where('p.deleted_at', 'is', null)
    .where('p.status', '=', 'active')
    .orderBy('p.created_at', 'desc')
    .execute()

  // userId param reserved for future per-user filtering (e.g. project membership)
  void userId

  return rows.map((row) => ({
    ...mapProject(row),
    hasJiraConfig: row.has_jira_config,
    jiraProjectKey: row.jira_project_key ?? null,
    jiraVerified: row.is_verified ?? null,
  }))
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const row = await db
    .selectFrom('projects')
    .selectAll()
    .where('id', '=', projectId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  return row ? mapProject(row) : null
}

export async function getProjectWithJiraStatus(
  projectId: string,
): Promise<ProjectWithJiraStatus | null> {
  const row = await db
    .selectFrom('projects as p')
    .leftJoin('project_jira_configs as jc', 'jc.project_id', 'p.id')
    .select([
      'p.id',
      'p.name',
      'p.client_name',
      'p.description',
      'p.color',
      'p.status',
      'p.created_by',
      'p.created_at',
      'p.deleted_at',
      sql<boolean>`jc.id IS NOT NULL`.as('has_jira_config'),
      'jc.jira_project_key',
      'jc.is_verified',
    ])
    .where('p.id', '=', projectId)
    .where('p.deleted_at', 'is', null)
    .executeTakeFirst()

  if (!row) return null

  return {
    ...mapProject(row),
    hasJiraConfig: row.has_jira_config,
    jiraProjectKey: row.jira_project_key ?? null,
    jiraVerified: row.is_verified ?? null,
  }
}

export async function createProject(
  input: CreateProjectInput,
  createdBy: string,
): Promise<Project> {
  const row = await db
    .insertInto('projects')
    .values({
      name: input.name,
      client_name: input.clientName,
      description: input.description ?? null,
      color: input.color ?? null,
      status: 'active',
      created_by: createdBy,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return mapProject(row)
}

export async function archiveProject(projectId: string): Promise<void> {
  await db
    .updateTable('projects')
    .set({ status: 'archived', deleted_at: new Date() })
    .where('id', '=', projectId)
    .execute()
}
