import type { UpdateWorklogInput, WorklogWithEffective } from '@/lib/billings/types'

export interface WorklogEditState {
  worklogId: string
  modifiedSeconds: number | null
  modifiedComment: string | null
  isDirty: boolean
}

export interface EditorState {
  edits: Record<string, WorklogEditState>
  hasAnyDirty: boolean
}

export function createInitialEditorState(worklogs: WorklogWithEffective[]): EditorState {
  const edits: Record<string, WorklogEditState> = {}
  for (const worklog of worklogs) {
    edits[worklog.id] = {
      worklogId: worklog.id,
      modifiedSeconds: worklog.modifiedSeconds,
      modifiedComment: worklog.modifiedComment,
      isDirty: worklog.isModified,
    }
  }
  return {
    edits,
    hasAnyDirty: worklogs.some((w) => w.isModified),
  }
}

export function applyWorklogEdit(
  state: EditorState,
  worklogId: string,
  field: 'modifiedSeconds' | 'modifiedComment',
  value: number | string | null,
): EditorState {
  const existing = state.edits[worklogId]
  if (!existing) return state

  const updated: WorklogEditState = {
    ...existing,
    [field]: value,
  }
  updated.isDirty = updated.modifiedSeconds !== null || updated.modifiedComment !== null

  const edits = { ...state.edits, [worklogId]: updated }
  return {
    edits,
    hasAnyDirty: Object.values(edits).some((e) => e.isDirty),
  }
}

export function resetWorklogEdit(state: EditorState, worklogId: string): EditorState {
  const existing = state.edits[worklogId]
  if (!existing) return state

  const edits = {
    ...state.edits,
    [worklogId]: {
      worklogId,
      modifiedSeconds: null,
      modifiedComment: null,
      isDirty: false,
    },
  }
  return {
    edits,
    hasAnyDirty: Object.values(edits).some((e) => e.isDirty),
  }
}

export function resetAllEdits(state: EditorState): EditorState {
  const edits: Record<string, WorklogEditState> = {}
  for (const [id, edit] of Object.entries(state.edits)) {
    edits[id] = {
      worklogId: edit.worklogId,
      modifiedSeconds: null,
      modifiedComment: null,
      isDirty: false,
    }
  }
  return { edits, hasAnyDirty: false }
}

export function getDirtyUpdates(state: EditorState): UpdateWorklogInput[] {
  return Object.values(state.edits)
    .filter((e) => e.isDirty)
    .map((e) => ({
      worklogId: e.worklogId,
      modifiedSeconds: e.modifiedSeconds,
      modifiedComment: e.modifiedComment,
    }))
}
