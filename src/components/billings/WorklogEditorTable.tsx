'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Inbox,
  Loader2,
  RotateCcw,
  Save,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  saveWorklogsAction,
  resetAllWorklogsAction,
  deleteWorklogRowAction,
} from '@/lib/billings/actions'
import {
  createInitialEditorState,
  applyWorklogEdit,
  resetWorklogEdit,
  resetAllEdits,
  getDirtyUpdates,
} from '@/lib/billings/worklog-store'
import WorklogEditorRow from '@/components/billings/WorklogEditorRow'
import { AddManualRowDialog } from '@/components/billings/AddManualRowDialog'
import type { BillingStatus, WorklogWithEffective } from '@/lib/billings/types'
import type { EditorState } from '@/lib/billings/worklog-store'

interface WorklogEditorTableProps {
  billingId: string
  billingStatus: BillingStatus
  worklogs: WorklogWithEffective[]
  instanceUrl: string
}

export default function WorklogEditorTable({
  billingId,
  billingStatus,
  worklogs,
  instanceUrl,
}: WorklogEditorTableProps): React.JSX.Element {
  const router = useRouter()
  const [editorState, setEditorState] = useState<EditorState>(() =>
    createInitialEditorState(worklogs),
  )
  const [isSaving, startSavingTransition] = useTransition()
  const [isResetting, startResettingTransition] = useTransition()
  const [isDeleting, startDeletingTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const worklogIds = useMemo(() => worklogs.map((w) => w.id).join(','), [worklogs])

  useEffect(() => {
    setEditorState(createInitialEditorState(worklogs))
    setSaveError(null)
    setSaveSuccess(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worklogIds])

  const isEditable = billingStatus === 'draft'
  const dirtyCount = Object.values(editorState.edits).filter((e) => e.isDirty).length

  function handleEdit(
    worklogId: string,
    field: 'modifiedSeconds' | 'modifiedComment',
    value: number | string | null,
  ): void {
    setEditorState(applyWorklogEdit(editorState, worklogId, field, value))
    setSaveError(null)
    setSaveSuccess(null)
  }

  function handleResetRow(worklogId: string): void {
    setEditorState(resetWorklogEdit(editorState, worklogId))
  }

  function handleResetAll(): void {
    startResettingTransition(async () => {
      const result = await resetAllWorklogsAction(billingId)
      if (result.success) {
        setEditorState(resetAllEdits(editorState))
        setSaveSuccess('All changes reset.')
      } else {
        setSaveError(result.error)
      }
    })
  }

  function handleSave(): void {
    const updates = getDirtyUpdates(editorState)
    if (updates.length === 0) return

    startSavingTransition(async () => {
      const result = await saveWorklogsAction(billingId, updates)
      if (result.success) {
        const savedCount = result.data.savedCount
        const plural = savedCount === 1 ? '' : 's'
        setSaveSuccess(`${savedCount} row${plural} saved.`)
        setTimeout(() => setSaveSuccess(null), 3000)
      } else {
        setSaveError(result.error)
      }
    })
  }

  function handleDeleteRow(worklogId: string): void {
    startDeletingTransition(async () => {
      const result = await deleteWorklogRowAction(worklogId)
      if (result.success) {
        router.refresh()
      } else {
        setSaveError(result.error)
      }
    })
  }

  const worklogMap = Object.fromEntries(worklogs.map((w) => [w.id, w]))

  const originalTotal = worklogs.reduce((sum, w) => sum + w.originalSeconds, 0) / 3600
  const effectiveTotal =
    Object.values(editorState.edits).reduce((sum, edit) => {
      const original = worklogMap[edit.worklogId]?.originalSeconds ?? 0
      return sum + (edit.modifiedSeconds ?? original)
    }, 0) / 3600

  const isBusy = isSaving || isResetting || isDeleting

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div>
          {dirtyCount > 0 ? (
            <p className="text-sm text-amber-600 flex items-center gap-1.5">
              <CircleDot className="h-3.5 w-3.5" />
              {dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No unsaved changes</p>
          )}
        </div>

        {isEditable && (
          <div className="flex items-center gap-2">
            <AddManualRowDialog billingId={billingId} onSuccess={() => router.refresh()} />

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              disabled={!editorState.hasAnyDirty || isBusy}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {isResetting ? 'Resetting...' : 'Reset All'}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!editorState.hasAnyDirty || isBusy}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isSaving
                ? 'Saving...'
                : `Save Changes${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
            </Button>
          </div>
        )}
      </div>

      {/* Success alert */}
      {saveSuccess && (
        <Alert className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{saveSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Error alert */}
      {saveError && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {worklogs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No line items in this billing period.</p>
            {isEditable && (
              <p className="text-xs text-muted-foreground mt-1">
                Pull from Jira or add a row manually using the buttons above.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[220px]">Task</TableHead>
                  <TableHead className="w-28 text-right">Original</TableHead>
                  <TableHead className="w-36">Modified</TableHead>
                  <TableHead className="min-w-[200px]">Internal Note</TableHead>
                  <TableHead className="w-6" />
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {worklogs.map((worklog) => (
                  <WorklogEditorRow
                    key={worklog.id}
                    worklog={worklog}
                    editState={editorState.edits[worklog.id]!}
                    onEdit={(field, value) => handleEdit(worklog.id, field, value)}
                    onReset={() => handleResetRow(worklog.id)}
                    onDelete={() => handleDeleteRow(worklog.id)}
                    disabled={!isEditable || isBusy}
                    instanceUrl={instanceUrl}
                  />
                ))}
              </TableBody>

              <TableFooter>
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell>Totals</TableCell>
                  <TableCell className="text-right text-sm">
                    {originalTotal.toFixed(2)}h
                  </TableCell>
                  <TableCell
                    className={`text-sm ${effectiveTotal !== originalTotal ? 'text-amber-600' : ''}`}
                  >
                    {effectiveTotal.toFixed(2)}h
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
