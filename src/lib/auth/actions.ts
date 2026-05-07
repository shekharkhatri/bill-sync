"use server"

import { redirect } from "next/navigation"
import { createActionClient } from "@/lib/auth/clients"
import { APP_URL, DEV_BYPASS_EMAIL } from "@/lib/env"
import { createAdminClient } from "@/lib/auth/clients"

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createActionClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${APP_URL}/api/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  if (error || !data.url) {
    redirect("/login?error=auth_failed")
  }

  redirect(data.url)
}

export async function signOut(): Promise<void> {
  const supabase = await createActionClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function signInDev(): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    redirect("/login?error=not_available")
  }

  // Step 1: Admin client generates a one-time magic link token (no email is sent)
  const admin = createAdminClient()
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: DEV_BYPASS_EMAIL,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[signInDev] generateLink error:", linkError?.message)
    redirect("/login?error=dev_auth_failed")
  }

  // Step 2: Action client exchanges the token for a real session (writes cookies)
  const supabase = await createActionClient()
  const { error: otpError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  })

  if (otpError) {
    console.error("[signInDev] verifyOtp error:", otpError.message)
    redirect("/login?error=dev_auth_failed")
  }

  redirect("/dashboard")
}
