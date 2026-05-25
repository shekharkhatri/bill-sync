import { redirect } from 'next/navigation'
import { Lock } from 'lucide-react'
import { getShareTokenByValue } from '@/lib/share/queries'
import { isTokenExpired } from '@/lib/share/token'
import { isSharePasswordVerified } from '@/lib/share/verify-cookie'
import PasswordGateForm from '@/components/share/PasswordGateForm'

interface PasswordGatePageProps {
  params: Promise<{ token: string }>
}

export const metadata = {
  title: 'Protected Link — BillSync',
  robots: 'noindex, nofollow',
}

export default async function PasswordGatePage({
  params,
}: PasswordGatePageProps): Promise<React.ReactElement> {
  const { token } = await params

  // Validate the token exists, is active, not expired, and is password-protected
  const tokenRow = await getShareTokenByValue(token)

  if (!tokenRow || !tokenRow.isActive || isTokenExpired(tokenRow.expiresAt)) {
    redirect(`/share/${token}`)
  }

  if (!tokenRow.passwordEnabled) {
    redirect(`/share/${token}`)
  }

  // Already verified — let the main page handle it
  const verified = await isSharePasswordVerified(token)
  if (verified) {
    redirect(`/share/${token}`)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-lg font-bold tracking-[-0.02em]">
            <span className="text-blue-600">Bill</span><span className="text-blue-400">Sync</span>
          </span>
        </div>

        <div className="border border-border rounded-lg p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Lock className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <h1 className="text-base font-semibold">Protected Link</h1>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              This worklog is password-protected. Enter the password to continue.
            </p>
          </div>

          <PasswordGateForm token={token} />
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Contact the sender if you don&apos;t have the password.
        </p>
      </div>
    </div>
  )
}
