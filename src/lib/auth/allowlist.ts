import { db } from "@/lib/db/client"

/**
 * Checks if an email address is on the login allowlist. Fails closed on error.
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  try {
    const row = await db
      .selectFrom("allowed_emails")
      .select("id")
      .where("email", "=", email.toLowerCase())
      .limit(1)
      .executeTakeFirst()

    return row !== undefined
  } catch (err) {
    console.error("[isEmailAllowed] Database error — denying access:", err)
    return false
  }
}
