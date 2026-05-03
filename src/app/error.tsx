"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent>
          {error.message && (
            <p className="text-sm text-muted-foreground font-mono break-all">
              {error.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button onClick={reset}>Reset</Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
            Back to dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
