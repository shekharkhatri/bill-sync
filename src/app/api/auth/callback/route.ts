import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { bootstrapUser } from "@/lib/auth/bootstrap"
import { isEmailAllowed } from "@/lib/auth/allowlist"
import { APP_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env"

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", APP_URL))
  }

  // Route Handlers must read cookies from the Request and write them onto the
  // Response explicitly. Using next/headers cookies() here doesn't attach the
  // session cookies to the redirect response, so the browser never gets the
  // session — causing a redirect loop back to /login in production.
  let response = NextResponse.redirect(new URL("/dashboard", APP_URL))

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", APP_URL))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !(await isEmailAllowed(user.email))) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL("/login?error=not_authorized", APP_URL))
  }

  await bootstrapUser(user)

  return response
}
