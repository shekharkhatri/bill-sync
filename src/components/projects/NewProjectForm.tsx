'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createProjectAction } from '@/lib/projects/actions'
import { PROJECT_COLORS } from '@/lib/projects/types'
import type { ProjectColor } from '@/lib/projects/types'
import { useState } from 'react'

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  clientName: z.string().min(1, 'Client name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.enum(['slate', 'blue', 'violet', 'amber', 'emerald', 'rose']),
})

type FormValues = z.infer<typeof schema>

export function NewProjectForm(): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      clientName: '',
      description: '',
      color: 'slate',
    },
  })

  const selectedColor = form.watch('color')

  function onSubmit(values: FormValues): void {
    setError(null)
    startTransition(async () => {
      const result = await createProjectAction({
        name: values.name,
        clientName: values.clientName,
        description: values.description,
        color: values.color,
      })
      if (result.success) {
        router.push(`/projects/${result.data.id}`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Website Redesign" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief project description..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Color</FormLabel>
          <div className="flex items-center gap-3 mt-1">
            {(Object.keys(PROJECT_COLORS) as ProjectColor[]).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => form.setValue('color', color)}
                className={`h-6 w-6 rounded-full cursor-pointer flex-shrink-0 ${PROJECT_COLORS[color]} ${
                  selectedColor === color
                    ? 'ring-2 ring-offset-2 ring-primary outline-none'
                    : ''
                }`}
                aria-label={color}
              />
            ))}
          </div>
        </FormItem>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
