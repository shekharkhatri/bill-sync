# Component Patterns

## SC vs CC Decision
SC (default): data display, page shells, permission guards, static layout, async data
CC ('use client'): forms, dialogs, sheets, tabs, toggles, anything with onClick / useState / useTransition

## Data Flow
Page (SC) → fetches all data server-side → passes as props to CC children
CC never fetches data — receives props, calls SA for mutations
SA returns ActionResult<T> → CC handles success/error state locally

## Slot Pattern (SC child inside CC)
Problem: CC cannot import SC (would bundle server-only deps like pg into browser).
Solution: parent SC renders the SC child and passes it as a ReactNode prop.

```tsx
// page.tsx (SC)
<LiveHoursContainer filterKey={key} initialFilter={filter}>
  <ProjectOverviewPanel projectId={id} startDate={start} endDate={end} />
</LiveHoursContainer>

// LiveHoursContainer.tsx (CC) — accepts children: React.ReactNode
<Suspense key={filterKey} fallback={<Skeleton />}>
  {children}
</Suspense>
```
Used for: LiveHoursContainer ← ProjectOverviewPanel, ProjectTabs ← overview/billings content,
OverviewTabs ← AuthorSummaryView.

## Suspense + filterKey Pattern
SC data fetchers calling slow APIs are wrapped in Suspense.
`key={filterKey}` from the server forces remount when URL params change → shows skeleton.
`filterKey` must come from the server (URL params), not client useState — otherwise stale.

```tsx
// Server derives key from URL search params
filterKey={`${start}-${end}`}
// Client changes URL via router.replace() → server re-renders → new key → Suspense remounts
```

## Form Pattern
CC forms use react-hook-form + zod schema for client-side validation.
On submit: `startTransition(async () => { const r = await someAction(...); ... })`.
Never use FormData with SA — pass typed plain objects.
Show `<Alert variant="destructive">` for errors, navigate/callback on success.

## Permission Gating
In SC: `<PermissionGuard permission="key">{children}</PermissionGuard>`
In SA: after `requireSession()` → `await guardAction(userId, 'key')`
In page: `if (!hasPermission(context, 'key')) redirect('/forbidden')`

## Router Refresh Pattern
After any SA mutation in CC: `router.refresh()` re-runs all SCs on the current page.
This is the primary data-refresh mechanism — no client-side cache or SWR.
WorklogEditorTable uses `worklogIds` memo key in useEffect to detect prop change
(i.e., rows added/deleted) and reset local editor state.

## Base UI Component Pattern
Shadcn components based on Base UI use `render={<element />}` prop (NOT asChild):
```tsx
// DialogTrigger, CollapsibleTrigger, TooltipTrigger
<TooltipTrigger render={<Button variant="ghost" size="icon" />}>
  <Icon />
</TooltipTrigger>
```

## Effective Values in Billing UI
```
effectiveSeconds = modifiedSeconds ?? originalSeconds
effectiveComment = modifiedComment        ← NEVER falls back to originalComment
displaySummary   = customSummary ?? issueSummary ?? jiraIssueKey
displayIssueKey  = jiraReferenceRemoved ? null : jiraIssueKey
```
These are computed in `getWorklogsByBilling` query mapping — never re-derived in components.
