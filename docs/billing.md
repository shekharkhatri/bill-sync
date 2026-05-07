# Billing Module

## Status Machine
```
draft → reviewed → finalized
reviewed → draft   (revert, requires billing:finalize permission)
finalized: locked, no revert (Phase 1)
```
Enforced by `updateBillingStatusAction` via `ALLOWED_TRANSITIONS` map.

## Worklog Snapshot Principle
On billing create: `pullWorklogsAction()` auto-triggered.
Worklogs stored as DB snapshot — Jira changes after pull are NOT reflected.
Re-pull only available in draft status → deletes all non-manual rows, re-inserts from Jira.

## Row Types
| Type   | is_manual | Source                       | jira_reference_removed |
|--------|-----------|------------------------------|------------------------|
| Jira   | false     | fetched via fetchWorklogsForProject | false (default) |
| Manual | true      | user-added via AddManualRowDialog   | true (always)   |

Manual rows: synthetic `jira_issue_key = 'MANUAL-{timestamp}'` (never shown in UI).

## Active Billing Editor (WorklogEditorTable)
One row per raw worklog entry. Located: `src/components/billings/WorklogEditorTable.tsx`.
Route: `/projects/[id]/billings/[billingId]`

Columns (left → right):
| # | Header        | Width       | Notes                               |
|---|---------------|-------------|-------------------------------------|
| 1 | Task          | min-w-220px | issue key badge + summary + edit btn|
| 2 | Original      | w-28 right  | originalSeconds / 3600, read-only   |
| 3 | Modified      | w-36        | HoursInput or read-only display     |
| 4 | Internal Note | min-w-200px | modifiedComment only, blank default |
| 5 | (dirty dot)   | w-6         | amber dot when isDirty              |
| 6 | (actions)     | w-20        | reset (non-manual) + delete (Trash2)|

Removed columns: Author, Date. Comment pre-fill from Jira: removed.

## BillingTaskEditorTable (built, not active)
Aggregated task view at `src/components/billings/BillingTaskEditorTable.tsx`.
Not wired to billing detail page yet. Active after Batch 10 switchover.

## Manual Rows Behavior
- Added via `AddManualRowDialog` — summary, hours, internal note
- Edit summary via `EditWorklogSummaryDialog` (Jira link checkbox hidden for manual)
- Reset button: hidden for manual rows
- Delete: always shown for manual rows in draft status

## Summary Editing (EditWorklogSummaryDialog)
Sets `custom_summary` on the single worklog row.
`removeJiraReference=true` → `displayIssueKey` becomes null, key kept in DB for audit.
Calls `updateWorklogSummaryAction(worklogId, customSummary, removeJiraReference)`.

## Server Actions (src/lib/billings/actions.ts)
| Action                        | Permission      | Notes                                   |
|-------------------------------|-----------------|-----------------------------------------|
| createBillingAction           | billing:create  | creates + auto-pulls Jira worklogs      |
| pullWorklogsAction            | billing:create  | deletes non-manual rows, re-pulls Jira  |
| saveWorklogsAction            | worklog:edit    | bulk update modifiedSeconds/Comment     |
| resetAllWorklogsAction        | worklog:edit    | nulls all modified fields               |
| addManualRowAction            | worklog:edit    | inserts is_manual=true row              |
| updateWorklogSummaryAction    | worklog:edit    | per-worklog custom_summary update       |
| deleteWorklogRowAction        | worklog:edit    | single row delete, draft only           |
| updateBillingStatusAction     | billing:finalize| enforces ALLOWED_TRANSITIONS            |
| deleteBillingAction           | billing:create  | removes billing + all worklogs, draft only |
| addManualTaskAction           | worklog:edit    | legacy (for BillingTaskEditorTable)     |
| updateTaskSummaryAction       | worklog:edit    | legacy per-issueKey update              |
| deleteManualTaskAction        | worklog:edit    | legacy (for BillingTaskEditorTable)     |

## Key Query Functions (src/lib/billings/queries.ts)
`getBillingsByProject`, `getBillingById`, `getBillingWithStats`
`getWorklogsByBilling` → returns `WorklogWithEffective[]` with computed display fields
`insertWorklogs(billingId, entries)` → deletes non-manual rows first, then inserts
`updateWorklog`, `bulkUpdateWorklogs`, `resetAllWorklogs`
`updateWorklogSummary(worklogId, customSummary, removeJiraReference)`
`deleteWorklogRow(worklogId)`
`insertManualTask`, `updateTaskSummary`, `deleteManualTask` (legacy task-level)
`getBillingTaskSummaries` → used by BillingTaskEditorTable
`checkBillingOverlap` → warns but does not block on overlap

## worklog-store.ts (CC-safe)
Pure functions for client-side editor state — no server imports.
`createInitialEditorState(worklogs)` → `EditorState`
`applyWorklogEdit`, `resetWorklogEdit`, `resetAllEdits`, `getDirtyUpdates`
`isDirty = modifiedSeconds !== null || modifiedComment !== null`

## Export (pending Batch 9)
RH: GET /api/billings/[id]/export
Server-side xlsx via ExcelJS. Logged in export_logs.
Available from reviewed or finalized status.
