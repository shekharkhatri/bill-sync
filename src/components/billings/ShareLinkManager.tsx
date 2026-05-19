'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, Copy, Globe, Link2, LinkIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateFull } from '@/lib/jira/format-utils'
import { generateShareLinkAction, revokeShareLinkAction } from '@/lib/share/actions'
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
  const [isGenerating, startGenerating] = useTransition()
  const [isRevoking, startRevoking] = useTransition()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync when server re-renders with updated existingToken after router.refresh()
  useEffect(() => {
    setToken(existingToken)
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
      const result = await generateShareLinkAction(billingId)
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Shareable Link</CardTitle>
          </div>
          {token ? (
            <Badge variant="secondary" className="text-xs gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              No active link
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isDisabled ? (
          <p className="text-sm text-muted-foreground">
            Shareable links are available once the billing is reviewed or finalized.
          </p>
        ) : token ? (
          <>
            {/* URL display row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 overflow-hidden">
                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate font-mono">{shareUrl}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Info row */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Created {formatDateFull(token.createdAt)}
                {token.expiresAt
                  ? ` · Expires ${formatDateFull(token.expiresAt)}`
                  : ' · No expiry'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRevoke}
                disabled={isRevoking}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 h-7 text-xs"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                {isRevoking ? 'Disabling...' : 'Disable link'}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Generate a link to share this billing with your client.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-1.5 shrink-0"
            >
              <Link2 className="h-3.5 w-3.5" />
              {isGenerating ? 'Generating...' : 'Generate Link'}
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="text-xs py-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
