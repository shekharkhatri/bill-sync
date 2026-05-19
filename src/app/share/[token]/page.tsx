import type { Metadata } from 'next'
import { ShieldOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateFull } from '@/lib/jira/format-utils'
import { BILLING_STATUS_LABELS, BILLING_STATUS_VARIANTS } from '@/lib/billings/types'
import { getSharedBillingView } from '@/lib/share/queries'
import SharedExportButton from '@/components/share/SharedExportButton'

interface SharedBillingPageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({
  params,
}: SharedBillingPageProps): Promise<Metadata> {
  const { token } = await params
  const view = await getSharedBillingView(token)

  if (!view) {
    return { title: 'Invoice Preview — BillSync' }
  }

  return {
    title: `${view.project.clientName} — ${view.billing.label} | BillSync`,
    robots: 'noindex, nofollow',
  }
}

export default async function SharedBillingPage({
  params,
}: SharedBillingPageProps): Promise<React.ReactElement> {
  const { token } = await params
  const view = await getSharedBillingView(token)

  // Invalid / revoked / expired token
  if (!view) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-6 text-center">
            <ShieldOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold">Link unavailable</h1>
            <p className="text-muted-foreground text-sm mt-2">
              This billing link is invalid, has been disabled, or has expired. Please contact the
              sender for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isModified = view.billing.totalModifiedHours !== view.billing.totalOriginalHours

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              B
            </div>
            <span className="font-semibold text-sm">BillSync</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground">Invoice Preview</span>
          </div>
          <SharedExportButton tokenValue={token} />
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Section 1 — Billing header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: project info */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Project</p>
                <p className="text-lg font-semibold mt-0.5">{view.project.name}</p>
                <p className="text-sm text-muted-foreground">{view.project.clientName}</p>
              </div>

              {/* Right: billing details */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Billing Period</span>
                  <span className="text-sm font-medium">
                    {formatDateFull(view.billing.startDate)} –{' '}
                    {formatDateFull(view.billing.endDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge variant={BILLING_STATUS_VARIANTS[view.billing.status]}>
                    {BILLING_STATUS_LABELS[view.billing.status]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Label</span>
                  <span className="text-sm">{view.billing.label}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2 — Summary stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Original Hours</p>
              <p className="text-2xl font-bold tabular-nums mt-1">
                {view.billing.totalOriginalHours.toFixed(2)}h
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Billed Hours</p>
              <p
                className={`text-2xl font-bold tabular-nums mt-1 ${
                  isModified ? 'text-amber-600' : ''
                }`}
              >
                {view.billing.totalModifiedHours.toFixed(2)}h
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Line Items</p>
              <p className="text-2xl font-bold tabular-nums mt-1">{view.tasks.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 3 — Task table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing Details</CardTitle>
            <CardDescription>Hours logged for the billing period.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Task</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.tasks.map((task, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {task.isManual && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Manual
                            </Badge>
                          )}
                          <p className="text-sm font-medium">{task.displaySummary}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {task.effectiveHours.toFixed(2)}h
                        </span>
                      </TableCell>
                      <TableCell>
                        {task.internalNote ? (
                          <p className="text-xs text-muted-foreground max-w-[200px] line-clamp-2">
                            {task.internalNote}
                          </p>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {view.billing.totalModifiedHours.toFixed(2)}h
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Section 4 — Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Generated by BillSync · {formatDateFull(view.generatedAt)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This is a read-only view. Contact the sender for any queries.
          </p>
        </div>
      </div>
    </div>
  )
}
