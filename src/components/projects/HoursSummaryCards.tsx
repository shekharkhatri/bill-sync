import { Clock, Users, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatHours, formatDateFull } from '@/lib/jira/live-hours'
import type { JiraProjectSummary } from '@/lib/jira/dashboard-types'

interface HoursSummaryCardsProps {
  summary: JiraProjectSummary
}

export function HoursSummaryCards({ summary }: HoursSummaryCardsProps): React.JSX.Element {
  const uniqueIssues = new Set(summary.recentWorklogs.map((w) => w.issueKey)).size

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
            <p className="text-3xl font-bold tracking-tight mt-1">
              {summary.totalHours.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatHours(summary.totalSeconds)}
            </p>
            <Clock className="h-5 w-5 text-muted-foreground/30 absolute top-4 right-4" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Team Members</p>
            <p className="text-3xl font-bold tracking-tight mt-1">
              {summary.memberSummaries.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.memberSummaries.length} contributor
              {summary.memberSummaries.length !== 1 ? 's' : ''} active this period
            </p>
            <Users className="h-5 w-5 text-muted-foreground/30 absolute top-4 right-4" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Issues Worked</p>
            <p className="text-3xl font-bold tracking-tight mt-1">{uniqueIssues}</p>
            <p className="text-xs text-muted-foreground mt-1">across all team members</p>
            <BarChart3 className="h-5 w-5 text-muted-foreground/30 absolute top-4 right-4" />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-right mt-2">
        Last updated: {formatDateFull(summary.fetchedAt)} · Current month
      </p>
    </div>
  )
}
