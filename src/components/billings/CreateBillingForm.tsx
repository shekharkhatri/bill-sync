'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, TriangleAlert } from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { createBillingAction } from '@/lib/billings/actions'
import { getCurrentMonthRange } from '@/lib/billings/date-utils'

const schema = z
  .object({
    label: z.string().min(1, 'Label is required').max(100),
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    endDate: z
      .string()
      .min(1, 'End date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

type FormValues = z.infer<typeof schema>

interface CreateBillingFormProps {
  projectId: string
}

export function CreateBillingForm({ projectId }: CreateBillingFormProps): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null)
  const [pullMessage, setPullMessage] = useState<{
    type: 'success' | 'warning' | 'info'
    text: string
  } | null>(null)

  const defaults = getCurrentMonthRange()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: '',
      startDate: defaults.startDate,
      endDate: defaults.endDate,
    },
  })

  function handleSubmit(values: FormValues): void {
    setError(null)
    setOverlapWarning(null)
    setPullMessage(null)

    startTransition(async () => {
      const result = await createBillingAction(projectId, values)

      if (!result.success) {
        setError(result.error)
        return
      }

      const { id, warning, pullStatus, worklogCount } = result.data

      if (warning) setOverlapWarning(warning)

      if (pullStatus === 'success') {
        setPullMessage({
          type: 'success',
          text: `Billing created. ${worklogCount ?? 0} worklogs pulled from Jira.`,
        })
      } else if (pullStatus === 'failed') {
        setPullMessage({
          type: 'warning',
          text: 'Billing created but worklog pull failed. You can re-pull from the billing page.',
        })
      } else {
        setPullMessage({
          type: 'info',
          text: 'Billing created. Connect Jira in project settings to pull worklogs.',
        })
      }

      setTimeout(() => {
        router.push(`/projects/${projectId}/billings/${id}`)
      }, 1500)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Label</FormLabel>
              <FormControl>
                <Input placeholder="e.g. April 2025 Invoice" {...field} />
              </FormControl>
              <FormDescription>A short name to identify this billing period.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>First day of the billing period.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>Last day of the billing period (inclusive).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {overlapWarning && (
          <Alert>
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Date overlap detected</AlertTitle>
            <AlertDescription>{overlapWarning}</AlertDescription>
          </Alert>
        )}

        {pullMessage && (
          <Alert variant={pullMessage.type === 'success' ? 'default' : 'default'}>
            <AlertDescription>{pullMessage.text}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? 'Creating...' : 'Create Billing Period'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
