import Link from 'next/link'
import { formatDateFull } from '@/lib/jira/format-utils'
import { BILLING_STATUS_LABELS } from '@/lib/billings/types'
import DeleteBillingButton from '@/components/billings/DeleteBillingButton'
import type { BillingWithStats } from '@/lib/billings/types'

interface BillingCardProps {
  billing: BillingWithStats
  projectId: string
}

function statusPillClass(status: BillingWithStats['status']): string {
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

export function BillingCard({ billing, projectId }: BillingCardProps): React.JSX.Element {
  const isModified = billing.totalModifiedHours !== billing.totalOriginalHours

  return (
    <tr className="h-14 hover:bg-gray-50 transition-colors border-b border-border last:border-0 group">
      {/* Period label */}
      <td className="px-4">
        <p className="text-sm font-medium">{billing.label}</p>
      </td>

      {/* Date range */}
      <td className="px-4 text-sm text-muted-foreground whitespace-nowrap">
        {formatDateFull(billing.startDate)} – {formatDateFull(billing.endDate)}
      </td>

      {/* Status */}
      <td className="px-4 w-28">
        <span
          className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-sm ${statusPillClass(billing.status)}`}
        >
          {BILLING_STATUS_LABELS[billing.status]}
        </span>
      </td>

      {/* Logged */}
      <td className="px-4 w-28">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
          Logged
        </p>
        <p className="text-sm font-semibold tabular-nums">
          {billing.totalOriginalHours.toFixed(1)}h
        </p>
      </td>

      {/* Billed */}
      <td className="px-4 w-28">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
          Billed
        </p>
        <p
          className={`text-sm font-semibold tabular-nums ${
            isModified ? 'text-blue-600' : ''
          }`}
        >
          {billing.totalModifiedHours.toFixed(1)}h
        </p>
      </td>

      {/* Entries */}
      <td className="px-4 w-24">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
          Entries
        </p>
        <p className="text-sm font-semibold tabular-nums">{billing.worklogCount}</p>
      </td>

      {/* Actions */}
      <td className="px-4 w-32 text-right">
        <div className="flex items-center justify-end gap-3">
          {billing.status === 'draft' && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DeleteBillingButton
                billingId={billing.id}
                billingLabel={billing.label}
                projectId={projectId}
                redirectAfterDelete={false}
              />
            </div>
          )}
          <Link
            href={`/projects/${projectId}/billings/${billing.id}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
          >
            Open →
          </Link>
        </div>
      </td>
    </tr>
  )
}
