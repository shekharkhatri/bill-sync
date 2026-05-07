import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { formatHours } from '@/lib/jira/format-utils'
import { AuthorTaskCollapsible } from '@/components/projects/overview/AuthorTaskCollapsible'
import type { OverviewAuthorSummary } from '@/lib/jira/overview-types'

interface AuthorSummaryViewProps {
  authors: OverviewAuthorSummary[]
  instanceUrl: string
  totalProjectSeconds: number
}

export function AuthorSummaryView({
  authors,
  instanceUrl,
  totalProjectSeconds,
}: AuthorSummaryViewProps): React.JSX.Element {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm font-medium">
            {authors.length} worklog author{authors.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            People who logged time in Jira during this period.
          </p>
        </div>
      </div>

      {authors.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No time logged in this period.
        </p>
      ) : (
        <div className="space-y-3">
          {authors.map((author) => {
            const sharePct =
              totalProjectSeconds > 0
                ? Math.round((author.totalSeconds / totalProjectSeconds) * 100)
                : 0

            return (
              <Card key={author.accountId}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-medium">
                          {author.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{author.displayName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {author.taskCount} task{author.taskCount !== 1 ? 's' : ''} ·{' '}
                          {formatHours(author.totalSeconds)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold tabular-nums">
                        {author.totalHours.toFixed(2)}h
                      </p>
                    </div>
                  </div>

                  {/* Share bar — dynamic percentage requires inline style */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: sharePct + '%' }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                      {sharePct}%
                    </span>
                  </div>

                  <AuthorTaskCollapsible tasks={author.tasks} instanceUrl={instanceUrl} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
