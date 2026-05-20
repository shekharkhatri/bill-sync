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

## Active Billing Editor (BillingTaskEditorTable)
One row per unique Jira issue (hours aggregated across all worklogs for that issue).
Located: `src/components/billings/BillingTaskEditorTable.tsx`.
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

## BillingTaskEditorTable (active)
Aggregated task view at `src/components/billings/BillingTaskEditorTable.tsx`.
Wired to billing detail page. Groups worklogs by `jira_issue_key`, sums hours.
Data source: `getBillingTaskSummaries(billingId)` → `BillingTaskSummary[]`.

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
| addManualTaskAction           | worklog:edit    | inserts manual task (used by BillingTaskEditorTable) |
| updateTaskSummaryAction       | worklog:edit    | per-issueKey summary update             |
| deleteManualTaskAction        | worklog:edit    | removes manual task (used by BillingTaskEditorTable) |
| updateTaskHoursAction         | worklog:edit    | sets total billed hours for a task, distributes proportionally across worklogs |

## Key Query Functions (src/lib/billings/queries.ts)
`getBillingsByProject`, `getBillingById`, `getBillingWithStats`
`getWorklogsByBilling` → returns `WorklogWithEffective[]` with computed display fields
`insertWorklogs(billingId, entries)` → deletes non-manual rows first, then inserts
`updateWorklog`, `bulkUpdateWorklogs`, `resetAllWorklogs`
`updateWorklogSummary(worklogId, customSummary, removeJiraReference)`
`deleteWorklogRow(worklogId)`
`insertManualTask`, `updateTaskSummary`, `deleteManualTask` (legacy task-level)
`getBillingTaskSummaries` → used by BillingTaskEditorTable
`getTaskNotes(billingId)` → `Record<string, string | null>` keyed by jiraIssueKey, used for CSV export
`checkBillingOverlap` → warns but does not block on overlap

## worklog-store.ts (CC-safe)
Pure functions for client-side editor state — no server imports.
`createInitialEditorState(worklogs)` → `EditorState`
`applyWorklogEdit`, `resetWorklogEdit`, `resetAllEdits`, `getDirtyUpdates`
`isDirty = modifiedSeconds !== null || modifiedComment !== null`

## Export
Route Handler: `GET /api/billings/[id]/export`
Format: CSV (text/csv, UTF-8, CRLF line endings)
Builder: `src/lib/export/csv.ts` → `buildBillingCSV()`
Available: reviewed or finalized status
Contains: metadata block, summary, one row per task with internal note
Logging: `export_logs` (billing_id, exported_by, format='csv')
Filename: `{sanitized-client}-{sanitized-label}-billing.csv`
Trigger: `ExportButton` CC → `fetch()` → blob → programmatic `<a>` download

## Shareable Links
Table: `billing_share_tokens` (one active token per billing at a time)
Available: reviewed or finalized billings only (draft blocked in action)
Permission: `billing:finalize` required to generate, revoke, or toggle CSV
Token: 43-char URL-safe base64, ~256-bit entropy, generated server-side via `node:crypto`
URL format: `{APP_URL}/share/{token}`
Revoke: `revokeShareToken()` sets `is_active = false` — link stops working immediately
Public page: `src/app/share/[token]/page.tsx` — **Worklog Preview** — no auth, noindex robots meta
Public export: `GET /api/share/[token]/export` — CSV, logs `format='csv-shared'`, gated by `csv_enabled`
Manager UI: `ShareLinkManager` CC on billing detail page (permission-gated via PermissionGuard)
One active link per billing — generating a new link revokes the previous one

### CSV Export Toggle (`csv_enabled`)
`csv_enabled` (bool, default true) on `billing_share_tokens` controls whether the recipient can download CSV.
- Toggle in `ShareLinkManager` — pre-generation option + live toggle on active link
- `updateShareTokenCsvAction(billingId, csvEnabled)` — requires `billing:finalize`
- Export route returns 403 if `csv_enabled = false` — message: "CSV export is not enabled for this shared link."
- Export button on public page conditionally rendered: `{view.csvEnabled && <SharedExportButton />}`

### External View Data Policy
The public Worklog Preview intentionally hides internal data:
| Shown externally        | Hidden from external view           |
|-------------------------|-------------------------------------|
| Project name            | Billing status                      |
| Client name             | Original (pre-edit) hours           |
| Billing label           | Internal notes / modified_comment   |
| Billing date range      | Worklog author names                |
| Total billed hours      | Worklog count                       |
| Task list (summary + Jira key + hours) | Any Jira credentials |

External CSV columns: Task, Jira Issue, Hours (no original hours, no internal notes, no status)
