'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  CircleDot,
  GripVertical,
  Inbox,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  Wrench,
} from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
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
import SortableTaskRow from '@/components/billings/SortableTaskRow'
import HoursInput from '@/components/billings/HoursInput'
import { Badge } from '@/components/ui/badge'
import {
  updateTaskHoursAction,
  resetAllWorklogsAction,
  deleteTaskAction,
  reorderTasksAction,
} from '@/lib/billings/actions'
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

function sortByOrder(tasks: BillingTaskSummary[]): BillingTaskSummary[] {
  return [...tasks].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
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

  // Local ordered task list — drives display order and DnD
  const [taskOrder, setTaskOrder] = useState<BillingTaskSummary[]>(() => sortByOrder(tasks))
  const [activeTask, setActiveTask] = useState<BillingTaskSummary | null>(null)
  const [isOrderDirty, setIsOrderDirty] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)

  // Sync taskOrder when tasks prop changes (after router.refresh())
  useEffect(() => {
    setTaskOrder(sortByOrder(tasks))
    setIsOrderDirty(false)
  }, [tasks])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const taskMap = Object.fromEntries(taskOrder.map((t) => [t.jiraIssueKey, t]))

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

  function handleDeleteTask(issueKey: string): void {
    startDeleteTransition(async () => {
      const result = await deleteTaskAction(billingId, issueKey)
      if (result.success) {
        router.refresh()
      } else {
        setSaveError(result.error)
      }
    })
  }

  function handleDragStart(event: DragStartEvent): void {
    const task = taskOrder.find((t) => t.jiraIssueKey === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    setActiveTask(null)

    if (!over || active.id === over.id) return

    const oldIndex = taskOrder.findIndex((t) => t.jiraIssueKey === active.id)
    const newIndex = taskOrder.findIndex((t) => t.jiraIssueKey === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // Local reorder only — user must click "Save Order" to persist
    const reordered = arrayMove(taskOrder, oldIndex, newIndex)
    setTaskOrder(reordered)
    setIsOrderDirty(true)
  }

  async function handleSaveOrder(): Promise<void> {
    setIsSavingOrder(true)
    setSaveError(null)
    try {
      const orderedKeys = taskOrder.map((t) => t.jiraIssueKey)
      const result = await reorderTasksAction(billingId, orderedKeys)
      if (result.success) {
        setIsOrderDirty(false)
      } else {
        setSaveError(result.error)
      }
    } finally {
      setIsSavingOrder(false)
    }
  }

  const isBusy = isSaving || isResetting || isSavingOrder

  const totalEffectiveHours =
    taskOrder.reduce((sum, t) => {
      const local = edits[t.jiraIssueKey]
      return sum + (local !== null ? local : t.effectiveSeconds)
    }, 0) / 3600

  const manualCount = taskOrder.filter((t) => t.isManual).length

  return (
    <div>
      {/* Toolbar */}
      {isEditable && (
        <div className="flex items-center justify-between mb-3">
          {/* Left: status indicators + drag hint */}
          <div className="flex items-center gap-3">
            {dirtyCount > 0 ? (
              <div className="flex items-center gap-1.5 text-[13px] text-amber-600">
                <CircleDot className="h-3.5 w-3.5" />
                {dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}
              </div>
            ) : (
              <p className="text-[13px] text-neutral-400">No unsaved changes</p>
            )}

            {isOrderDirty && dirtyCount > 0 && (
              <span className="text-neutral-200">·</span>
            )}

            {isOrderDirty && (
              <div className="flex items-center gap-1.5 text-[13px] text-amber-600">
                <GripVertical className="h-3.5 w-3.5" />
                Order changed
              </div>
            )}

            {!isOrderDirty && !isSavingOrder && taskOrder.length > 1 && (
              <div className="flex items-center gap-1.5 text-[13px] text-neutral-400 select-none">
                <GripVertical className="h-3.5 w-3.5" />
                Drag rows to reorder
              </div>
            )}
          </div>

          {/* Right: Save Order | Add Task | Reset All | Save Changes */}
          <div className="flex items-center gap-2">
            {isOrderDirty && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveOrder}
                  disabled={isBusy}
                  className="h-8 px-3 text-[13px] gap-1.5"
                >
                  {isSavingOrder ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  )}
                  {isSavingOrder ? 'Saving Order...' : 'Save Order'}
                </Button>
                <Separator orientation="vertical" className="h-4 mx-1" />
              </>
            )}

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

      {taskOrder.length === 0 ? (
        <div className="border border-dashed border-border rounded-md py-12 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No tasks found for this billing period.</p>
          {isEditable && (
            <p className="text-xs text-muted-foreground mt-1">
              Pull worklogs from Jira or add a manual task above.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {taskOrder.map((task) => {
              const local = getLocalSeconds(task)
              const isDirty = local !== null && local !== task.effectiveSeconds
              const dbIsModified = task.effectiveSeconds !== task.totalOriginalSeconds
              const hoursInputValue = local !== null ? local : dbIsModified ? task.effectiveSeconds : null

              return (
                <Card key={task.jiraIssueKey} className={isDirty ? 'border-amber-300' : ''}>
                  <CardContent className="pt-3 pb-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {task.isManual ? (
                          <Badge variant="secondary" className="text-xs">
                            <Wrench className="h-3 w-3 mr-1" />
                            Manual
                          </Badge>
                        ) : task.displayIssueKey ? (
                          <a
                            href={`${instanceUrl}/browse/${task.displayIssueKey}`}
                            target="_blank"
                            rel="noopener"
                          >
                            <Badge variant="outline" className="font-mono text-xs hover:bg-accent cursor-pointer">
                              {task.displayIssueKey}
                            </Badge>
                          </a>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Jira ref hidden
                          </Badge>
                        )}
                        {isDirty && (
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      {isEditable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteTask(task.jiraIssueKey)}
                          disabled={isBusy}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm">{task.displaySummary}</p>

                    <div className="flex items-center gap-3 pt-1">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Original</p>
                        <p className="text-sm text-muted-foreground">
                          {(task.totalOriginalSeconds / 3600).toFixed(2)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Billed</p>
                        {isEditable ? (
                          <HoursInput
                            value={hoursInputValue}
                            originalSeconds={task.totalOriginalSeconds}
                            onChange={(seconds) => handleHoursChange(task.jiraIssueKey, seconds)}
                            disabled={isBusy}
                            max={9999}
                          />
                        ) : (
                          <p className="text-sm font-medium">
                            {(task.effectiveSeconds / 3600).toFixed(2)}h
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <div className="flex justify-between items-center px-1 pt-1 border-t">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-medium">{totalEffectiveHours.toFixed(2)}h</span>
            </div>
          </div>

          {/* Desktop table with drag & drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={taskOrder.map((t) => t.jiraIssueKey)}
              strategy={verticalListSortingStrategy}
            >
              <div className="hidden md:block border border-border rounded-md overflow-hidden">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-border">
                      <TableHead className="w-8" />
                      <TableHead className="w-[88px] text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                        Issue
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                        Summary
                      </TableHead>
                      <TableHead className="w-[80px] text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                        Original
                      </TableHead>
                      <TableHead className="w-[120px] text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                        Billed
                      </TableHead>
                      <TableHead className="w-6" />
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {taskOrder.map((task) => (
                      <SortableTaskRow
                        key={task.jiraIssueKey}
                        id={task.jiraIssueKey}
                        disabled={!isEditable || isSaving || isResetting || isSavingOrder}
                      >
                        {({ nodeRef, dragStyle, dragHandleListeners, dragHandleAttributes, isDragging }) => (
                          <BillingTaskEditorRow
                            billingId={billingId}
                            task={task}
                            isEditable={isEditable}
                            localSeconds={getLocalSeconds(task)}
                            instanceUrl={instanceUrl}
                            onHoursChange={(seconds) => handleHoursChange(task.jiraIssueKey, seconds)}
                            onSummaryEdited={() => router.refresh()}
                            onDelete={handleDeleteTask}
                            disabled={isBusy}
                            showDragHandle={isEditable}
                            dragHandleListeners={dragHandleListeners}
                            dragHandleAttributes={dragHandleAttributes}
                            isDragging={isDragging}
                            nodeRef={nodeRef}
                            dragStyle={dragStyle}
                          />
                        )}
                      </SortableTaskRow>
                    ))}
                  </TableBody>

                  <TableFooter>
                    <TableRow className="bg-gray-50 border-t border-border font-medium">
                      <TableCell colSpan={4} className="text-right text-[13px] text-muted-foreground px-3 py-2">
                        Total
                      </TableCell>
                      <TableCell className="text-[13px] font-semibold tabular-nums px-3 py-2">
                        {totalEffectiveHours.toFixed(2)}h
                      </TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </SortableContext>

            {/* Drag ghost overlay */}
            <DragOverlay>
              {activeTask ? (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white border border-neutral-200 rounded shadow-sm text-sm text-neutral-900 opacity-95 cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-neutral-400 shrink-0" />
                  {activeTask.displayIssueKey && (
                    <span className="font-mono text-[11px] border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-500 shrink-0">
                      {activeTask.displayIssueKey}
                    </span>
                  )}
                  <span className="truncate max-w-[300px]">{activeTask.displaySummary}</span>
                  <span className="ml-auto tabular-nums text-neutral-500 shrink-0">
                    {(activeTask.effectiveSeconds / 3600).toFixed(2)}h
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

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
