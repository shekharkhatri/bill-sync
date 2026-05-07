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
import { updateWorklogSummaryAction } from '@/lib/billings/actions'

interface EditWorklogSummaryDialogProps {
  worklogId: string
  currentSummary: string
  jiraIssueKey: string
  jiraReferenceRemoved: boolean
  isManual: boolean
  onSuccess: () => void
}

export function EditWorklogSummaryDialog({
  worklogId,
  currentSummary,
  jiraIssueKey,
  jiraReferenceRemoved,
  isManual,
  onSuccess,
}: EditWorklogSummaryDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState(currentSummary)
  const [removeRef, setRemoveRef] = useState(jiraReferenceRemoved)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean): void {
    if (!next) {
      setSummary(currentSummary)
      setRemoveRef(jiraReferenceRemoved)
      setError(null)
    }
    setOpen(next)
  }

  function handleSave(): void {
    setError(null)
    startTransition(async () => {
      const result = await updateWorklogSummaryAction(
        worklogId,
        summary.trim(),
        isManual ? true : removeRef,
      )
      if (result.success) {
        setOpen(false)
        onSuccess()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            aria-label="Edit task summary"
          />
        }
      >
        <Pencil className="h-3 w-3" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task Summary</DialogTitle>
          <DialogDescription>
            This change is local to this billing only. The original Jira issue is unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="worklog-summary">Task Summary</Label>
            <Input
              id="worklog-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter task summary"
              maxLength={200}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isPending && summary.trim()) handleSave()
              }}
            />
            <p className="text-xs text-muted-foreground">{summary.length}/200</p>
          </div>

          {!isManual && (
            <div className="flex items-start gap-3 rounded-md border p-3 bg-muted/30">
              <Checkbox
                id="remove-jira-ref"
                checked={removeRef}
                onCheckedChange={(v) => setRemoveRef(Boolean(v))}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="remove-jira-ref" className="text-sm font-medium cursor-pointer">
                  Remove Jira link
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hides {jiraIssueKey} from this billing row. Kept internally for reference.
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
          <Button
            onClick={handleSave}
            disabled={isPending || !summary.trim()}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
