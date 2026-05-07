const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "ENCRYPTION_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Copy .env.local.example to .env.local and fill in all values."
    )
  }
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string
export const DATABASE_URL = process.env.DATABASE_URL as string
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL as string

// Dev-only — optional, never validated, never used in production
export const DEV_BYPASS_EMAIL = process.env.DEV_BYPASS_EMAIL ?? "shekhar@thehivecraft.com"

validateEnv()
