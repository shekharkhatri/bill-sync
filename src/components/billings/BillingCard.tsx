import Link from 'next/link'
import { CalendarRange, FileDown } from 'lucide-react'
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
import { formatDateFull } from '@/lib/jira/format-utils'
import { BILLING_STATUS_LABELS, BILLING_STATUS_VARIANTS } from '@/lib/billings/types'
import DeleteBillingButton from '@/components/billings/DeleteBillingButton'
import type { BillingWithStats } from '@/lib/billings/types'

interface BillingCardProps {
  billing: BillingWithStats
  projectId: string
}

export function BillingCard({ billing, projectId }: BillingCardProps): React.JSX.Element {
  const isModified = billing.totalModifiedHours !== billing.totalOriginalHours

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-base font-semibold">{billing.label}</CardTitle>
          <CardDescription>
            <span className="flex items-center gap-1.5 mt-1 text-xs">
              <CalendarRange className="h-3.5 w-3.5" />
              {formatDateFull(billing.startDate)} → {formatDateFull(billing.endDate)}
            </span>
          </CardDescription>
        </div>
        <Badge variant={BILLING_STATUS_VARIANTS[billing.status]}>
          {BILLING_STATUS_LABELS[billing.status]}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Logged</p>
            <p className="text-xl font-bold">{billing.totalOriginalHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">original</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Billed</p>
            <p
              className={`text-xl font-bold ${isModified ? 'text-amber-600' : ''}`}
            >
              {billing.totalModifiedHours.toFixed(1)}h
            </p>
            <p className="text-xs text-muted-foreground">after edits</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="text-xl font-bold">{billing.worklogCount}</p>
            <p className="text-xs text-muted-foreground">worklogs</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-3 flex justify-between items-center">
        <div>
          {billing.status === 'draft' ? (
            <DeleteBillingButton
              billingId={billing.id}
              billingLabel={billing.label}
              projectId={projectId}
              redirectAfterDelete={false}
            />
          ) : billing.status === 'finalized' ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileDown className="h-3 w-3" />
              <span>Export available</span>
            </div>
          ) : (
            <div />
          )}
        </div>
        <Button
          variant="default"
          size="sm"
          nativeButton={false}
          render={<Link href={`/projects/${projectId}/billings/${billing.id}`} />}
        >
          Open Billing
        </Button>
      </CardFooter>
    </Card>
  )
}
