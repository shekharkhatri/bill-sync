'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Trash2 } from 'lucide-react'
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
import { deleteBillingAction } from '@/lib/billings/actions'

interface DeleteBillingButtonProps {
  billingId: string
  billingLabel: string
  projectId: string
  redirectAfterDelete?: boolean
}

export default function DeleteBillingButton({
  billingId,
  billingLabel,
  projectId,
  redirectAfterDelete = false,
}: DeleteBillingButtonProps): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete(): void {
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteBillingAction(billingId)
      if (result.success) {
        setOpen(false)
        if (redirectAfterDelete) {
          router.push(`/projects/${projectId}`)
        } else {
          router.refresh()
        }
      } else {
        setDeleteError(result.error)
      }
    })
  }

  return (
    <div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            />
          }
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete Draft
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this billing period?</AlertDialogTitle>
            <AlertDialogDescription render={<div />}>
              <div className="space-y-2">
                <p>
                  <span>You are about to permanently delete </span>
                  <span className="font-medium">{billingLabel}</span>
                  <span>. This will also delete all pulled worklogs.</span>
                </p>
                <p className="font-medium text-destructive">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Yes, Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {deleteError && (
        <Alert variant="destructive" className="mt-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
