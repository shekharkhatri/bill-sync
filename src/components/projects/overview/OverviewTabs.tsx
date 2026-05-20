'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TaskListView } from '@/components/projects/overview/TaskListView'
import { TaskDetailSheet } from '@/components/projects/overview/TaskDetailSheet'
import { formatDateRange } from '@/lib/billings/date-utils'
import type { ProjectOverviewData, OverviewTaskSummary } from '@/lib/jira/overview-types'

interface OverviewTabsProps {
  data: ProjectOverviewData
  instanceUrl: string
  authorContent: React.ReactNode
}

export function OverviewTabs({
  data,
  instanceUrl,
  authorContent,
}: OverviewTabsProps): React.JSX.Element {
  const [selectedTask, setSelectedTask] = useState<OverviewTaskSummary | null>(null)
  const [activeTab, setActiveTab] = useState<'tasks' | 'authors'>('tasks')

  const periodLabel = formatDateRange(
    data.dateRange.startDate,
    data.dateRange.endDate,
  )

  return (
    <>
      {/* Inline stat row — 48px, divided, no card borders */}
      <div className="flex items-stretch h-12 border border-border rounded-md mb-4 divide-x divide-border overflow-hidden">
        <div className="flex flex-col justify-center px-5 min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-none mb-1">
            Total Hours
          </span>
          <span className="text-base font-semibold tabular-nums leading-none">
            {data.totalHours.toFixed(1)}h
          </span>
        </div>
        <div className="flex flex-col justify-center px-5 min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-none mb-1">
            Tasks
          </span>
          <span className="text-base font-semibold tabular-nums leading-none">
            {data.totalTasks}
          </span>
        </div>
        <div className="flex flex-col justify-center px-5 min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-none mb-1">
            Authors
          </span>
          <span className="text-base font-semibold tabular-nums leading-none">
            {data.totalAuthors}
          </span>
        </div>
        <div className="flex flex-col justify-center px-5 min-w-0 flex-1">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-none mb-1">
            Period
          </span>
          <span className="text-sm tabular-nums text-muted-foreground leading-none truncate">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* Underline tabs */}
      <div className="flex border-b border-border mb-0">
        <button
          type="button"
          className={cn(
            'px-4 h-10 text-[13px] font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'tasks'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setActiveTab('tasks')}
        >
          By Task
          <span className="ml-2 text-[11px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded tabular-nums">
            {data.totalTasks}
          </span>
        </button>
        <button
          type="button"
          className={cn(
            'px-4 h-10 text-[13px] font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'authors'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setActiveTab('authors')}
        >
          By Worklog Author
          <span className="ml-2 text-[11px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded tabular-nums">
            {data.totalAuthors}
          </span>
        </button>
      </div>

      {/* Tab content */}
      <div className="mt-0 pt-4">
        {activeTab === 'tasks' ? (
          <TaskListView
            tasks={data.tasks}
            instanceUrl={instanceUrl}
            onTaskClick={(task) => setSelectedTask(task)}
          />
        ) : (
          authorContent
        )}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        instanceUrl={instanceUrl}
        onClose={() => setSelectedTask(null)}
      />
    </>
  )
}
