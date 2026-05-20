'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
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
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        No tasks found for this period.
      </p>
    )
  }

  return (
    <div>
      {/* Sort label */}
      <div className="flex justify-end mb-1">
        <span className="text-[11px] text-muted-foreground">Sorted by hours logged</span>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2 w-[88px]">
                Issue
              </th>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2">
                Summary
              </th>
              <th className="text-center text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2 w-24">
                Authors
              </th>
              <th className="text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2 w-24">
                Hours
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => (
              <tr
                key={task.issueKey}
                className="h-10 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onTaskClick(task)}
              >
                {/* Issue key — monospace, muted, fixed width */}
                <td className="px-4 w-[88px]">
                  {task.issueKey ? (
                    <Link
                      href={`${instanceUrl}/browse/${task.issueKey}`}
                      target="_blank"
                      rel="noopener"
                      className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.issueKey}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>

                {/* Summary — flex, truncated */}
                <td className="px-4 max-w-0">
                  <p className="text-sm truncate">{task.issueSummary}</p>
                </td>

                {/* Authors — center */}
                <td className="px-4 text-center w-24">
                  <div className="flex items-center justify-center gap-1.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm tabular-nums">{task.worklogAuthorCount}</span>
                  </div>
                </td>

                {/* Hours — right-aligned, bold, tabular-nums */}
                <td className="px-4 text-right w-24">
                  <span className="text-sm font-semibold tabular-nums">
                    {task.totalHours.toFixed(2)}h
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
