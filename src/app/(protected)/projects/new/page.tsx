import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { NewProjectForm } from '@/components/projects/NewProjectForm'

export const metadata: Metadata = { title: 'New Project — BillSync' }

export default async function NewProjectPage(): Promise<React.JSX.Element> {
  const context = await getUserContext()

  if (!hasPermission(context, 'project:create')) {
    redirect('/forbidden')
  }

  return (
    <div className="max-w-2xl">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>New Project</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Create a New Project</h1>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Set up a new project. You can connect Jira after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewProjectForm />
        </CardContent>
      </Card>
    </div>
  )
}
