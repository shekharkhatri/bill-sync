'use client'

import Link from 'next/link'
import { Trash2, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EditTaskSummaryDialog } from '@/components/billings/EditTaskSummaryDialog'
import HoursInput from '@/components/billings/HoursInput'
import type { BillingTaskSummary } from '@/lib/billings/types'

interface BillingTaskEditorRowProps {
  billingId: string
  task: BillingTaskSummary
  isEditable: boolean
  localSeconds: number | null
  instanceUrl: string
  onHoursChange: (seconds: number | null) => void
  onSummaryEdited?: () => void
  onDelete?: (issueKey: string) => void
  disabled?: boolean
}

export default function BillingTaskEditorRow({
  billingId,
  task,
  isEditable,
  localSeconds,
  instanceUrl,
  onHoursChange,
  onSummaryEdited,
  onDelete,
  disabled,
}: BillingTaskEditorRowProps): React.JSX.Element {
  // A row is dirty if localSeconds has been set and differs from the DB effective value
  const isDirty = localSeconds !== null && localSeconds !== task.effectiveSeconds

  // Value passed to HoursInput: null means "no override, show original"
  // If DB already has a modification (effective != original), show that as the starting value
  const dbIsModified = task.effectiveSeconds !== task.totalOriginalSeconds
  const hoursInputValue = localSeconds !== null
    ? localSeconds
    : dbIsModified
      ? task.effectiveSeconds
      : null

  // Highlight billed in blue when it differs from original (in read-only view)
  const showsModifiedBilled = !isEditable && dbIsModified

  return (
    <TableRow className="h-10">
      {/* Issue — monospace, muted, fixed 88px */}
      <TableCell className="w-[88px] align-middle px-3 py-0">
        {task.isManual ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wrench className="h-3 w-3 shrink-0" />
            <span className="font-mono text-xs">manual</span>
          </div>
        ) : task.displayIssueKey ? (
          <Link
            href={`${instanceUrl}/browse/${task.displayIssueKey}`}
            target="_blank"
            rel="noopener"
            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {task.displayIssueKey}
          </Link>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Summary */}
      <TableCell className="align-middle px-3 py-0">
        <Tooltip>
          <TooltipTrigger render={<p className="text-sm truncate cursor-default max-w-0" />}>
            {task.displaySummary}
          </TooltipTrigger>
          <TooltipContent className="max-w-sm whitespace-normal">
            {task.displaySummary}
          </TooltipContent>
        </Tooltip>
        {isEditable && (
          <div className="mt-0.5">
            <EditTaskSummaryDialog
              billingId={billingId}
              issueKey={task.jiraIssueKey}
              currentSummary={task.displaySummary}
              isManual={task.isManual}
              jiraReferenceRemoved={task.jiraReferenceRemoved}
              onSuccess={onSummaryEdited}
            />
          </div>
        )}
      </TableCell>

      {/* Original hours — right-aligned, muted, 80px */}
      <TableCell className="w-[80px] text-right align-middle px-3 py-0">
        <span className="text-sm tabular-nums text-muted-foreground">
          {(task.totalOriginalSeconds / 3600).toFixed(2)}h
        </span>
      </TableCell>

      {/* Billed hours — right-aligned when read-only, blue when modified */}
      <TableCell className="w-[120px] align-middle px-3 py-0">
        {isEditable ? (
          <HoursInput
            value={hoursInputValue}
            originalSeconds={task.totalOriginalSeconds}
            onChange={onHoursChange}
            disabled={disabled}
            max={9999}
          />
        ) : (
          <span
            className={`text-sm font-medium tabular-nums ${
              showsModifiedBilled ? 'text-blue-600' : ''
            }`}
          >
            {(task.effectiveSeconds / 3600).toFixed(2)}h
          </span>
        )}
      </TableCell>

      {/* Dirty dot */}
      <TableCell className="w-6 align-middle px-1 py-0">
        {isDirty ? (
          <Tooltip>
            <TooltipTrigger render={<div className="h-2 w-2 rounded-full bg-warning-600 mx-auto" />} />
            <TooltipContent>Unsaved change</TooltipContent>
          </Tooltip>
        ) : (
          <div className="h-2 w-2 rounded-full bg-transparent mx-auto" />
        )}
      </TableCell>

      {/* Delete */}
      <TableCell className="w-12 align-middle px-2 py-0">
        {isEditable && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete?.(task.jiraIssueKey)}
                  disabled={disabled}
                />
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete task</span>
            </TooltipTrigger>
            <TooltipContent>Delete task</TooltipContent>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  )
}
