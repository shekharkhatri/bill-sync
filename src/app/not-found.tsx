import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <p className="text-8xl font-bold text-muted-foreground">404</p>
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
            Back to dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
