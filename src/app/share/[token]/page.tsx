import type { Metadata } from 'next'
import { ShieldOff } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { formatDateFull } from '@/lib/jira/format-utils'
import { getSharedBillingView } from '@/lib/share/queries'
import SharedExportButton from '@/components/share/SharedExportButton'
import TaskSummaryCell from '@/components/share/TaskSummaryCell'
import SharePageTabs from '@/components/share/SharePageTabs'

/** Formats a number with thousand separators and 2 decimal places — no currency symbol. */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

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

        {/* Two-column page header — project name + billing label/dates */}
        <div className="flex items-start justify-between gap-8 pb-6">
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

        {/* Desktop stat row — 48px inline divider strip */}
        <div className="mb-8 hidden sm:block">
          <div className="inline-flex items-stretch divide-x divide-neutral-200 border border-neutral-200 rounded-md h-12">
            <div className="flex flex-col justify-center px-5">
              <p className="text-[11px] text-neutral-500 uppercase tracking-wide leading-none">
                TOTAL HOURS
              </p>
              <p className="text-sm font-semibold tabular-nums text-neutral-900 mt-1">
                {view.billing.totalModifiedHours.toFixed(2)}h
              </p>
            </div>
            {view.invoice && (
              <div className="flex flex-col justify-center px-5">
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide leading-none">
                  INVOICE TOTAL
                </p>
                <p className="text-sm font-semibold tabular-nums text-neutral-900 mt-1">
                  {view.invoice.currency}{' '}{formatAmount(view.invoice.total)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile stat grid — 2-col cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:hidden">
          <div className="border border-neutral-200 rounded-md p-3">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">
              TOTAL HOURS
            </p>
            <p className="text-xl font-bold tabular-nums mt-1">
              {view.billing.totalModifiedHours.toFixed(2)}h
            </p>
          </div>
          {view.invoice && (
            <div className="border border-neutral-200 rounded-md p-3">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                INVOICE TOTAL
              </p>
              <p className="text-xl font-bold tabular-nums mt-1 break-all">
                {view.invoice.currency}{' '}{formatAmount(view.invoice.total)}
              </p>
            </div>
          )}
        </div>

        {/* Worklog table (standalone or inside tabs) */}
        {(() => {
          const worklogTable = (
            <div>
              <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                Billing Details
              </h2>

              {/* Mobile: card list */}
              <div className="flex flex-col gap-2 sm:hidden">
                {view.tasks.map((task, index) => (
                  <div key={index} className="flex items-start justify-between gap-4 rounded-md border border-border px-4 py-3">
                    <div className="min-w-0">
                      <span className="text-sm">{task.displaySummary}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {task.effectiveHours.toFixed(2)}h
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-md bg-gray-50 border border-border px-4 py-3 font-semibold">
                  <span className="text-sm">Total</span>
                  <span className="text-sm tabular-nums">{totalBilled.toFixed(2)}h</span>
                </div>
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: '96px' }} />
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr className="border-b border-border">
                      <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5">
                        Task
                      </th>
                      <th className="text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5">
                        Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {view.tasks.map((task, index) => (
                      <tr key={index} className="h-10 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-0 min-w-0 max-w-0">
                          <TaskSummaryCell summary={task.displaySummary} />
                        </td>
                        <td className="px-4 py-0 text-right">
                          <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                            {task.effectiveHours.toFixed(2)}h
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-border font-semibold">
                      <td className="px-4 py-2.5 min-w-0">
                        <span className="text-sm font-semibold text-neutral-900">Total</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums whitespace-nowrap">
                        {totalBilled.toFixed(2)}h
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )

          return view.invoice ? (
            <SharePageTabs invoice={view.invoice} worklogContent={worklogTable} />
          ) : worklogTable
        })()}

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
