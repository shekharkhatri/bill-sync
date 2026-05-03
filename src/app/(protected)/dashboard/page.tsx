import Link from 'next/link'
import { FolderOpen, Plus } from 'lucide-react'
import { getUserContext } from '@/lib/auth/permissions'
import { getProjects } from '@/lib/projects/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ProjectCard } from '@/components/projects/ProjectCard'

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const context = await getUserContext()
  const projects = await getProjects(context.user.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {context.user.name ?? context.user.email}
          </p>
        </div>
        <PermissionGuard permission="project:create">
          <Button nativeButton={false} render={<Link href="/projects/new" />}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Project
          </Button>
        </PermissionGuard>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Create your first project to get started.
            </p>
            <PermissionGuard permission="project:create">
              <Button
                className="mt-4"
                nativeButton={false}
                render={<Link href="/projects/new" />}
              >
                Create Project
              </Button>
            </PermissionGuard>
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="text-lg font-medium mb-4">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
