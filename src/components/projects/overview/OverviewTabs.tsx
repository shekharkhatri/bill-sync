'use client'

import { useState } from 'react'
import { LayoutList, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Hours', value: data.totalHours.toFixed(2) + 'h' },
          { label: 'Tasks', value: String(data.totalTasks) },
          { label: 'Worklog Authors', value: String(data.totalAuthors) },
          { label: 'Period', value: periodLabel },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold tabular-nums mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="mb-1">
          <TabsTrigger value="tasks">
            <LayoutList className="h-3.5 w-3.5 mr-1.5" />
            By Task
            <Badge variant="secondary" className="ml-2 text-xs">
              {data.totalTasks}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="authors">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            By Worklog Author
            <Badge variant="secondary" className="ml-2 text-xs">
              {data.totalAuthors}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-3">
          <TaskListView
            tasks={data.tasks}
            instanceUrl={instanceUrl}
            onTaskClick={(task) => setSelectedTask(task)}
          />
        </TabsContent>

        <TabsContent value="authors" className="mt-3">
          {authorContent}
        </TabsContent>
      </Tabs>

      <TaskDetailSheet
        task={selectedTask}
        instanceUrl={instanceUrl}
        onClose={() => setSelectedTask(null)}
      />
    </>
  )
}
