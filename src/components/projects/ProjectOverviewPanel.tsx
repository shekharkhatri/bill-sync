import { Plug, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { getProjectOverviewData } from '@/lib/jira/live-hours'
import { parseDateString } from '@/lib/billings/date-utils'
import { OverviewTabs } from '@/components/projects/overview/OverviewTabs'
import { AuthorSummaryView } from '@/components/projects/overview/AuthorSummaryView'

interface ProjectOverviewPanelProps {
  projectId: string
  instanceUrl: string
  startDate?: string
  endDate?: string
}

export async function ProjectOverviewPanel({
  projectId,
  instanceUrl,
  startDate,
  endDate,
}: ProjectOverviewPanelProps): Promise<React.JSX.Element> {
  const result =
    startDate && endDate
      ? await getProjectOverviewData(
          projectId,
          parseDateString(startDate),
          parseDateString(endDate),
        )
      : await getProjectOverviewData(projectId)

  if (!result.success) {
    if (result.error === 'no_config') {
      return (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
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
        <AlertTitle>Failed to load data from Jira</AlertTitle>
        <AlertDescription>
          Check your Jira connection settings and try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <OverviewTabs
      data={result.data}
      instanceUrl={instanceUrl}
      authorContent={
        <AuthorSummaryView
          authors={result.data.authors}
          instanceUrl={instanceUrl}
          totalProjectSeconds={result.data.totalSeconds}
        />
      }
    />
  )
}
