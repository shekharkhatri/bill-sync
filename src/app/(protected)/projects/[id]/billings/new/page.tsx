import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import { getProjectById } from '@/lib/projects/queries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CreateBillingForm } from '@/components/billings/CreateBillingForm'

export const metadata: Metadata = { title: 'New Billing — BillSync' }

interface NewBillingPageProps {
  params: Promise<{ id: string }>
}

export default async function NewBillingPage({
  params,
}: NewBillingPageProps): Promise<React.JSX.Element> {
  const { id } = await params
  const context = await getUserContext()

  if (!hasPermission(context, 'billing:create')) {
    redirect('/forbidden')
  }

  const project = await getProjectById(id)
  if (!project) notFound()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/projects/${id}`} className="hover:text-foreground transition-colors">
          {project.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/projects/${id}`} className="hover:text-foreground transition-colors">
          Billings
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span>New Billing Period</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Billing Period</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Define the date range to pull time logs from Jira.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing Details</CardTitle>
          <CardDescription>
            Once created, worklogs from Jira will be pulled automatically for the selected date
            range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateBillingForm projectId={project.id} />
        </CardContent>
      </Card>
    </div>
  )
}
