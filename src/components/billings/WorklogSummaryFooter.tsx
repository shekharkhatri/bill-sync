'use client'

import { ArrowRight } from 'lucide-react'

interface WorklogSummaryFooterProps {
  originalTotal: number
  modifiedTotal: number
  worklogCount: number
  billingLabel: string
}

export default function WorklogSummaryFooter({
  originalTotal,
  modifiedTotal,
  worklogCount,
  billingLabel,
}: WorklogSummaryFooterProps): React.JSX.Element {
  const hasAdjustment = modifiedTotal !== originalTotal

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 py-3 px-6 z-40 hidden md:block">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{billingLabel}</span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-[13px] text-muted-foreground tabular-nums">
            {worklogCount} {worklogCount === 1 ? 'line item' : 'line items'}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Original
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {originalTotal.toFixed(2)}h
            </p>
          </div>

          {hasAdjustment && (
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          )}

          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Billed
            </p>
            <p
              className={`text-sm font-semibold tabular-nums ${
                hasAdjustment ? 'text-blue-600' : 'text-success-600'
              }`}
            >
              {modifiedTotal.toFixed(2)}h
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
