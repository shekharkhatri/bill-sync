'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { guardAction } from '@/lib/auth/permissions'
import { createProject, archiveProject, getProjectById } from '@/lib/projects/queries'
import { PROJECT_COLORS } from '@/lib/projects/types'
import type { CreateProjectInput, ProjectColor } from '@/lib/projects/types'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createProjectAction(
  input: CreateProjectInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireSession()

    const permError = await guardAction(user.id, 'project:create')
    if (permError) return { success: false, error: permError }

    const name = input.name?.trim()
    const clientName = input.clientName?.trim()
    const description = input.description?.trim()
    const color = input.color

    if (!name || name.length < 1 || name.length > 100) {
      return { success: false, error: 'Project name must be between 1 and 100 characters' }
    }
    if (!clientName || clientName.length < 1 || clientName.length > 100) {
      return { success: false, error: 'Client name must be between 1 and 100 characters' }
    }
    if (description && description.length > 500) {
      return { success: false, error: 'Description must be 500 characters or fewer' }
    }
    if (color && !Object.keys(PROJECT_COLORS).includes(color)) {
      return { success: false, error: 'Invalid color selection' }
    }

    const project = await createProject(
      { name, clientName, description, color: color as ProjectColor | undefined },
      user.id,
    )

    revalidatePath('/dashboard')
    return { success: true, data: { id: project.id } }
  } catch {
    return { success: false, error: 'Failed to create project' }
  }
}

export async function archiveProjectAction(
  projectId: string,
): Promise<ActionResult> {
  try {
    const user = await requireSession()

    const permError = await guardAction(user.id, 'project:archive')
    if (permError) return { success: false, error: permError }

    const project = await getProjectById(projectId)
    if (!project) return { success: false, error: 'Project not found' }

    await archiveProject(projectId)
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to archive project' }
  }
}
