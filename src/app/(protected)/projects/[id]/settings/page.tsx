import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import { getProjectById } from '@/lib/projects/queries'
import { getJiraConfigForDisplay } from '@/lib/jira/queries'
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
    <div className="max-w-[900px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-2">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-foreground transition-colors"
        >
          {project.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Settings</span>
      </div>

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">{project.clientName}</p>
      </div>

      {/* Section: Project Details */}
      <div className="flex gap-10 py-8 border-t border-border">
        <div className="w-56 shrink-0">
          <p className="text-sm font-medium">Project Details</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Basic information about this project.
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                Project Name
              </dt>
              <dd className="text-sm">{project.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                Client Name
              </dt>
              <dd className="text-sm">{project.clientName}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                Status
              </dt>
              <dd className="text-sm capitalize">{project.status}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                Created
              </dt>
              <dd className="text-sm">{dateFormatter.format(project.createdAt)}</dd>
            </div>
            {project.description && (
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Description
                </dt>
                <dd className="text-sm text-muted-foreground">{project.description}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs text-muted-foreground mt-5">
            Editing project details is coming in a future update.
          </p>
        </div>
      </div>

      {/* Section: Jira Integration */}
      <div className="flex gap-10 py-8 border-t border-border">
        <div className="w-56 shrink-0">
          <p className="text-sm font-medium">Jira Integration</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Connect this project to a Jira Cloud project to pull time logs.
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <JiraSettingsForm projectId={project.id} existingConfig={existingConfig} />
          {existingConfig?.jqlScope && (
            <div className="mt-4 rounded-md bg-muted px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                Active JQL Scope
              </p>
              <p className="font-mono text-xs break-all">{existingConfig.jqlScope}</p>
            </div>
          )}
        </div>
      </div>

      {/* Section: Danger Zone */}
      <div className="flex gap-10 py-8 border-t border-border">
        <div className="w-56 shrink-0">
          <p className="text-sm font-medium text-destructive">Danger Zone</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Irreversible actions. Proceed with care.
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Archive this project</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hides the project from the dashboard. Billing records are preserved.
              </p>
            </div>
            <ArchiveProjectButton projectId={project.id} projectName={project.name} />
          </div>
        </div>
      </div>
    </div>
  )
}
