import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight, Settings, CheckCircle2, AlertCircle, Plug, Receipt, Plus } from 'lucide-react'
import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import { getProjectWithJiraStatus } from '@/lib/projects/queries'
import { getJiraConfigForDisplay } from '@/lib/jira/queries'
import { getBillingsByProject } from '@/lib/billings/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ProjectTabs } from '@/components/projects/ProjectTabs'
import LiveHoursContainer from '@/components/projects/LiveHoursContainer'
import { ProjectOverviewPanel } from '@/components/projects/ProjectOverviewPanel'
import { RefreshButton } from '@/components/projects/RefreshButton'
import { BillingCard } from '@/components/billings/BillingCard'
import { PROJECT_COLORS } from '@/lib/projects/types'
import { getDefaultPeriodFilter } from '@/lib/billings/period-filter-types'
import { isDateRangeValid } from '@/lib/billings/date-utils'
import type { ProjectColor } from '@/lib/projects/types'
import type { DatePeriodFilter } from '@/lib/billings/period-filter-types'

interface ProjectPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ start?: string; end?: string; tab?: string }>
}

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps): Promise<React.JSX.Element> {
  const [{ id }, { start, end }] = await Promise.all([params, searchParams])
  const context = await getUserContext()

  if (!hasPermission(context, 'project:view')) {
    redirect('/forbidden')
  }

  const project = await getProjectWithJiraStatus(id)
  if (!project) notFound()

  const [jiraConfig, billings] = await Promise.all([
    project.hasJiraConfig ? getJiraConfigForDisplay(project.id) : Promise.resolve(null),
    getBillingsByProject(project.id),
  ])

  const instanceUrl = jiraConfig?.instanceUrl ?? ''

  const defaultFilter = getDefaultPeriodFilter()
  const initialFilter: DatePeriodFilter = (() => {
    if (start && end && isDateRangeValid(start, end)) {
      return { preset: 'custom', startDate: start, endDate: end }
    }
    return defaultFilter
  })()

  const colorClass =
    project.color && project.color in PROJECT_COLORS
      ? PROJECT_COLORS[project.color as ProjectColor]
      : 'bg-slate-500'

  const overviewContent =
    project.hasJiraConfig && project.jiraVerified ? (
      <LiveHoursContainer
        initialFilter={initialFilter}
        filterKey={`${initialFilter.startDate}-${initialFilter.endDate}`}
      >
        <ProjectOverviewPanel
          projectId={project.id}
          instanceUrl={instanceUrl}
          startDate={initialFilter.startDate}
          endDate={initialFilter.endDate}
        />
      </LiveHoursContainer>
    ) : (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <Plug className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">Jira not connected</p>
          <p className="text-muted-foreground text-xs mt-1">
            Configure a Jira integration in project settings to see live hours.
          </p>
        </CardContent>
      </Card>
    )

  const billingsContent =
    billings.length === 0 ? (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-sm">No billing periods yet.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Create a billing period to start pulling time logs from Jira.
          </p>
          <PermissionGuard permission="billing:create">
            <Button
              className="mt-4"
              size="sm"
              nativeButton={false}
              render={<Link href={`/projects/${id}/billings/new`} />}
            >
              Create Billing Period
            </Button>
          </PermissionGuard>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {billings.length} billing period{billings.length !== 1 ? 's' : ''}
          </p>
          <PermissionGuard permission="billing:create">
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href={`/projects/${id}/billings/new`} />}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Billing Period
            </Button>
          </PermissionGuard>
        </div>

        {billings.map((billing) => (
          <BillingCard key={billing.id} billing={billing} projectId={project.id} />
        ))}
      </div>
    )

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-foreground transition-colors"
        >
          {project.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span>Overview</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded-full flex-shrink-0 ${colorClass}`} />
            <h1 className="text-2xl font-semibold">{project.name}</h1>
          </div>
          <p className="text-muted-foreground mt-0.5">{project.clientName}</p>
          {project.description && (
            <p className="text-sm mt-2">{project.description}</p>
          )}

          {project.hasJiraConfig && project.jiraVerified ? (
            <Badge variant="secondary" className="mt-2 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Jira connected
            </Badge>
          ) : project.hasJiraConfig && !project.jiraVerified ? (
            <Badge variant="outline" className="mt-2 gap-1 border-amber-500 text-amber-600">
              <AlertCircle className="h-3 w-3" />
              Jira unverified
            </Badge>
          ) : (
            <div className="mt-2 flex flex-col items-start gap-1">
              <Badge variant="outline">No Jira config</Badge>
              <PermissionGuard permission="jira:manage">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  nativeButton={false}
                  render={<Link href={`/projects/${project.id}/settings`} />}
                >
                  Configure Jira →
                </Button>
              </PermissionGuard>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton />
          <PermissionGuard permission="jira:manage">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/projects/${project.id}/settings`} />}
            >
              <Settings className="h-4 w-4 mr-1.5" />
              Settings
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <ProjectTabs overviewContent={overviewContent} billingsContent={billingsContent} />
    </div>
  )
}
