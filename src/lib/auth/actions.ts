"use server"

import { redirect } from "next/navigation"
import { createActionClient } from "@/lib/auth/clients"
import { APP_URL } from "@/lib/env"

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
