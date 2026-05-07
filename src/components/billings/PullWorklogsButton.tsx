'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Download, Loader2, RefreshCw } from 'lucide-react'
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
import { pullWorklogsAction } from '@/lib/billings/actions'

interface PullWorklogsButtonProps {
  billingId: string
  hasExistingWorklogs: boolean
}

export default function PullWorklogsButton({
  billingId,
  hasExistingWorklogs,
}: PullWorklogsButtonProps): React.JSX.Element {
  const router = useRouter()
  const [isPulling, startPullingTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [pullError, setPullError] = useState<string | null>(null)

  function handlePull(): void {
    setPullError(null)
    startPullingTransition(async () => {
      const result = await pullWorklogsAction(billingId)
      setShowConfirm(false)
      if (result.success) {
        router.refresh()
      } else {
        setPullError(result.error)
      }
    })
  }

  return (
    <div>
      {hasExistingWorklogs ? (
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Re-pull from Jira
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Re-pull worklogs from Jira?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all existing worklogs for this billing period and replace them
                with fresh data from Jira. Any unsaved edits will be lost. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePull}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPulling ? 'Pulling...' : 'Yes, Re-pull'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button variant="outline" size="sm" onClick={handlePull} disabled={isPulling}>
          {isPulling ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5 mr-1.5" />
          )}
          {isPulling ? 'Pulling from Jira...' : 'Pull from Jira'}
        </Button>
      )}

      {pullError && (
        <Alert variant="destructive" className="mt-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{pullError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
