'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Inbox,
  Loader2,
  RotateCcw,
  Save,
  Wrench,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AddManualTaskDialog } from '@/components/billings/AddManualTaskDialog'
import BillingTaskEditorRow from '@/components/billings/BillingTaskEditorRow'
import { updateTaskHoursAction, resetAllWorklogsAction, deleteManualTaskAction } from '@/lib/billings/actions'
import type { BillingStatus, BillingTaskSummary } from '@/lib/billings/types'

interface BillingTaskEditorTableProps {
  billingId: string
  billingStatus: BillingStatus
  tasks: BillingTaskSummary[]
  instanceUrl: string
}

// localSeconds: null = not edited yet (use effectiveSeconds from DB)
type TaskEdits = Record<string, number | null>

function initEdits(tasks: BillingTaskSummary[]): TaskEdits {
  const edits: TaskEdits = {}
  for (const t of tasks) {
    edits[t.jiraIssueKey] = null
  }
  return edits
}

export default function BillingTaskEditorTable({
  billingId,
  billingStatus,
  tasks,
  instanceUrl,
}: BillingTaskEditorTableProps): React.JSX.Element {
  const isEditable = billingStatus === 'draft'
  const router = useRouter()
  const [edits, setEdits] = useState<TaskEdits>(() => initEdits(tasks))
  const [isSaving, startSavingTransition] = useTransition()
  const [isResetting, startResettingTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [, startDeleteTransition] = useTransition()

  const taskMap = Object.fromEntries(tasks.map((t) => [t.jiraIssueKey, t]))

  // A task is dirty if the local edit differs from the current DB effective value
  const dirtyKeys = Object.entries(edits)
    .filter(([key, local]) => {
      if (local === null) return false
      const task = taskMap[key]
      return task !== undefined && local !== task.effectiveSeconds
    })
    .map(([key]) => key)

  const dirtyCount = dirtyKeys.length

  function handleHoursChange(issueKey: string, seconds: number | null): void {
    setEdits((prev) => ({ ...prev, [issueKey]: seconds }))
    setSaveError(null)
    setSaveSuccess(null)
  }

  function getLocalSeconds(task: BillingTaskSummary): number | null {
    const local = edits[task.jiraIssueKey]
    if (local === null) return null
    // If user edited to match original, treat as null (no modification)
    if (local === task.totalOriginalSeconds) return null
    return local
  }

  function handleSave(): void {
    if (dirtyCount === 0) return

    startSavingTransition(async () => {
      const dirty = dirtyKeys.map((key) => {
        const local = edits[key]
        const task = taskMap[key]
        return {
          issueKey: key,
          seconds: local ?? task.effectiveSeconds,
        }
      })

      const results = await Promise.all(
        dirty.map(({ issueKey, seconds }) =>
          updateTaskHoursAction(billingId, issueKey, seconds),
        ),
      )

      const failed = results.find((r) => !r.success)
      if (failed && !failed.success) {
        setSaveError(failed.error)
        return
      }

      const plural = dirty.length === 1 ? '' : 's'
      setSaveSuccess(`${dirty.length} task${plural} saved.`)
      setTimeout(() => setSaveSuccess(null), 3000)
      router.refresh()
    })
  }

  function handleResetAll(): void {
    startResettingTransition(async () => {
      const result = await resetAllWorklogsAction(billingId)
      if (result.success) {
        setEdits(initEdits(tasks))
        setSaveSuccess('All hours reset to original.')
        router.refresh()
      } else {
        setSaveError(result.error)
      }
    })
  }

  function handleDeleteManual(issueKey: string): void {
    startDeleteTransition(async () => {
      const result = await deleteManualTaskAction(billingId, issueKey)
      if (result.success) {
        router.refresh()
      } else {
        setSaveError(result.error)
      }
    })
  }

  const isBusy = isSaving || isResetting

  const totalEffectiveHours =
    tasks.reduce((sum, t) => {
      const local = edits[t.jiraIssueKey]
      return sum + (local !== null ? local : t.effectiveSeconds)
    }, 0) / 3600

  const manualCount = tasks.filter((t) => t.isManual).length

  return (
    <div>
      {/* Toolbar */}
      {isEditable && (
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

          <div className="flex items-center gap-2">
            <AddManualTaskDialog billingId={billingId} onSuccess={() => router.refresh()} />

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              disabled={isBusy}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {isResetting ? 'Resetting...' : 'Reset All'}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={dirtyCount === 0 || isBusy}
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
        </div>
      )}

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

      {tasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No tasks found for this billing period.</p>
            {isEditable && (
              <p className="text-xs text-muted-foreground mt-1">
                Pull worklogs from Jira or add a manual task above.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-36">Issue</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="w-36 text-right">Original</TableHead>
                    <TableHead className="w-44">Billed</TableHead>
                    <TableHead className="w-6" />
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tasks.map((task) => (
                    <BillingTaskEditorRow
                      key={task.jiraIssueKey}
                      billingId={billingId}
                      task={task}
                      isEditable={isEditable}
                      localSeconds={getLocalSeconds(task)}
                      instanceUrl={instanceUrl}
                      onHoursChange={(seconds) => handleHoursChange(task.jiraIssueKey, seconds)}
                      onSummaryEdited={() => router.refresh()}
                      onDeleteManual={handleDeleteManual}
                      disabled={isBusy}
                    />
                  ))}
                </TableBody>

                <TableFooter>
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={3} className="text-right text-sm">Total</TableCell>
                    <TableCell className="text-sm pl-3">
                      {totalEffectiveHours.toFixed(2)}h
                    </TableCell>
                    <TableCell />
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>

          {manualCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-right">
              <Wrench className="h-3 w-3 inline mr-1" />
              {manualCount} manual task{manualCount !== 1 ? 's' : ''} included in totals
            </p>
          )}
        </>
      )}
    </div>
  )
}
