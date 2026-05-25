// SERVER ONLY — this is a Route Handler, never imported from CC
import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { ENCRYPTION_KEY } from '@/lib/env'
import { getShareTokenByValue } from '@/lib/share/queries'
import { verifyPassword } from '@/lib/share/password'

interface RouteParams {
  params: Promise<{ token: string }>
}

interface VerifyBody {
  password?: unknown
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  const { token } = await params

  // Parse body
  let body: VerifyBody
  try {
    body = (await request.json()) as VerifyBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const password = body.password
  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
  }

  // Load token row
  const tokenRow = await getShareTokenByValue(token)
  if (!tokenRow || !tokenRow.isActive) {
    return NextResponse.json({ error: 'Link unavailable.' }, { status: 404 })
  }

  if (!tokenRow.passwordEnabled || !tokenRow.passwordHash) {
    return NextResponse.json({ error: 'This link is not password protected.' }, { status: 400 })
  }

  // Verify password
  const ok = await verifyPassword(password, tokenRow.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  // Build HMAC-signed cookie payload
  const payload = JSON.stringify({ token, expires: Date.now() + 86_400_000 })
  const sig = createHmac('sha256', ENCRYPTION_KEY).update(payload).digest('hex')
  const cookieValue = Buffer.from(JSON.stringify({ payload, sig })).toString('base64')

  const cookieName = `share_auth_${token.substring(0, 8)}`

  const response = NextResponse.json({ ok: true })
  response.headers.set(
    'Set-Cookie',
    `${cookieName}=${cookieValue}; HttpOnly; Path=/share/${token}; Max-Age=86400; SameSite=Lax`,
  )

  return response
}
