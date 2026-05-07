'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RotateCcw, Trash2, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import HoursInput from '@/components/billings/HoursInput'
import { EditWorklogSummaryDialog } from '@/components/billings/EditWorklogSummaryDialog'
import type { WorklogWithEffective } from '@/lib/billings/types'
import type { WorklogEditState } from '@/lib/billings/worklog-store'

interface WorklogEditorRowProps {
  worklog: WorklogWithEffective
  editState: WorklogEditState
  onEdit: (field: 'modifiedSeconds' | 'modifiedComment', value: number | string | null) => void
  onReset: () => void
  onDelete: () => void
  disabled: boolean
  instanceUrl: string
}

export default function WorklogEditorRow({
  worklog,
  editState,
  onEdit,
  onReset,
  onDelete,
  disabled,
  instanceUrl,
}: WorklogEditorRowProps): React.JSX.Element {
  const router = useRouter()

  return (
    <TableRow>
      {/* Task */}
      <TableCell className="min-w-[220px]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            {worklog.isManual ? (
              <Badge variant="secondary" className="text-[10px] w-fit mb-0.5">
                <Wrench className="h-2.5 w-2.5 mr-1" />
                Manual
              </Badge>
            ) : worklog.displayIssueKey ? (
              <Link
                href={`${instanceUrl}/browse/${worklog.displayIssueKey}`}
                target="_blank"
                rel="noopener"
              >
                <Badge variant="outline" className="font-mono text-xs hover:bg-accent cursor-pointer">
                  {worklog.displayIssueKey}
                </Badge>
              </Link>
            ) : null}

            {!disabled && (
              <EditWorklogSummaryDialog
                worklogId={worklog.id}
                currentSummary={worklog.displaySummary}
                jiraIssueKey={worklog.jiraIssueKey}
                jiraReferenceRemoved={worklog.jiraReferenceRemoved}
                isManual={worklog.isManual}
                onSuccess={() => router.refresh()}
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {worklog.displaySummary}
          </p>
        </div>
      </TableCell>

      {/* Original hours */}
      <TableCell className="w-28 text-right">
        <span className="text-sm text-muted-foreground">
          {(worklog.originalSeconds / 3600).toFixed(2)}h
        </span>
      </TableCell>

      {/* Modified hours */}
      <TableCell className="w-36">
        {disabled ? (
          <span className="text-sm">
            {editState.modifiedSeconds !== null
              ? (editState.modifiedSeconds / 3600).toFixed(2) + 'h'
              : '—'}
          </span>
        ) : (
          <HoursInput
            value={editState.modifiedSeconds}
            originalSeconds={worklog.originalSeconds}
            onChange={(seconds) => onEdit('modifiedSeconds', seconds)}
            disabled={disabled}
          />
        )}
      </TableCell>

      {/* Internal note */}
      <TableCell className="min-w-[200px]">
        {disabled ? (
          editState.modifiedComment ? (
            <p className="text-xs text-muted-foreground">{editState.modifiedComment}</p>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )
        ) : (
          <Textarea
            value={editState.modifiedComment ?? ''}
            onChange={(e) => onEdit('modifiedComment', e.target.value || null)}
            placeholder="Add internal note..."
            className="text-xs min-h-[36px] resize-none"
            rows={1}
            maxLength={1000}
            disabled={disabled}
          />
        )}
      </TableCell>

      {/* Dirty dot */}
      <TableCell className="w-6">
        {editState.isDirty ? (
          <Tooltip>
            <TooltipTrigger render={<div className="h-2 w-2 rounded-full bg-amber-500 mx-auto" />} />
            <TooltipContent>Modified</TooltipContent>
          </Tooltip>
        ) : (
          <div className="h-2 w-2 rounded-full bg-transparent mx-auto" />
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="w-20">
        {!disabled && (
          <div className="flex items-center gap-1">
            {!worklog.isManual && editState.isDirty && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onReset}
                    />
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Reset to original</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                  />
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>Delete this row</TooltipContent>
            </Tooltip>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}
