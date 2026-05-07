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
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 px-6 z-40 hidden md:block">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{billingLabel}</span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-sm text-muted-foreground">
            {worklogCount} {worklogCount === 1 ? 'line item' : 'line items'}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Original</p>
            <p className="text-sm font-medium">{originalTotal.toFixed(1)}h</p>
          </div>

          {hasAdjustment ? (
            <>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Billed</p>
                <p className="text-sm font-medium text-amber-600">{modifiedTotal.toFixed(1)}h</p>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">Billed</p>
              <p className="text-sm font-medium text-emerald-600">{modifiedTotal.toFixed(1)}h</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
