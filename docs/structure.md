# File Structure

## App Router
```
src/app/
  layout.tsx                            ← root layout
  page.tsx                              ← redirect → /dashboard
  error.tsx                             ← root error boundary
  not-found.tsx
  globals.css
  (auth)/
    login/page.tsx                      ← public, Google sign-in button
  (protected)/
    layout.tsx                          ← requireSession, nav sidebar
    forbidden/page.tsx
    dashboard/page.tsx                  ← project grid
    projects/
      new/page.tsx                      ← NewProjectForm
      [id]/
        page.tsx                        ← project overview + live Jira hours
        settings/page.tsx               ← JiraSettingsForm
        billings/
          new/page.tsx                  ← CreateBillingForm
          [billingId]/page.tsx          ← billing editor (WorklogEditorTable active)
  api/
    auth/callback/route.ts              ← OAuth exchange + bootstrapUser
```

## Lib
```
src/lib/
  env.ts                        ← validateEnv(), typed env consts
  utils.ts                      ← cn() and misc helpers
  db/
    client.ts                   ← single Kysely instance (KC) — import this
    types.ts                    ← Database interface (manual, sync with schema.sql)
    schema.sql                  ← full DDL + seeds
  auth/
    clients.ts                  ← createServerClient/ActionClient/AdminClient
    session.ts                  ← getSession, requireSession, getUserContext
    bootstrap.ts                ← bootstrapUser() — idempotent upsert
    actions.ts                  ← signInWithGoogle, signOut SA
    permissions.ts              ← hasPermission, guardAction, getUserPermissions
    allowlist.ts                ← isEmailAllowed()
    types.ts                    ← AuthUser, SessionUser, UserContext, PermissionKey
  projects/
    types.ts                    ← Project, ProjectWithJiraStatus, PROJECT_COLORS
    queries.ts                  ← getProjects, createProject, archiveProject...
    actions.ts                  ← createProjectAction, archiveProjectAction
  billings/
    types.ts                    ← Billing, Worklog, WorklogWithEffective, BillingTaskSummary
    queries.ts                  ← getWorklogsByBilling, insertWorklogs, updateWorklog...
    actions.ts                  ← all billing SA (see docs/billing.md)
    worklog-store.ts            ← EditorState pure fns (CC-safe, no server imports)
    date-utils.ts               ← parseDateString, formatDateRange, isDateRangeValid
    period-filter-types.ts      ← PeriodPreset, DatePeriodFilter, getDefaultPeriodFilter
  jira/
    client.ts                   ← testJiraConnection, fetchWorklogsForProject SERVER ONLY
    queries.ts                  ← getJiraConfig, getDecryptedJiraConfig, upsertJiraConfig
    actions.ts                  ← testJiraConnectionAction, saveJiraConfigAction SA
    types.ts                    ← JiraWorklog, JiraIssue, JiraConnectionConfig...
    config-types.ts             ← ProjectJiraConfig, SaveJiraConfigInput
    overview-types.ts           ← ProjectOverviewData, OverviewTaskSummary...
    dashboard-types.ts          ← JiraProjectSummary, JiraMemberSummary (legacy)
    live-hours.ts               ← getLiveProjectHours, getProjectOverviewData SERVER ONLY
    format-utils.ts             ← formatHours, formatDateShort (browser-safe)
    error-messages.ts           ← mapJiraError()
  crypto/
    encryption.ts               ← encrypt, decrypt, maskToken SERVER ONLY
  export/
    (empty — xlsx.ts pending Batch 9)
```

## Components
```
src/components/
  shared/
    PermissionGuard.tsx         ← SC wrapper, renders children if permission met
    SignOutButton.tsx            ← CC, calls signOut SA
    SignOutMenuItem.tsx          ← CC, dropdown menu variant
    DatePeriodFilter.tsx         ← CC, preset picker + custom date range
  projects/
    ProjectCard.tsx              ← SC, dashboard card
    NewProjectForm.tsx           ← CC, react-hook-form + zod
    ProjectTabs.tsx              ← CC, overview + billings slots
    JiraSettingsForm.tsx         ← CC, test + save Jira config
    ArchiveProjectButton.tsx     ← CC, AlertDialog confirm
    LiveHoursContainer.tsx       ← CC, filter state + URL sync + Suspense key
    ProjectOverviewPanel.tsx     ← SC, calls getProjectOverviewData
    LiveHoursSkeleton.tsx        ← SC, skeleton for Suspense fallback
    LiveHoursPanel.tsx           ← SC, legacy panel (superseded by ProjectOverviewPanel)
    RefreshButton.tsx            ← CC, router.refresh()
    HoursSummaryCards.tsx        ← SC, stat cards
    MemberHoursTable.tsx         ← SC, per-author table
    RecentWorklogsTable.tsx      ← SC, recent entries table
    overview/
      OverviewTabs.tsx           ← CC, by-task / by-author Tabs
      TaskListView.tsx           ← CC, clickable task rows
      TaskDetailSheet.tsx        ← CC, Shadcn Sheet, per-task author breakdown
      AuthorSummaryView.tsx      ← SC, worklog author cards
      AuthorTaskCollapsible.tsx  ← CC, collapsible task list per author
  billings/
    BillingCard.tsx              ← SC, project page billing list item
    CreateBillingForm.tsx        ← CC, DatePeriodFilter integrated
    WorklogEditorTable.tsx       ← CC, active billing editor (raw per-row)
    WorklogEditorRow.tsx         ← CC, single worklog row
    BillingTaskEditorTable.tsx   ← CC, task-aggregated editor (built, not active)
    BillingTaskEditorRow.tsx     ← CC, single task row (for BillingTaskEditorTable)
    HoursInput.tsx               ← CC, decimal hours → seconds conversion input
    PullWorklogsButton.tsx       ← CC, first-pull vs re-pull with confirm dialog
    BillingActions.tsx           ← CC, status transition workflow buttons
    WorklogSummaryFooter.tsx     ← CC, sticky bottom bar with totals
    DeleteBillingButton.tsx      ← CC, AlertDialog, draft only
    AddManualRowDialog.tsx       ← CC, add non-Jira line item to billing
    AddManualTaskDialog.tsx      ← CC, legacy (for BillingTaskEditorTable)
    EditWorklogSummaryDialog.tsx ← CC, edit row summary + remove Jira link
    EditTaskSummaryDialog.tsx    ← CC, legacy (for BillingTaskEditorTable)
  ui/                            ← Shadcn/ui components (generated, do not edit)
```
