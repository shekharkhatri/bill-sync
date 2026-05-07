# Jira Integration

## Rules
- All Jira calls: SERVER ONLY — lib/jira/* files must never be imported in CC
- Auth: `Basic base64(email:apiToken)` injected per request in buildAuthHeader()
- API base: `https://{instanceUrl}/rest/api/3`
- Timeouts: AbortController — 10s for test/validate, 15s per paginated fetch page
- Errors: mapped via mapJiraError() → human strings. Raw Jira errors never sent to client

## Key Files
| File                       | Purpose                                         |
|----------------------------|-------------------------------------------------|
| lib/jira/client.ts         | testJiraConnection, fetchWorklogsForProject     |
| lib/jira/queries.ts        | getJiraConfig, getDecryptedJiraConfig, upsert   |
| lib/jira/actions.ts        | testJiraConnectionAction, saveJiraConfigAction  |
| lib/jira/live-hours.ts     | getLiveProjectHours, getProjectOverviewData     |
| lib/jira/types.ts          | JiraWorklog, JiraIssue, JiraConnectionConfig    |
| lib/jira/overview-types.ts | ProjectOverviewData, OverviewTaskSummary        |
| lib/jira/format-utils.ts   | formatHours, formatDateShort, formatDateFull (browser-safe) |
| lib/jira/error-messages.ts | mapJiraError()                                  |
| lib/jira/dashboard-types.ts| JiraProjectSummary, JiraMemberSummary (legacy)  |
| lib/jira/config-types.ts   | ProjectJiraConfig, SaveJiraConfigInput          |
| lib/crypto/encryption.ts   | encrypt(), decrypt(), maskToken() — SERVER ONLY |

## Endpoints Used
| Purpose                | Method | Path                                        |
|------------------------|--------|---------------------------------------------|
| Test connection        | GET    | /rest/api/3/project/{key}                   |
| Search issues+worklogs | POST   | /rest/api/3/search/jql (cursor pagination)  |
| Per-issue worklogs     | GET    | /rest/api/3/issue/{key}/worklog             |
| Validate JQL scope     | POST   | /rest/api/3/search/jql (maxResults=1)       |

⚠ GET /rest/api/3/search returns 410 Gone on Jira Cloud — always use POST /search/jql.

## Issue Search Pagination
POST /search/jql uses cursor-based pagination:
- First page: body = `{ jql, fields, maxResults: 50 }`
- Subsequent: body += `{ nextPageToken: "..." }`
- Stop when: response has no `nextPageToken`
- Safety cap: 10 pages max. fields always: `['summary', 'worklog']`

## Per-Issue Worklog Pagination
GET /issue/{key}/worklog uses offset-based:
- `startAt`, `maxResults: 50`
- Stop when: `fetched >= data.total`
- Safety cap: 20 pages max per issue

## JQL Builder (buildJql in client.ts)
```
project = "{key}" AND worklogDate >= "{start}" AND worklogDate <= "{end}"
[AND ({jqlScope})]   ← appended only when jqlScope non-empty
```
fields always: `summary,worklog` — never assignee.

## Date Filtering Rule
Filter on `worklog.started` (when work was performed by the author).
`worklog.started.substring(0, 10)` → `"YYYY-MM-DD"` for range comparison.
NOT on issue created/updated date. This is the authoritative billing date.

## Worklog Author Rule
Only `worklog.author` (who logged time) is tracked — stored as `author_name`, `author_jira_id`.
Issue assignee is never fetched, stored, or displayed anywhere in BillSync.

## Credential Storage
API token encrypted with AES-256-GCM before DB insert.
Format: `iv:authTag:ciphertext` (colon-delimited hex string).
Decrypted only in `getDecryptedJiraConfig()` immediately before API call.
Token never returned to any client response.

## JQL Scope (per project config)
Stored in `project_jira_configs.jql_scope` (nullable).
Validated on test connection → returns `jqlScopeMatchCount`.
Empty string stored as NULL.
Example scope: `labels = "billable"` or `issuetype in (Story, Bug)`.

## format-utils.ts (browser-safe)
`formatHours`, `formatDateShort`, `formatDateFull` live here — zero server imports.
All CC that need formatting import from here, never from live-hours.ts.
