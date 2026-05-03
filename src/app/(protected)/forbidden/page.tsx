import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <ShieldX className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-semibold tracking-tight mt-2">Access Denied</h1>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view this page.
            Contact your administrator if you believe this is a mistake.
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
