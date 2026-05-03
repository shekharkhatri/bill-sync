import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import { getProjectById } from '@/lib/projects/queries'
import { getJiraConfigForDisplay } from '@/lib/jira/queries'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { JiraSettingsForm } from '@/components/projects/JiraSettingsForm'
import { ArchiveProjectButton } from '@/components/projects/ArchiveProjectButton'

export const metadata: Metadata = { title: 'Project Settings — BillSync' }

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

interface SettingsPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectSettingsPage({
  params,
}: SettingsPageProps): Promise<React.JSX.Element> {
  const { id } = await params
  const context = await getUserContext()

  if (!hasPermission(context, 'jira:manage')) {
    redirect('/forbidden')
  }

  const project = await getProjectById(id)
  if (!project) notFound()

  const existingConfig = await getJiraConfigForDisplay(id)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/projects/${project.id}`}
            className="hover:text-foreground transition-colors"
          >
            {project.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>Settings</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">
          {project.name} — Settings
        </h1>
        <p className="text-muted-foreground">{project.clientName}</p>
      </div>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Basic information about this project.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <dt className="text-sm font-medium">Project Name</dt>
              <dd className="text-sm text-muted-foreground">{project.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Client Name</dt>
              <dd className="text-sm text-muted-foreground">{project.clientName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Status</dt>
              <dd className="text-sm text-muted-foreground capitalize">{project.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Created</dt>
              <dd className="text-sm text-muted-foreground">
                {dateFormatter.format(project.createdAt)}
              </dd>
            </div>
            {project.description && (
              <div className="col-span-2">
                <dt className="text-sm font-medium">Description</dt>
                <dd className="text-sm text-muted-foreground">{project.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Editing project details coming in a future update.
          </p>
        </CardFooter>
      </Card>

      {/* Jira Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Jira Integration</CardTitle>
          <CardDescription>
            Connect this project to a Jira Cloud project to pull time logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JiraSettingsForm projectId={project.id} existingConfig={existingConfig} />
          {existingConfig?.jqlScope && (
            <div className="mt-4 rounded-md bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Active JQL Scope</p>
              <p className="font-mono text-xs text-foreground break-all">
                {existingConfig.jqlScope}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Archive this project</p>
              <p className="text-muted-foreground text-xs mt-1">
                Hides the project from the dashboard. Billing records are preserved.
              </p>
            </div>
            <ArchiveProjectButton projectId={project.id} projectName={project.name} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
