import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CalendarRange, Minus, Table as TableIcon, TrendingDown } from 'lucide-react'
import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import { getProjectById } from '@/lib/projects/queries'
import { getBillingWithStats } from '@/lib/billings/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import { formatDateFull } from '@/lib/jira/live-hours'
import { BILLING_STATUS_LABELS, BILLING_STATUS_VARIANTS } from '@/lib/billings/types'

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

  const delta = billing.totalModifiedHours - billing.totalOriginalHours
  const deltaStr = (delta >= 0 ? '+' : '') + delta.toFixed(1) + 'h'

  return (
    <div>
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

        <div>
          <p className="text-xs text-muted-foreground">Actions coming in Batch 8</p>
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
                billing.totalModifiedHours !== billing.totalOriginalHours
                  ? 'text-amber-600'
                  : ''
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
            <p className="text-xs text-muted-foreground">Worklog Entries</p>
            <p className="text-2xl font-bold mt-1">{billing.worklogCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Worklogs section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Worklogs</h2>
          {billing.status === 'draft' && (
            <p className="text-xs text-muted-foreground">Pull button coming in Batch 8</p>
          )}
        </div>

        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <TableIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Worklog editor coming in Batch 8.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
