import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { signInWithGoogle, signInDev } from "@/lib/auth/actions"

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.JSX.Element> {
  const { error } = await searchParams
  const isDev = process.env.NODE_ENV === "development"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto px-4">
        <Card>
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="rounded-xl bg-primary w-12 h-12 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">B</span>
              </div>
            </div>
            <CardTitle className="text-2xl">BillSync</CardTitle>
            <CardDescription>
              Sign in to manage your client billing
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error === "auth_failed" && (
              <Alert variant="destructive">
                <AlertTitle>Authentication failed</AlertTitle>
                <AlertDescription>
                  We couldn&apos;t sign you in. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {error === "not_authorized" && (
              <Alert variant="destructive">
                <AlertTitle>Access denied</AlertTitle>
                <AlertDescription>
                  Your Google account is not authorized to access BillSync.
                  Please contact your administrator.
                </AlertDescription>
              </Alert>
            )}

            {error === "not_available" && (
              <Alert variant="destructive">
                <AlertTitle>Not available</AlertTitle>
                <AlertDescription>
                  Dev login is only available in development mode.
                </AlertDescription>
              </Alert>
            )}

            {error === "dev_auth_failed" && (
              <Alert variant="destructive">
                <AlertTitle>Dev login failed</AlertTitle>
                <AlertDescription>
                  Check that <code className="font-mono text-xs">DEV_BYPASS_EMAIL</code> and{" "}
                  <code className="font-mono text-xs">DEV_BYPASS_PASSWORD</code> match a valid
                  Supabase user.
                </AlertDescription>
              </Alert>
            )}

            <form action={signInWithGoogle}>
              <Button type="submit" variant="outline" className="w-full">
                <GoogleIcon />
                Continue with Google
              </Button>
            </form>

            {/* DEV ONLY — never rendered in production */}
            {isDev && (
              <div className="border border-dashed border-amber-400 rounded-lg p-3 space-y-2">
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <Terminal className="h-3 w-3" />
                  Development only
                </p>
                <form action={signInDev}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full border-amber-400 text-amber-700 hover:bg-amber-50"
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Sign in as dev user
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-sm text-center mt-4">
          Only authorized team members can access this application.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon(): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="size-4 mr-2"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
