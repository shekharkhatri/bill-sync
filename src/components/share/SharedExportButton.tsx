'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SharedExportButtonProps {
  tokenValue: string
}

export default function SharedExportButton({
  tokenValue,
}: SharedExportButtonProps): React.JSX.Element {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport(): Promise<void> {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch(`/api/share/${tokenValue}/export`)

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        // Extract filename from Content-Disposition header
        const disposition = response.headers.get('Content-Disposition') ?? ''
        const match = /filename="([^"]+)"/.exec(disposition)
        const filename = match?.[1] ?? 'billing.csv'

        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        const data = await response.json().catch(() => ({})) as { error?: string }
        setError(data.error ?? 'Export failed.')
      }
    } catch {
      setError('Export failed. Check your connection.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
        className="gap-2"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
