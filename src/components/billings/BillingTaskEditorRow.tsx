'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Trash2, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EditTaskSummaryDialog } from '@/components/billings/EditTaskSummaryDialog'
import { deleteManualTaskAction } from '@/lib/billings/actions'
import type { BillingTaskSummary } from '@/lib/billings/types'

interface BillingTaskEditorRowProps {
  billingId: string
  task: BillingTaskSummary
  isEditable: boolean
  instanceUrl: string
  onSummaryEdited?: () => void
  onDeleteManual?: (issueKey: string) => void
}

export default function BillingTaskEditorRow({
  billingId,
  task,
  isEditable,
  instanceUrl,
  onSummaryEdited,
  onDeleteManual,
}: BillingTaskEditorRowProps): React.JSX.Element {
  const [isDeleting, startDeleteTransition] = useTransition()

  function handleDelete(): void {
    startDeleteTransition(async () => {
      const result = await deleteManualTaskAction(billingId, task.jiraIssueKey)
      if (result.success) {
        onDeleteManual?.(task.jiraIssueKey)
      }
    })
  }

  const effectiveHours = task.effectiveSeconds / 3600

  return (
    <TableRow className={isDeleting ? 'opacity-50 pointer-events-none' : undefined}>
      {/* Issue cell */}
      <TableCell className="w-40 align-top">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
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
                <Badge
                  variant="outline"
                  className="font-mono text-xs hover:bg-accent cursor-pointer"
                >
                  {task.displayIssueKey}
                </Badge>
              </Link>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Jira ref hidden
              </Badge>
            )}
          </div>
        </div>
      </TableCell>

      {/* Summary cell */}
      <TableCell className="align-top">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm line-clamp-2 max-w-[280px]">{task.displaySummary}</p>
          {isEditable && (
            <div className="flex items-center gap-1 mt-0.5">
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
        </div>
      </TableCell>

      {/* Worklog authors cell */}
      <TableCell className="align-top">
        {task.isManual ? (
          <span className="text-xs text-muted-foreground italic">Manual entry</span>
        ) : (
          <span className="text-sm text-muted-foreground">{task.authors.join(', ')}</span>
        )}
      </TableCell>

      {/* Hours cell */}
      <TableCell className="text-right align-top">
        <span className="text-sm font-medium">{effectiveHours.toFixed(2)}h</span>
      </TableCell>

      {/* Entries cell */}
      <TableCell className="text-right text-sm text-muted-foreground align-top">
        {task.worklogCount}
      </TableCell>

      {/* Actions cell */}
      <TableCell className="w-12 align-top">
        {isEditable && task.isManual && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
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
