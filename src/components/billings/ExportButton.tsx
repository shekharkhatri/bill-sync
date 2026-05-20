'use client'

import { useState } from 'react'
import { AlertCircle, Download, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { BillingStatus } from '@/lib/billings/types'

interface ExportButtonProps {
  billingId: string
  billingStatus: BillingStatus
  disabled?: boolean
}

export default function ExportButton({
  billingId,
  billingStatus,
  disabled,
}: ExportButtonProps): React.JSX.Element {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDisabled = isExporting || disabled || billingStatus === 'draft'

  async function handleExport(): Promise<void> {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch(`/api/billings/${billingId}/export`)

      if (response.ok) {
        const disposition = response.headers.get('Content-Disposition')
        const match = disposition?.match(/filename="(.+)"/)
        const filename = match?.[1] ?? 'billing-export.csv'

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        const data = (await response.json()) as { error?: string }
        setError(data.error ?? 'Export failed. Please try again.')
      }
    } catch {
      setError('Export failed. Check your connection and try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const button = (
    <Button
      variant="outline"
      size="sm"
      disabled={isDisabled}
      onClick={handleExport}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  )

  return (
    <div className="flex flex-col items-end gap-2">
      {billingStatus === 'draft' ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            {button}
          </TooltipTrigger>
          <TooltipContent>Mark as reviewed to enable export</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}

      {error && (
        <Alert variant="destructive" className="text-sm mt-1 w-64">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
