'use client'

import { useState, useTransition } from 'react'
import { Pencil, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateTaskSummaryAction } from '@/lib/billings/actions'

interface EditTaskSummaryDialogProps {
  billingId: string
  issueKey: string
  currentSummary: string
  isManual: boolean
  jiraReferenceRemoved: boolean
  onSuccess?: () => void
}

export function EditTaskSummaryDialog({
  billingId,
  issueKey,
  currentSummary,
  isManual,
  jiraReferenceRemoved,
  onSuccess,
}: EditTaskSummaryDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState(currentSummary)
  const [removeReference, setRemoveReference] = useState(jiraReferenceRemoved)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean): void {
    if (!next) {
      setSummary(currentSummary)
      setRemoveReference(jiraReferenceRemoved)
      setError(null)
    }
    setOpen(next)
  }

  function handleSave(): void {
    setError(null)
    startTransition(async () => {
      const result = await updateTaskSummaryAction(
        billingId,
        issueKey,
        summary.trim(),
        isManual ? true : removeReference,
      )
      if (result.success) {
        setOpen(false)
        onSuccess?.()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="h-7 px-2" />}>
        <Pencil className="h-3.5 w-3.5 mr-1" />
        Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task Summary</DialogTitle>
          <DialogDescription>
            {isManual
              ? 'Update the name of this manually added task.'
              : 'Override the Jira issue summary shown in this billing. The original Jira data is preserved.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-summary">Task Summary</Label>
            <Input
              id="edit-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter task summary"
              maxLength={200}
              className="mt-1.5"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isPending && summary.trim()) handleSave()
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">{summary.length}/200 characters</p>
          </div>

          {!isManual && (
            <div className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
              <Checkbox
                id="remove-ref"
                checked={removeReference}
                onCheckedChange={(v) => setRemoveReference(Boolean(v))}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="remove-ref" className="text-sm font-medium cursor-pointer">
                  Remove Jira issue reference
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When checked, the Jira issue key ({issueKey}) will not appear in exports or
                  the billing view. The link is kept internally for audit.
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || summary.trim().length === 0}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
