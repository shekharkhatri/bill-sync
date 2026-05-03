'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ProjectTabsProps {
  overviewContent: React.ReactNode
  billingsContent: React.ReactNode
}

export function ProjectTabs({
  overviewContent,
  billingsContent,
}: ProjectTabsProps): React.JSX.Element {
  return (
    <Tabs defaultValue="overview" className="mt-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="billings">Billings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        {overviewContent}
      </TabsContent>

      <TabsContent value="billings" className="mt-4">
        {billingsContent}
      </TabsContent>
    </Tabs>
  )
}
