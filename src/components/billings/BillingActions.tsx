'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ClipboardCheck, Lock, Undo2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { updateBillingStatusAction } from '@/lib/billings/actions'
import type { BillingWithStats } from '@/lib/billings/types'

interface BillingActionsProps {
  billing: BillingWithStats
  canFinalize: boolean
}

export default function BillingActions({
  billing,
  canFinalize,
}: BillingActionsProps): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  function handleStatusChange(status: 'draft' | 'reviewed' | 'finalized'): void {
    setActionError(null)
    startTransition(async () => {
      const result = await updateBillingStatusAction(billing.id, status)
      if (result.success) {
        router.refresh()
      } else {
        setActionError(result.error)
      }
    })
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {billing.status === 'draft' && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={isPending} />}>
              <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
              Mark as Reviewed
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark billing as reviewed?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will lock the worklogs for editing. You can revert to draft if changes are
                  needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleStatusChange('reviewed')}>
                  Mark as Reviewed
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {billing.status === 'reviewed' && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusChange('draft')}
            >
              <Undo2 className="h-3.5 w-3.5 mr-1.5" />
              Revert to Draft
            </Button>

            {canFinalize && (
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="default" size="sm" disabled={isPending} />}>
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Finalize
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Finalize this billing?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Finalizing locks the billing permanently. You will not be able to make
                      further edits. Make sure the worklogs are correct before proceeding.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusChange('finalized')}>
                      Finalize Billing
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}

        {billing.status === 'finalized' && (
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Finalized — Export available below
          </span>
        )}
      </div>

      {actionError && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
