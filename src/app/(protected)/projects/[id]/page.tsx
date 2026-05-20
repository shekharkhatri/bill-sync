import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight, CheckCircle2, AlertCircle, Plug, Plus } from 'lucide-react'
import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import { getProjectWithJiraStatus } from '@/lib/projects/queries'
import { getJiraConfigForDisplay } from '@/lib/jira/queries'
import { getBillingsByProject } from '@/lib/billings/queries'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ProjectTabs } from '@/components/projects/ProjectTabs'
import LiveHoursContainer from '@/components/projects/LiveHoursContainer'
import { ProjectOverviewPanel } from '@/components/projects/ProjectOverviewPanel'
import { RefreshButton } from '@/components/projects/RefreshButton'
import { BillingCard } from '@/components/billings/BillingCard'
import { getDefaultPeriodFilter } from '@/lib/billings/period-filter-types'
import { isDateRangeValid } from '@/lib/billings/date-utils'
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

  /* ── Overview tab content ── */
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
      <div className="border border-dashed border-border rounded-md py-14 text-center">
        <Plug className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Jira not connected</p>
        <p className="text-xs text-muted-foreground mt-1">
          Configure a Jira integration in project settings to see live hours.
        </p>
        <PermissionGuard permission="jira:manage">
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            nativeButton={false}
            render={<Link href={`/projects/${project.id}/settings`} />}
          >
            Configure Jira
          </Button>
        </PermissionGuard>
      </div>
    )

  /* ── Billings tab content ── */
  const billingsContent =
    billings.length === 0 ? (
      <div className="border border-dashed border-border rounded-md py-14 text-center">
        <p className="text-sm font-medium">No billing periods yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create a billing period to start pulling time logs from Jira.
        </p>
        <PermissionGuard permission="billing:create">
          <Button
            size="sm"
            className="mt-4"
            nativeButton={false}
            render={<Link href={`/projects/${id}/billings/new`} />}
          >
            Create Billing Period
          </Button>
        </PermissionGuard>
      </div>
    ) : (
      <div>
        {/* Billing list header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] text-muted-foreground">
            {billings.length} billing period{billings.length !== 1 ? 's' : ''}
          </span>
          <PermissionGuard permission="billing:create">
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href={`/projects/${id}/billings/new`} />}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Billing Period
            </Button>
          </PermissionGuard>
        </div>

        {/* Dense table */}
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5">
                  Period
                </th>
                <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5">
                  Date Range
                </th>
                <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5 w-28">
                  Status
                </th>
                <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5 w-28" />
                <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5 w-28" />
                <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5 w-24" />
                <th className="w-32" />
              </tr>
            </thead>
            <tbody>
              {billings.map((billing) => (
                <BillingCard key={billing.id} billing={billing} projectId={project.id} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-2">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>{project.name}</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{project.clientName}</p>
          {/* Jira status inline, compact */}
          {project.hasJiraConfig && project.jiraVerified ? (
            <div className="flex items-center gap-1.5 mt-2 text-success-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs">Jira connected</span>
            </div>
          ) : project.hasJiraConfig ? (
            <div className="flex items-center gap-1.5 mt-2 text-warning-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs">Jira unverified</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <RefreshButton />
          <PermissionGuard permission="jira:manage">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/projects/${project.id}/settings`} />}
            >
              Settings
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <ProjectTabs overviewContent={overviewContent} billingsContent={billingsContent} />
    </div>
  )
}
