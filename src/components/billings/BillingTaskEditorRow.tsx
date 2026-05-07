'use client'

import Link from 'next/link'
import { Trash2, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
  onDeleteManual?: (issueKey: string) => void
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
  onDeleteManual,
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

  return (
    <TableRow>
      {/* Issue */}
      <TableCell className="w-36 align-top">
        {task.isManual ? (
          <Badge variant="secondary" className="text-xs">
            <Wrench className="h-3 w-3 mr-1" />
            Manual
          </Badge>
        ) : task.displayIssueKey ? (
          <Link
            href={`${instanceUrl}/browse/${task.displayIssueKey}`}
            target="_blank"
            rel="noopener"
          >
            <Badge variant="outline" className="font-mono text-xs hover:bg-accent cursor-pointer">
              {task.displayIssueKey}
            </Badge>
          </Link>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Jira ref hidden
          </Badge>
        )}
      </TableCell>

      {/* Summary */}
      <TableCell className="align-top">
        <Tooltip>
          <TooltipTrigger render={<p className="text-sm truncate cursor-default" />}>
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

      {/* Original hours */}
      <TableCell className="w-36 text-right align-top">
        <span className="text-sm text-muted-foreground">
          {(task.totalOriginalSeconds / 3600).toFixed(2)}h
        </span>
      </TableCell>

      {/* Billed hours — editable */}
      <TableCell className="w-44 align-top">
        {isEditable ? (
          <HoursInput
            value={hoursInputValue}
            originalSeconds={task.totalOriginalSeconds}
            onChange={onHoursChange}
            disabled={disabled}
            max={9999}
          />
        ) : (
          <span className="text-sm font-medium">
            {(task.effectiveSeconds / 3600).toFixed(2)}h
          </span>
        )}
      </TableCell>

      {/* Dirty dot */}
      <TableCell className="w-6 align-top">
        {isDirty ? (
          <Tooltip>
            <TooltipTrigger render={<div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 mx-auto" />} />
            <TooltipContent>Unsaved change</TooltipContent>
          </Tooltip>
        ) : (
          <div className="h-2 w-2 rounded-full bg-transparent mx-auto" />
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="w-12 align-top">
        {isEditable && task.isManual && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDeleteManual?.(task.jiraIssueKey)}
                  disabled={disabled}
                />
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Remove manual task</span>
            </TooltipTrigger>
            <TooltipContent>Remove manual task</TooltipContent>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  )
}
