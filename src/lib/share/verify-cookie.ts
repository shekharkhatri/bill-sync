// SERVER ONLY — never import from Client Components
import { createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { ENCRYPTION_KEY } from '@/lib/env'

interface CookiePayload {
  token: string
  expires: number
}

interface SignedCookie {
  payload: string
  sig: string
}

/**
 * Reads the share_auth_{token[0:8]} HttpOnly cookie and verifies its HMAC signature.
 * Returns true only if the signature is valid, the token matches, and the cookie has not expired.
 */
export async function isSharePasswordVerified(token: string): Promise<boolean> {
  try {
    const cookieName = `share_auth_${token.substring(0, 8)}`
    const cookieStore = await cookies()
    const raw = cookieStore.get(cookieName)?.value
    if (!raw) return false

    const { payload, sig } = JSON.parse(
      Buffer.from(raw, 'base64').toString('utf8'),
    ) as SignedCookie

    // Re-compute HMAC and compare
    const expected = createHmac('sha256', ENCRYPTION_KEY).update(payload).digest('hex')
    if (expected !== sig) return false

    const data = JSON.parse(payload) as CookiePayload

    // Verify token identity and expiry
    if (data.token !== token) return false
    if (Date.now() > data.expires) return false

    return true
  } catch {
    return false
  }
}
