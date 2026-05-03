import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatHours, formatDateShort } from '@/lib/jira/live-hours'
import type { JiraWorklogPreviewEntry } from '@/lib/jira/dashboard-types'

interface RecentWorklogsTableProps {
  worklogs: JiraWorklogPreviewEntry[]
  instanceUrl: string
}

export function RecentWorklogsTable({
  worklogs,
  instanceUrl,
}: RecentWorklogsTableProps): React.JSX.Element {
  if (worklogs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No worklogs found for this period.
      </p>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium">Recent Worklogs</span>
        <span className="text-xs text-muted-foreground">
          Showing last {worklogs.length} entries
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Time</TableHead>
              <TableHead>Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {worklogs.map((worklog) => (
              <TableRow key={worklog.worklogId}>
                <TableCell>
                  <Link
                    href={`${instanceUrl}/browse/${worklog.issueKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge
                      variant="outline"
                      className="font-mono text-xs hover:bg-accent cursor-pointer"
                    >
                      {worklog.issueKey}
                    </Badge>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {worklog.issueSummary}
                  </p>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {worklog.authorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{worklog.authorName}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDateShort(worklog.workStarted)}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <span className="text-sm font-medium">
                    {worklog.timeSpentHours.toFixed(1)}h
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {formatHours(worklog.timeSpentSeconds)}
                  </p>
                </TableCell>

                <TableCell className="max-w-[200px]">
                  {worklog.comment ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <p className="text-xs text-muted-foreground truncate cursor-default">
                          {worklog.comment}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">{worklog.comment}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
