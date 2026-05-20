import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getUserContext } from '@/lib/auth/permissions'
import { getProjects } from '@/lib/projects/queries'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ProjectRow } from '@/components/projects/ProjectRow'

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const context = await getUserContext()
  const projects = await getProjects(context.user.id)

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <PermissionGuard permission="project:create">
          <Button size="sm" nativeButton={false} render={<Link href="/projects/new" />}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Project
          </Button>
        </PermissionGuard>
      </div>

      {projects.length === 0 ? (
        <div className="border border-dashed border-border rounded-md py-16 text-center">
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first project to get started.
          </p>
          <PermissionGuard permission="project:create">
            <Button
              size="sm"
              className="mt-4"
              nativeButton={false}
              render={<Link href="/projects/new" />}
            >
              Create Project
            </Button>
          </PermissionGuard>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="w-8 pl-4 pr-2" />
                <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">
                  Project
                </th>
                <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">
                  Client
                </th>
                <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5 w-36">
                  Jira
                </th>
                <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5 w-36">
                  Created
                </th>
                <th className="w-28" />
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
