import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight, Info } from 'lucide-react'
import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import { getProjectById } from '@/lib/projects/queries'
import { getBillingWithStats, getBillingTaskSummaries } from '@/lib/billings/queries'
import { getJiraConfigForDisplay } from '@/lib/jira/queries'
import { getShareToken } from '@/lib/share/queries'
import { getInvoiceByBilling } from '@/lib/invoices/queries'
import { getCompanySettings } from '@/lib/invoices/settings-queries'
import InvoiceEditorForm from '@/components/invoices/InvoiceEditorForm'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatDateFull } from '@/lib/jira/format-utils'
import { BILLING_STATUS_LABELS } from '@/lib/billings/types'
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

function statusPillClass(status: string): string {
  switch (status) {
    case 'finalized':
      return 'bg-success-50 text-success-600 border border-success-200'
    case 'reviewed':
      return 'bg-blue-50 text-blue-600 border border-blue-200'
    case 'draft':
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
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

  const [tasks, jiraConfig, shareToken, invoice, companySettings] = await Promise.all([
    getBillingTaskSummaries(billingId),
    getJiraConfigForDisplay(billing.projectId),
    getShareToken(billingId),
    getInvoiceByBilling(billingId),
    getCompanySettings(),
  ])

  const instanceUrl = jiraConfig?.instanceUrl ?? ''
  const canFinalize = hasPermission(context, 'billing:finalize')

  const delta = billing.totalModifiedHours - billing.totalOriginalHours
  const deltaStr = (delta >= 0 ? '+' : '') + delta.toFixed(1) + 'h'
  const hasAdjustment = billing.totalModifiedHours !== billing.totalOriginalHours

  return (
    <div className="pb-20 md:pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-2">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-foreground transition-colors">
          {project.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projects/${id}`} className="hover:text-foreground transition-colors">
          Billings
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>{billing.label}</span>
      </div>

      {/* Page header row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">{billing.label}</h1>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${statusPillClass(billing.status)}`}
            >
              {BILLING_STATUS_LABELS[billing.status]}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {formatDateFull(billing.startDate)} — {formatDateFull(billing.endDate)}
          </p>
        </div>

        {/* Action buttons — right-aligned */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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
          <ExportButton billingId={billing.id} billingStatus={billing.status} />
          <BillingActions billing={billing} canFinalize={canFinalize} />
        </div>
      </div>

      {/* Inline stat row — 48px, divided, no card borders */}
      <div className="flex items-stretch h-12 border border-border rounded-md mb-4 divide-x divide-border overflow-hidden">
        <div className="flex flex-col justify-center px-5 min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-none mb-1">
            Total Logged
          </span>
          <span className="text-base font-semibold tabular-nums leading-none">
            {billing.totalOriginalHours.toFixed(1)}h
          </span>
        </div>
        <div className="flex flex-col justify-center px-5 min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-none mb-1">
            Total Billed
          </span>
          <span
            className={`text-base font-semibold tabular-nums leading-none ${
              hasAdjustment ? 'text-blue-600' : ''
            }`}
          >
            {billing.totalModifiedHours.toFixed(1)}h
          </span>
        </div>
        <div className="flex flex-col justify-center px-5 min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-none mb-1">
            Adjustment
          </span>
          <span
            className={`text-base font-semibold tabular-nums leading-none ${
              delta < 0
                ? 'text-destructive'
                : delta > 0
                  ? 'text-success-600'
                  : 'text-muted-foreground'
            }`}
          >
            {deltaStr}
          </span>
        </div>
        <div className="flex flex-col justify-center px-5 min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-none mb-1">
            Line Items
          </span>
          <span className="text-base font-semibold tabular-nums leading-none">
            {billing.worklogCount}
          </span>
        </div>
      </div>

      {/* Shareable link row */}
      <PermissionGuard permission="billing:finalize">
        <div className="mb-5">
          <ShareLinkManager
            billingId={billing.id}
            billingStatus={billing.status}
            existingToken={shareToken}
          />
        </div>
      </PermissionGuard>

      {/* Invoice section */}
      <PermissionGuard permission="billing:finalize">
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">Invoice</h2>
          <InvoiceEditorForm
            billingId={billing.id}
            clientName={project.clientName}
            invoice={invoice}
            settings={companySettings}
          />
        </div>
      </PermissionGuard>

      {/* Line items section */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Line Items</h2>
            <span className="text-[13px] text-muted-foreground">
              {tasks.length} {tasks.length === 1 ? 'item' : 'items'}
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
          <Alert className="mb-3">
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
