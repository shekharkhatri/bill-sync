'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, Copy, FileDown, Globe, Link2, LinkIcon, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { formatDateFull } from '@/lib/jira/format-utils'
import {
  generateShareLinkAction,
  revokeShareLinkAction,
  updateShareTokenCsvAction,
} from '@/lib/share/actions'
import type { BillingShareToken } from '@/lib/share/types'
import type { BillingStatus } from '@/lib/billings/types'

interface ShareLinkManagerProps {
  billingId: string
  billingStatus: BillingStatus
  existingToken: BillingShareToken | null
}

export default function ShareLinkManager({
  billingId,
  billingStatus,
  existingToken,
}: ShareLinkManagerProps): React.JSX.Element {
  const router = useRouter()
  const [token, setToken] = useState<BillingShareToken | null>(existingToken)
  const [csvEnabled, setCsvEnabled] = useState<boolean>(existingToken?.csvEnabled ?? true)
  const [isGenerating, startGenerating] = useTransition()
  const [isRevoking, startRevoking] = useTransition()
  const [isUpdatingCsv, startUpdatingCsv] = useTransition()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setToken(existingToken)
    setCsvEnabled(existingToken?.csvEnabled ?? true)
  }, [existingToken])

  const shareUrl =
    typeof window !== 'undefined' && token
      ? `${window.location.origin}/share/${token.token}`
      : null

  const isDisabled = billingStatus === 'draft'

  function handleCopy(): void {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleGenerate(): void {
    setError(null)
    startGenerating(async () => {
      const result = await generateShareLinkAction(billingId, csvEnabled)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleRevoke(): void {
    setError(null)
    startRevoking(async () => {
      const result = await revokeShareLinkAction(billingId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleCsvToggle(enabled: boolean): void {
    setCsvEnabled(enabled)
    startUpdatingCsv(async () => {
      const result = await updateShareTokenCsvAction(billingId, enabled)
      if (!result.success) {
        // Revert optimistic update on failure
        setCsvEnabled(!enabled)
        setError(result.error)
      }
    })
  }

  return (
    <div>
      {/* Compact share row */}
      <div className="px-4 py-2.5 bg-gray-50 border border-border rounded-md">
        {isDisabled ? (
          <div className="flex items-center gap-3">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Shareable links are available once the billing is reviewed or finalized.
            </p>
          </div>
        ) : token ? (
          <>
            {/* URL row */}
            <div className="flex items-center gap-3">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="font-mono text-xs text-muted-foreground truncate">{shareUrl}</p>
              </div>

              <span className="text-[11px] font-medium px-2 py-0.5 rounded-sm bg-success-50 text-success-600 border border-success-200 shrink-0">
                Active
              </span>

              <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">
                {formatDateFull(token.createdAt)}
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <CheckCheck className="h-3 w-3 text-success-600" />
                    <span className="text-success-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>

              <span className="text-border shrink-0">·</span>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRevoke}
                disabled={isRevoking}
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 shrink-0"
              >
                {isRevoking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <LinkIcon className="h-3 w-3" />
                )}
                {isRevoking ? 'Disabling…' : 'Disable'}
              </Button>
            </div>

            {/* CSV toggle */}
            <Separator className="my-2.5" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileDown className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[13px] font-medium leading-none">CSV Export</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {csvEnabled
                      ? 'External users can download a CSV of this worklog.'
                      : 'CSV export is disabled for this shared link.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isUpdatingCsv && (
                  <span className="text-xs text-muted-foreground animate-pulse">Updating…</span>
                )}
                <Switch
                  checked={csvEnabled}
                  onCheckedChange={handleCsvToggle}
                  disabled={isUpdatingCsv}
                  aria-label="Toggle CSV export for shared link"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Pre-generation CSV toggle */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <FileDown className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[13px] font-medium leading-none">Allow CSV Export</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Let external users download this worklog as CSV.
                  </p>
                </div>
              </div>
              <Switch
                checked={csvEnabled}
                onCheckedChange={(v) => setCsvEnabled(v)}
                aria-label="Allow CSV export on shared link"
              />
            </div>

            <Separator className="my-2.5" />

            {/* Generate button row */}
            <div className="flex items-center gap-3">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground flex-1">
                Generate a link to share this worklog with your client.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="h-7 text-xs gap-1.5 shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Link2 className="h-3 w-3" />
                )}
                {isGenerating ? 'Generating…' : 'Generate Link'}
              </Button>
            </div>
          </>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mt-2 text-xs py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
