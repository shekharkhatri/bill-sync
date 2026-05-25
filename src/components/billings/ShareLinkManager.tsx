'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCheck,
  Copy,
  Eye,
  EyeOff,
  FileDown,
  Globe,
  KeyRound,
  Link2,
  LinkIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { formatDateFull } from '@/lib/jira/format-utils'
import {
  generateShareLinkAction,
  revokeShareLinkAction,
  updateShareTokenCsvAction,
  updatePasswordAction,
} from '@/lib/share/actions'
import type { BillingShareToken } from '@/lib/share/types'
import type { BillingStatus } from '@/lib/billings/types'

interface ShareLinkManagerProps {
  billingId: string
  billingStatus: BillingStatus
  existingToken: BillingShareToken | null
}

/** Generates a cryptographically random 8-char password client-side. */
function generatePasswordClient(): string {
  const bytes = new Uint8Array(6)
  window.crypto.getRandomValues(bytes)
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return base64.substring(0, 8)
}

export default function ShareLinkManager({
  billingId,
  billingStatus,
  existingToken,
}: ShareLinkManagerProps): React.JSX.Element {
  const router = useRouter()

  // ── Link state ──
  const [token, setToken] = useState<BillingShareToken | null>(existingToken)
  const [csvEnabled, setCsvEnabled] = useState<boolean>(existingToken?.csvEnabled ?? true)
  const [isGenerating, startGenerating] = useTransition()
  const [isRevoking, startRevoking] = useTransition()
  const [isUpdatingCsv, startUpdatingCsv] = useTransition()
  const [isUpdatingPassword, startUpdatingPassword] = useTransition()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Password state (pre-generate) ──
  const [prePasswordEnabled, setPrePasswordEnabled] = useState(false)
  const [prePassword, setPrePassword] = useState('')
  const [showPrePassword, setShowPrePassword] = useState(false)

  // ── Password state (active link) ──
  const [pwEnabled, setPwEnabled] = useState<boolean>(existingToken?.passwordEnabled ?? false)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    setToken(existingToken)
    setCsvEnabled(existingToken?.csvEnabled ?? true)
    setPwEnabled(existingToken?.passwordEnabled ?? false)
    setNewPassword('')
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
      const result = await generateShareLinkAction(
        billingId,
        csvEnabled,
        prePasswordEnabled,
        prePasswordEnabled ? prePassword : null,
      )
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
        setCsvEnabled(!enabled)
        setError(result.error)
      }
    })
  }

  function handleSetPassword(): void {
    setError(null)
    startUpdatingPassword(async () => {
      const result = await updatePasswordAction(
        billingId,
        pwEnabled,
        pwEnabled ? newPassword : null,
      )
      if (result.success) {
        setNewPassword('')
        router.refresh()
      } else {
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

            {/* Password protection (active link) */}
            <Separator className="my-2.5" />
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[13px] font-medium leading-none">Password Protection</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pwEnabled
                        ? 'Recipients must enter a password to view this link.'
                        : 'Anyone with the link can view this worklog.'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={pwEnabled}
                  onCheckedChange={(v) => { setPwEnabled(v); setNewPassword('') }}
                  disabled={isUpdatingPassword}
                  aria-label="Toggle password protection"
                />
              </div>

              {pwEnabled && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={token.passwordEnabled ? 'Set new password' : 'Enter password'}
                      disabled={isUpdatingPassword}
                      className="h-7 text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword
                        ? <EyeOff className="h-3 w-3" />
                        : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewPassword(generatePasswordClient())}
                    disabled={isUpdatingPassword}
                    className="h-7 text-xs gap-1 shrink-0"
                    title="Generate random password"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSetPassword}
                    disabled={isUpdatingPassword || !newPassword.trim()}
                    className="h-7 text-xs shrink-0"
                  >
                    {isUpdatingPassword ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Set'
                    )}
                  </Button>
                </div>
              )}

              {!pwEnabled && token.passwordEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetPassword}
                  disabled={isUpdatingPassword}
                  className="h-7 text-xs gap-1"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  Remove Password
                </Button>
              )}
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

            {/* Pre-generation password toggle */}
            <Separator className="my-2.5" />
            <div className="space-y-2.5 mb-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[13px] font-medium leading-none">Password Protection</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Require a password to view this link.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={prePasswordEnabled}
                  onCheckedChange={(v) => { setPrePasswordEnabled(v); setPrePassword('') }}
                  aria-label="Enable password protection"
                />
              </div>

              {prePasswordEnabled && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPrePassword ? 'text' : 'password'}
                      value={prePassword}
                      onChange={(e) => setPrePassword(e.target.value)}
                      placeholder="Enter a password"
                      className="h-7 text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrePassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPrePassword ? 'Hide password' : 'Show password'}
                    >
                      {showPrePassword
                        ? <EyeOff className="h-3 w-3" />
                        : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrePassword(generatePasswordClient())}
                    className="h-7 text-xs gap-1 shrink-0"
                    title="Generate random password"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              )}
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
                disabled={isGenerating || (prePasswordEnabled && !prePassword.trim())}
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
