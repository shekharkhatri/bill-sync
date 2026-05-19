import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CalendarRange, Info, Minus, TrendingDown } from 'lucide-react'
import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import { getProjectById } from '@/lib/projects/queries'
import { getBillingWithStats, getBillingTaskSummaries } from '@/lib/billings/queries'
import { getJiraConfigForDisplay } from '@/lib/jira/queries'
import { getShareToken } from '@/lib/share/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronRight } from 'lucide-react'
import { formatDateFull } from '@/lib/jira/format-utils'
import { BILLING_STATUS_LABELS, BILLING_STATUS_VARIANTS } from '@/lib/billings/types'
import BillingActions from '@/components/billings/BillingActions'
import DeleteBillingButton from '@/components/billings/DeleteBillingButton'
import ExportButton from '@/components/billings/ExportButton'
import PullWorklogsButton from '@/components/billings/PullWorklogsButton'
import BillingTaskEditorTable from '@/components/billings/BillingTaskEditorTable'
import WorklogSummaryFooter from '@/components/billings/WorklogSummaryFooter'
import ShareLinkManager from '@/components/billings/ShareLinkManager'
import { PermissionGuard } from '@/components/shared/PermissionGuard'

interface BillingDetailPageProps {
  params: Promise<{ id: string; billingId: string }>
}

export default async function BillingDetailPage({
  params,
}: BillingDetailPageProps): Promise<React.JSX.Element> {
  const { id, billingId } = await params
  const context = await getUserContext()

  if (!hasPermission(context, 'project:view')) {
    redirect('/forbidden')
  }

  const billing = await getBillingWithStats(billingId)
  if (!billing) notFound()

  const project = await getProjectById(billing.projectId)
  if (!project) notFound()

  const [tasks, jiraConfig, shareToken] = await Promise.all([
    getBillingTaskSummaries(billingId),
    getJiraConfigForDisplay(billing.projectId),
    getShareToken(billingId),
  ])

  const instanceUrl = jiraConfig?.instanceUrl ?? ''
  const canFinalize = hasPermission(context, 'billing:finalize')

  const delta = billing.totalModifiedHours - billing.totalOriginalHours
  const deltaStr = (delta >= 0 ? '+' : '') + delta.toFixed(1) + 'h'

  return (
    <div className="pb-20 md:pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/projects/${id}`} className="hover:text-foreground transition-colors">
          {project.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/projects/${id}`} className="hover:text-foreground transition-colors">
          Billings
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span>{billing.label}</span>
      </div>

      {/* Top section */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{billing.label}</h1>
            <div className="flex items-center gap-2 mt-1">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatDateFull(billing.startDate)} — {formatDateFull(billing.endDate)}
              </span>
            </div>
          </div>
          <Badge variant={BILLING_STATUS_VARIANTS[billing.status]}>
            {BILLING_STATUS_LABELS[billing.status]}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {billing.status === 'draft' && (
            <PermissionGuard permission="billing:create">
              <DeleteBillingButton
                billingId={billing.id}
                billingLabel={billing.label}
                projectId={project.id}
                redirectAfterDelete={true}
              />
            </PermissionGuard>
          )}
          <ExportButton
            billingId={billing.id}
            billingStatus={billing.status}
          />
          <BillingActions billing={billing} canFinalize={canFinalize} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Logged</p>
            <p className="text-2xl font-bold mt-1">
              {billing.totalOriginalHours.toFixed(1)}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Billed</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                billing.totalModifiedHours !== billing.totalOriginalHours ? 'text-amber-600' : ''
              }`}
            >
              {billing.totalModifiedHours.toFixed(1)}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Adjustment</p>
            <div className="flex items-center gap-1 mt-1">
              {delta < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <p
                className={`text-2xl font-bold ${
                  delta < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}
              >
                {deltaStr}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Line Items</p>
            <p className="text-2xl font-bold mt-1">{billing.worklogCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Share link manager */}
      <PermissionGuard permission="billing:finalize">
        <div className="mt-6">
          <ShareLinkManager
            billingId={billing.id}
            billingStatus={billing.status}
            existingToken={shareToken}
          />
        </div>
      </PermissionGuard>

      {/* Worklogs section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold inline">Line Items</h2>
            <span className="text-sm text-muted-foreground ml-2">
              ({tasks.length} {tasks.length === 1 ? 'line item' : 'line items'})
            </span>
          </div>
          {billing.status === 'draft' && (
            <PullWorklogsButton
              billingId={billing.id}
              hasExistingWorklogs={tasks.length > 0}
            />
          )}
        </div>

        {billing.status !== 'draft' && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {billing.status === 'reviewed'
                ? 'This billing is under review. Worklogs are read-only.'
                : 'This billing is finalized. Worklogs are locked.'}
            </AlertDescription>
          </Alert>
        )}

        <BillingTaskEditorTable
          billingId={billing.id}
          billingStatus={billing.status}
          tasks={tasks}
          instanceUrl={instanceUrl}
        />
      </div>

      <WorklogSummaryFooter
        originalTotal={billing.totalOriginalHours}
        modifiedTotal={billing.totalModifiedHours}
        worklogCount={tasks.length}
        billingLabel={billing.label}
      />
    </div>
  )
}
