'use client'

import Link from 'next/link'
import { Users, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatHours } from '@/lib/jira/format-utils'
import type { OverviewTaskSummary } from '@/lib/jira/overview-types'

interface TaskListViewProps {
  tasks: OverviewTaskSummary[]
  instanceUrl: string
  onTaskClick: (task: OverviewTaskSummary) => void
}

export function TaskListView({
  tasks,
  instanceUrl,
  onTaskClick,
}: TaskListViewProps): React.JSX.Element {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-muted-foreground">Sorted by hours logged</span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No tasks found for this period.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Issue</TableHead>
              <TableHead className="text-center">Worklog Authors</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.issueKey}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onTaskClick(task)}
              >
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href={`${instanceUrl}/browse/${task.issueKey}`}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge
                        variant="outline"
                        className="font-mono text-xs w-fit hover:bg-accent"
                      >
                        {task.issueKey}
                      </Badge>
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                      {task.issueSummary}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{task.worklogAuthorCount}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {task.totalHours.toFixed(2)}h
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatHours(task.totalSeconds)}
                  </p>
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
