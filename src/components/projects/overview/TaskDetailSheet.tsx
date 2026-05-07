'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatHours } from '@/lib/jira/format-utils'
import type { OverviewTaskSummary } from '@/lib/jira/overview-types'

interface TaskDetailSheetProps {
  task: OverviewTaskSummary | null
  instanceUrl: string
  onClose: () => void
}

export function TaskDetailSheet({
  task,
  instanceUrl,
  onClose,
}: TaskDetailSheetProps): React.JSX.Element {
  const totalWorklogs = task?.authors.reduce((s, a) => s + a.worklogCount, 0) ?? 0

  return (
    <Sheet open={task !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            {task && (
              <>
                <Link
                  href={`${instanceUrl}/browse/${task.issueKey}`}
                  target="_blank"
                  rel="noopener"
                >
                  <Badge variant="outline" className="font-mono">
                    {task.issueKey}
                  </Badge>
                </Link>
                <span className="text-base font-medium">{task.issueSummary}</span>
              </>
            )}
          </SheetTitle>
          <SheetDescription>Worklog author breakdown for this task.</SheetDescription>
        </SheetHeader>

        {task && (
          <div className="mt-5">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total Hours', value: task.totalHours.toFixed(2) + 'h' },
                { label: 'Worklog Authors', value: String(task.worklogAuthorCount) },
                { label: 'Total Worklogs', value: String(totalWorklogs) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold tabular-nums mt-0.5">{stat.value}</p>
                </div>
              ))}
            </div>

            <p className="text-sm font-semibold mb-3">Hours by Worklog Author</p>
            <p className="text-xs text-muted-foreground mb-4">
              Each entry below represents a team member who logged time on this task.
            </p>

            <div className="space-y-3">
              {task.authors.map((author) => (
                <div key={author.accountId} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-sm">
                          {author.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{author.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {author.worklogCount} worklog{' '}
                          {author.worklogCount !== 1 ? 'entries' : 'entry'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold tabular-nums">
                        {author.hours.toFixed(2)}h
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatHours(author.seconds)}
                      </p>
                    </div>
                  </div>

                  {/* Share bar — dynamic percentage requires inline style */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary rounded-full h-1.5 transition-all"
                        style={{
                          width:
                            Math.round((author.seconds / task.totalSeconds) * 100) + '%',
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                      {Math.round((author.seconds / task.totalSeconds) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
