import type { Metadata } from 'next'
import { ShieldOff } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatDateFull } from '@/lib/jira/format-utils'
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
    return { title: 'Worklog Preview — BillSync' }
  }

  return {
    title: `${view.project.clientName} — ${view.billing.label} | Worklog Preview`,
    robots: 'noindex, nofollow',
  }
}

export default async function SharedBillingPage({
  params,
}: SharedBillingPageProps): Promise<React.ReactElement> {
  const { token } = await params
  const view = await getSharedBillingView(token)

  /* ── Invalid / revoked / expired ── */
  if (!view) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <ShieldOff className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-lg font-semibold">Link unavailable</h1>
          <p className="text-[13px] text-muted-foreground mt-2">
            This worklog link is invalid, has been disabled, or has expired. Please contact the
            sender for a new link.
          </p>
        </div>
      </div>
    )
  }

  const totalBilled = view.billing.totalModifiedHours

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar — 52px, white, bottom border */}
      <div className="sticky top-0 z-40 bg-white border-b border-border h-[52px]">
        <div className="max-w-[1200px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold tracking-[-0.02em]">
              <span className="text-blue-600">Bill</span><span className="text-blue-400">Sync</span>
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-[13px] text-muted-foreground">Worklog Preview</span>
          </div>

          {/* Export CSV — only rendered when csvEnabled */}
          {view.csvEnabled && <SharedExportButton tokenValue={token} />}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-8 py-8">

        {/* Two-column invoice header — status intentionally hidden from external view */}
        <div className="flex items-start justify-between gap-8 pb-6 border-b border-border">
          {/* Left: project + client */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Worklog Preview
            </p>
            <h1 className="text-xl font-semibold">{view.project.name}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">{view.project.clientName}</p>
          </div>

          {/* Right: billing label + dates only (status hidden) */}
          <div className="text-right shrink-0">
            <p className="text-sm font-medium">{view.billing.label}</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {formatDateFull(view.billing.startDate)} – {formatDateFull(view.billing.endDate)}
            </p>
          </div>
        </div>

        {/* Single "Total Hours" stat — no original hours, no line items count */}
        <div className="my-6">
          <div className="inline-flex flex-col px-6 py-4 border border-border rounded-md">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Total Hours
            </span>
            <span className="text-4xl font-bold tabular-nums">
              {totalBilled.toFixed(2)}h
            </span>
          </div>
        </div>

        {/* Billing details table — 3 columns: Task · Jira Issue · Hours */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
            Billing Details
          </h2>

          <div className="overflow-hidden rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {/* Sticky header */}
                <thead className="sticky top-[52px] bg-white">
                  <tr className="border-b border-border">
                    <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5">
                      Task
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5 w-32 hidden sm:table-cell">
                      Jira Issue
                    </th>
                    <th className="text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5 w-24">
                      Hours
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {view.tasks.map((task, index) => (
                    <tr key={index} className="h-10 hover:bg-gray-50 transition-colors">
                      {/* Task summary */}
                      <td className="px-4 py-0">
                        <div className="flex items-center gap-2">
                          {task.isManual && (
                            <span className="text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
                              Manual
                            </span>
                          )}
                          <p className="text-sm truncate">{task.displaySummary}</p>
                        </div>
                      </td>

                      {/* Jira issue key — hidden on mobile */}
                      <td className="px-4 py-0 w-32 hidden sm:table-cell">
                        {task.displayIssueKey ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {task.displayIssueKey}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Hours — right-aligned */}
                      <td className="px-4 py-0 text-right w-24">
                        <span className="text-sm font-semibold tabular-nums">
                          {task.effectiveHours.toFixed(2)}h
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Total row */}
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-border font-semibold">
                    <td className="px-4 py-2.5 text-sm">Total</td>
                    <td className="hidden sm:table-cell" />
                    <td className="px-4 py-2.5 text-right text-sm tabular-nums">
                      {totalBilled.toFixed(2)}h
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-border text-center">
          <p className="text-[11px] text-muted-foreground">
            Generated by BillSync · {formatDateFull(view.generatedAt)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            This is a read-only view. Contact the sender for any queries.
          </p>
        </div>
      </div>
    </div>
  )
}
