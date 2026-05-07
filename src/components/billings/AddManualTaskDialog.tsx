'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { addManualTaskAction } from '@/lib/billings/actions'

interface AddManualTaskDialogProps {
  billingId: string
  onSuccess?: () => void
}

export function AddManualTaskDialog({
  billingId,
  onSuccess,
}: AddManualTaskDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [hours, setHours] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset(): void {
    setLabel('')
    setHours('')
    setComment('')
    setError(null)
  }

  function handleOpenChange(next: boolean): void {
    if (!next) reset()
    setOpen(next)
  }

  function handleAdd(): void {
    setError(null)
    const parsedHours = parseFloat(hours)
    if (isNaN(parsedHours) || parsedHours <= 0) {
      setError('Please enter a valid number of hours.')
      return
    }
    startTransition(async () => {
      const result = await addManualTaskAction(billingId, {
        label: label.trim(),
        hours: parsedHours,
        comment: comment.trim() || null,
      })
      if (result.success) {
        handleOpenChange(false)
        onSuccess?.()
      } else {
        setError(result.error)
      }
    })
  }

  const canSubmit = !isPending && label.trim().length > 0 && hours.trim().length > 0 && parseFloat(hours) > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="h-4 w-4 mr-1.5" />
        Add Task
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Task</DialogTitle>
          <DialogDescription>
            Add a billing line item not tracked in Jira. This could be meetings, project
            management, or ad-hoc work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="manual-label">Task Name</Label>
            <Input
              id="manual-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Project kickoff meeting"
              maxLength={200}
              autoFocus
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="manual-hours">Hours</Label>
            <div className="relative mt-1.5">
              <Input
                id="manual-hours"
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0.00"
                min="0.25"
                max="999"
                step="0.25"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                h
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Enter total hours for this task.</p>
          </div>

          <div>
            <Label htmlFor="manual-comment">
              Description{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="manual-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Brief description of the work performed"
              rows={2}
              maxLength={1000}
              className="resize-none text-sm mt-1.5"
            />
          </div>

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
          <Button onClick={handleAdd} disabled={!canSubmit}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? 'Adding...' : 'Add Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
