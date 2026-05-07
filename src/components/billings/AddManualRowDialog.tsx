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
import { addManualRowAction } from '@/lib/billings/actions'

interface AddManualRowDialogProps {
  billingId: string
  onSuccess: () => void
}

export function AddManualRowDialog({
  billingId,
  onSuccess,
}: AddManualRowDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState('')
  const [hours, setHours] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetFields(): void {
    setSummary('')
    setHours('')
    setNote('')
    setError(null)
  }

  function handleAdd(): void {
    const parsed = parseFloat(hours)
    if (isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid number of hours.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await addManualRowAction(billingId, {
        summary: summary.trim(),
        hours: parsed,
        note: note.trim() || null,
      })
      if (result.success) {
        setOpen(false)
        resetFields()
        onSuccess()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetFields()
        setOpen(next)
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="h-4 w-4 mr-1.5" />
        Add Row
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Row</DialogTitle>
          <DialogDescription>
            Add a billing line item not tracked in Jira — meetings, project management, ad-hoc
            work, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task summary */}
          <div className="space-y-1.5">
            <Label htmlFor="manual-summary">Task</Label>
            <Input
              id="manual-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Project kickoff meeting"
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Hours */}
          <div className="space-y-1.5">
            <Label htmlFor="manual-hours">Hours</Label>
            <div className="relative w-32">
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
          </div>

          {/* Internal note (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="manual-note">
              Internal Note{' '}
              <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </Label>
            <Textarea
              id="manual-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Brief description..."
              rows={2}
              maxLength={1000}
              className="resize-none text-sm"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              resetFields()
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isPending || !summary.trim() || !hours || parseFloat(hours) <= 0}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? 'Adding...' : 'Add Row'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
