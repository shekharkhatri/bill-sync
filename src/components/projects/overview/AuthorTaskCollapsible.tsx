'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { OverviewAuthorTaskEntry } from '@/lib/jira/overview-types'

interface AuthorTaskCollapsibleProps {
  tasks: OverviewAuthorTaskEntry[]
  instanceUrl: string
}

export function AuthorTaskCollapsible({
  tasks,
  instanceUrl,
}: AuthorTaskCollapsibleProps): React.JSX.Element {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 h-7 text-xs justify-start gap-1.5"
          />
        }
      >
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
        />
        {open
          ? 'Hide tasks'
          : `Show ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 space-y-0.5 border rounded-md overflow-hidden">
          {tasks.map((task) => (
            <div
              key={task.issueKey}
              className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 border-b last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  href={`${instanceUrl}/browse/${task.issueKey}`}
                  target="_blank"
                  rel="noopener"
                >
                  <Badge variant="outline" className="font-mono text-xs shrink-0">
                    {task.issueKey}
                  </Badge>
                </Link>
                <p className="text-xs text-muted-foreground truncate">{task.issueSummary}</p>
              </div>
              <div className="shrink-0 ml-3 text-right">
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
      </CollapsibleContent>
    </Collapsible>
  )
}
