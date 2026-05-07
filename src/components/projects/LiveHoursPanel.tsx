import { Plug, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { getLiveProjectHours } from '@/lib/jira/live-hours'
import { parseDateString } from '@/lib/billings/date-utils'
import { HoursSummaryCards } from '@/components/projects/HoursSummaryCards'
import { MemberHoursTable } from '@/components/projects/MemberHoursTable'
import { RecentWorklogsTable } from '@/components/projects/RecentWorklogsTable'

interface LiveHoursPanelProps {
  projectId: string
  instanceUrl: string
  startDate?: string
  endDate?: string
}

export async function LiveHoursPanel({
  projectId,
  instanceUrl,
  startDate,
  endDate,
}: LiveHoursPanelProps): Promise<React.JSX.Element> {
  const result =
    startDate && endDate
      ? await getLiveProjectHours(projectId, parseDateString(startDate), parseDateString(endDate))
      : await getLiveProjectHours(projectId)

  if (!result.success) {
    if (result.error === 'no_config') {
      return (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Plug className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-sm">No Jira configuration found.</p>
            <p className="text-muted-foreground text-xs mt-1">
              Connect a Jira project in settings to see live hours.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load Jira data</AlertTitle>
        <AlertDescription>
          Could not fetch hours from Jira. Check your connection settings.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <HoursSummaryCards summary={result.data} startDate={startDate} endDate={endDate} />
      <Separator className="my-6" />
      <MemberHoursTable members={result.data.memberSummaries} />
      <Separator className="my-6" />
      <RecentWorklogsTable worklogs={result.data.recentWorklogs} instanceUrl={instanceUrl} />
    </div>
  )
}
