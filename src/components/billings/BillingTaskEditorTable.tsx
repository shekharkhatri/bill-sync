'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AddManualTaskDialog } from '@/components/billings/AddManualTaskDialog'
import BillingTaskEditorRow from '@/components/billings/BillingTaskEditorRow'
import { deleteManualTaskAction } from '@/lib/billings/actions'
import type { BillingStatus, BillingTaskSummary } from '@/lib/billings/types'

interface BillingTaskEditorTableProps {
  billingId: string
  billingStatus: BillingStatus
  tasks: BillingTaskSummary[]
  instanceUrl: string
}

export default function BillingTaskEditorTable({
  billingId,
  billingStatus,
  tasks,
  instanceUrl,
}: BillingTaskEditorTableProps): React.JSX.Element {
  const isEditable = billingStatus === 'draft'
  const router = useRouter()
  const [, startTransition] = useTransition()

  function handleDeleteManual(issueKey: string): void {
    startTransition(async () => {
      await deleteManualTaskAction(billingId, issueKey)
      router.refresh()
    })
  }

  const totalEffectiveHours = tasks.reduce((sum, t) => sum + t.effectiveSeconds, 0) / 3600
  const manualCount = tasks.filter((t) => t.isManual).length

  return (
    <div>
      {isEditable && (
        <div className="flex justify-end mb-3">
          <AddManualTaskDialog
            billingId={billingId}
            onSuccess={() => router.refresh()}
          />
        </div>
      )}

      {tasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No tasks found for this billing period.</p>
            {isEditable && (
              <p className="text-xs text-muted-foreground mt-1">
                Pull worklogs from Jira or add a manual task above.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-40">Issue</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Worklog Authors</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Entries</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tasks.map((task) => (
                    <BillingTaskEditorRow
                      key={task.jiraIssueKey}
                      billingId={billingId}
                      task={task}
                      isEditable={isEditable}
                      instanceUrl={instanceUrl}
                      onSummaryEdited={() => router.refresh()}
                      onDeleteManual={handleDeleteManual}
                    />
                  ))}
                </TableBody>

                <TableFooter>
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right text-sm">
                      {totalEffectiveHours.toFixed(2)}h
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {tasks.reduce((sum, t) => sum + t.worklogCount, 0)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>

          {manualCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-right">
              <Wrench className="h-3 w-3 inline mr-1" />
              {manualCount} manual task{manualCount !== 1 ? 's' : ''} included in totals
            </p>
          )}
        </>
      )}
    </div>
  )
}
