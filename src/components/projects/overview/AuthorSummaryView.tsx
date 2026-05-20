'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatHours } from '@/lib/jira/format-utils'
import type { OverviewAuthorSummary } from '@/lib/jira/overview-types'

interface AuthorSummaryViewProps {
  authors: OverviewAuthorSummary[]
  instanceUrl: string
  totalProjectSeconds: number
}

interface AuthorSectionProps {
  author: OverviewAuthorSummary
  instanceUrl: string
  sharePercent: number
}

function AuthorSection({
  author,
  instanceUrl,
  sharePercent,
}: AuthorSectionProps): React.JSX.Element {
  const [open, setOpen] = useState(false)

  return (
    <div>
      {/* Author header row */}
      <div className="flex items-center justify-between h-12 px-4 bg-gray-50 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarFallback className="text-xs font-medium bg-blue-50 text-blue-600">
              {author.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{author.displayName}</span>
          <span className="text-xs text-muted-foreground">
            {author.taskCount} task{author.taskCount !== 1 ? 's' : ''} ·{' '}
            {formatHours(author.totalSeconds)}
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm font-semibold tabular-nums">
            {author.totalHours.toFixed(2)}h
          </span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Hide tasks' : `Show ${author.tasks.length} task${author.tasks.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Share bar — 3px, full width, dynamic percentage allowed via inline style */}
      <div className="h-[3px] bg-muted">
        <div
          className="h-[3px] bg-blue-400"
          style={{ width: sharePercent + '%' }}
        />
      </div>

      {/* Task rows — indented, same dense style */}
      {open && (
        <div className="divide-y divide-border">
          {author.tasks.map((task) => (
            <div
              key={task.issueKey}
              className="flex items-center justify-between h-10 pl-12 pr-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {task.issueKey ? (
                  <Link
                    href={`${instanceUrl}/browse/${task.issueKey}`}
                    target="_blank"
                    rel="noopener"
                    className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors w-20 shrink-0"
                  >
                    {task.issueKey}
                  </Link>
                ) : (
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">—</span>
                )}
                <p className="text-xs text-muted-foreground truncate">{task.issueSummary}</p>
              </div>
              <div className="shrink-0 ml-4 text-right">
                <span className="text-xs font-semibold tabular-nums">
                  {task.hours.toFixed(2)}h
                </span>
                <p className="text-[10px] text-muted-foreground">
                  {task.worklogCount} worklog{task.worklogCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AuthorSummaryView({
  authors,
  instanceUrl,
  totalProjectSeconds,
}: AuthorSummaryViewProps): React.JSX.Element {
  if (authors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        No time logged in this period.
      </p>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-1">
        <span className="text-[11px] text-muted-foreground">
          {authors.length} worklog author{authors.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className={cn('border border-border rounded-md overflow-hidden divide-y divide-border')}>
        {authors.map((author) => {
          const sharePercent =
            totalProjectSeconds > 0
              ? Math.round((author.totalSeconds / totalProjectSeconds) * 100)
              : 0

          return (
            <AuthorSection
              key={author.accountId}
              author={author}
              instanceUrl={instanceUrl}
              sharePercent={sharePercent}
            />
          )
        })}
      </div>
    </div>
  )
}
