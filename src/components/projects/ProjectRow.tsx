'use client'

import Link from 'next/link'
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react'
import { PROJECT_COLORS } from '@/lib/projects/types'
import type { ProjectWithJiraStatus, ProjectColor } from '@/lib/projects/types'

interface ProjectRowProps {
  project: ProjectWithJiraStatus
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function ProjectRow({ project }: ProjectRowProps): React.JSX.Element {
  const colorClass =
    project.color && project.color in PROJECT_COLORS
      ? PROJECT_COLORS[project.color as ProjectColor]
      : 'bg-gray-400'

  return (
    <tr className="h-12 hover:bg-gray-50 transition-colors group border-b border-border last:border-0">
      {/* Color dot */}
      <td className="pl-4 pr-2 w-8">
        <span
          className={`block h-2 w-2 rounded-full ${colorClass} ${
            project.status === 'archived' ? 'opacity-40' : ''
          }`}
        />
      </td>

      {/* Project name */}
      <td className="px-3 py-0">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-medium hover:text-blue-600 transition-colors"
        >
          {project.name}
        </Link>
        {project.status === 'archived' && (
          <span className="ml-2 text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
            Archived
          </span>
        )}
      </td>

      {/* Client */}
      <td className="px-3 text-sm text-muted-foreground">{project.clientName}</td>

      {/* Jira status */}
      <td className="px-3 w-36">
        {project.hasJiraConfig && project.jiraVerified ? (
          <div className="flex items-center gap-1.5 text-success-600">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">Connected</span>
          </div>
        ) : project.hasJiraConfig ? (
          <div className="flex items-center gap-1.5 text-warning-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">Unverified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Circle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">Not connected</span>
          </div>
        )}
      </td>

      {/* Created date */}
      <td className="px-3 text-sm text-muted-foreground tabular-nums w-36">
        {dateFormatter.format(project.createdAt)}
      </td>

      {/* Actions — reveal on row hover */}
      <td className="pl-3 pr-4 w-28 text-right">
        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/projects/${project.id}/settings`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Settings
          </Link>
          <Link
            href={`/projects/${project.id}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Open →
          </Link>
        </div>
      </td>
    </tr>
  )
}
