import Link from 'next/link'
import { CheckCircle2, AlertCircle, Circle, Settings } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PROJECT_COLORS } from '@/lib/projects/types'
import type { ProjectWithJiraStatus, ProjectColor } from '@/lib/projects/types'

interface ProjectCardProps {
  project: ProjectWithJiraStatus
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function ProjectCard({ project }: ProjectCardProps): React.JSX.Element {
  const colorClass =
    project.color && project.color in PROJECT_COLORS
      ? PROJECT_COLORS[project.color as ProjectColor]
      : 'bg-slate-500'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <div className={`h-3 w-3 rounded-full mt-1 flex-shrink-0 ${colorClass}`} />
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {project.name}
            </CardTitle>
            <CardDescription className="truncate">{project.clientName}</CardDescription>
          </div>
        </div>
        <div className="flex-shrink-0">
          {project.status === 'active' ? (
            <Badge variant="secondary">Active</Badge>
          ) : (
            <Badge variant="outline">Archived</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          {project.hasJiraConfig && project.jiraVerified ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Jira connected</span>
            </>
          ) : project.hasJiraConfig && !project.jiraVerified ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">Jira unverified</span>
            </>
          ) : (
            <>
              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">No Jira config</span>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center pt-3 border-t">
        <span className="text-xs text-muted-foreground">
          {dateFormatter.format(project.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/projects/${project.id}/settings`} />}
          >
            <Settings className="h-3.5 w-3.5 mr-1" />
            Settings
          </Button>
          <Button
            variant="default"
            size="sm"
            nativeButton={false}
            render={<Link href={`/projects/${project.id}`} />}
          >
            Open
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
