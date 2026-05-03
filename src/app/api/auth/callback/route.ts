import { NextResponse } from "next/server"
import { createActionClient } from "@/lib/auth/clients"
import { bootstrapUser } from "@/lib/auth/bootstrap"
import { isEmailAllowed } from "@/lib/auth/allowlist"
import { APP_URL } from "@/lib/env"

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", APP_URL))
  }

  const supabase = await createActionClient()

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

  return NextResponse.redirect(new URL("/dashboard", APP_URL))
}
