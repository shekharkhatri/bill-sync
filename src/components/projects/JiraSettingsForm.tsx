'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  testJiraConnectionAction,
  saveJiraConfigAction,
  saveUnverifiedJiraConfigAction,
} from '@/lib/jira/actions'
import type { ProjectJiraConfigDisplay } from '@/lib/jira/config-types'

const schema = z.object({
  instanceUrl: z
    .string()
    .min(1, 'Required')
    .url('Must be a valid URL')
    .refine((val) => !val.endsWith('/'), { message: 'Remove trailing slash' }),
  jiraProjectKey: z.string().min(1, 'Required').max(20),
  userEmail: z.string().email('Must be a valid email'),
  apiToken: z.string().min(1, 'Required'),
  jqlScope: z.string().max(500, 'JQL scope must be under 500 characters').optional(),
})

type FormValues = z.infer<typeof schema>

interface TestResult {
  success: boolean
  message: string
  jqlMatchCount?: number
}

interface JiraSettingsFormProps {
  projectId: string
  existingConfig: ProjectJiraConfigDisplay | null
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function JiraSettingsForm({
  projectId,
  existingConfig,
}: JiraSettingsFormProps): React.JSX.Element {
  const [isPending, startSaveTransition] = useTransition()
  const [isTesting, startTestTransition] = useTransition()
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [showSaveAnyway, setShowSaveAnyway] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      instanceUrl: existingConfig?.instanceUrl ?? '',
      jiraProjectKey: existingConfig?.jiraProjectKey ?? '',
      userEmail: existingConfig?.userEmail ?? '',
      apiToken: '',
      jqlScope: existingConfig?.jqlScope ?? '',
    },
  })

  function handleTest(values: FormValues): void {
    setTestResult(null)
    setShowSaveAnyway(false)
    startTestTransition(async () => {
      const result = await testJiraConnectionAction(projectId, {
        ...values,
        jqlScope: values.jqlScope?.trim() || undefined,
      })
      if (result.success) {
        setTestResult({
          success: true,
          message: `Connected to Jira project: ${result.data.projectName}`,
          jqlMatchCount: result.data.jqlMatchCount,
        })
        setShowSaveAnyway(false)
      } else {
        setTestResult({ success: false, message: result.error })
        setShowSaveAnyway(true)
      }
    })
  }

  function handleSave(values: FormValues): void {
    startSaveTransition(async () => {
      const result = await saveJiraConfigAction(projectId, {
        ...values,
        jqlScope: values.jqlScope?.trim() || undefined,
      })
      if (result.success) {
        setTestResult({ success: true, message: 'Configuration saved successfully.' })
        setShowSaveAnyway(false)
        form.reset({ ...values, apiToken: '' })
      } else {
        setTestResult({ success: false, message: result.error })
        setShowSaveAnyway(true)
      }
    })
  }

  function handleSaveAnyway(): void {
    const values = form.getValues()
    startSaveTransition(async () => {
      const result = await saveUnverifiedJiraConfigAction(projectId, {
        ...values,
        jqlScope: values.jqlScope?.trim() || undefined,
      })
      if (result.success) {
        setTestResult({ success: true, message: 'Configuration saved (unverified).' })
        setShowSaveAnyway(false)
        form.reset({ ...values, apiToken: '' })
      } else {
        setTestResult({ success: false, message: result.error })
      }
    })
  }

  return (
    <Form {...form}>
      <form className="space-y-5">
        <FormField
          control={form.control}
          name="instanceUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jira Instance URL</FormLabel>
              <FormControl>
                <Input placeholder="https://yourcompany.atlassian.net" {...field} />
              </FormControl>
              <FormDescription>Your Jira Cloud base URL, no trailing slash.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jiraProjectKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jira Project Key</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. ENG"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription>The short identifier for your Jira project.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="userEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jira Account Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@company.com" {...field} />
              </FormControl>
              <FormDescription>
                The email address associated with your Jira API token.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Token</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••••••" {...field} />
              </FormControl>
              {existingConfig && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current token: {existingConfig.maskedApiToken}
                </p>
              )}
              <FormDescription>
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Generate a token in your Atlassian account settings
                </a>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jqlScope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                JQL Scope Filter
                <Badge variant="secondary" className="ml-2 text-xs">
                  Optional
                </Badge>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder='labels = "billable"'
                  rows={3}
                  className="font-mono text-xs resize-none"
                  {...field}
                />
              </FormControl>
              <div className="space-y-2 mt-2">
                <p className="text-xs text-muted-foreground">
                  Filter which issues are included when pulling worklogs.
                </p>
                <p className="text-xs font-medium text-muted-foreground">Common examples:</p>
                <div className="rounded-md bg-muted px-3 py-2 space-y-1 font-mono text-xs text-muted-foreground">
                  <p>{'labels = "billable"'}</p>
                  <p>{'labels in ("client-a", "billable")'}</p>
                  <p>{'issuetype in (Story, Bug, Task)'}</p>
                  <p>{'sprint in openSprints()'}</p>
                  <p>{'labels = "billable" AND issuetype in (Story, Bug)'}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to include all issues in the project.
                </p>
                <Link
                  href="https://support.atlassian.com/jira-software-cloud/docs/use-advanced-search-with-jira-query-language-jql/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  JQL reference ↗
                </Link>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {testResult !== null && (
          <div>
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {testResult.success ? 'Connection successful' : 'Connection failed'}
              </AlertTitle>
              <AlertDescription>
                {testResult.message}
                {testResult.success && testResult.jqlMatchCount !== undefined && (
                  <p
                    className={`text-xs mt-1 ${
                      testResult.jqlMatchCount === 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {testResult.jqlMatchCount === 0
                      ? '⚠ JQL scope matches 0 issues — verify your filter.'
                      : `JQL scope matches ${testResult.jqlMatchCount} issue${testResult.jqlMatchCount !== 1 ? 's' : ''} in this project.`}
                  </p>
                )}
              </AlertDescription>
            </Alert>

            {!testResult.success && showSaveAnyway && (
              <button
                type="button"
                onClick={handleSaveAnyway}
                disabled={isPending}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline mt-2 cursor-pointer"
              >
                Save anyway without verification
              </button>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            disabled={isTesting || isPending}
            onClick={() => form.handleSubmit(handleTest)()}
          >
            {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>

          <Button
            type="button"
            variant="default"
            disabled={isPending || isTesting}
            onClick={() => form.handleSubmit(handleSave)()}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>

        {existingConfig?.isVerified && (
          <div className="flex items-center gap-2 mt-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">Configuration verified</span>
            {existingConfig.lastVerifiedAt && (
              <span className="text-xs text-muted-foreground">
                Last checked: {dateFormatter.format(existingConfig.lastVerifiedAt)}
              </span>
            )}
          </div>
        )}
      </form>
    </Form>
  )
}
