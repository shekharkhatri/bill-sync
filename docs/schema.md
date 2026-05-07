# DB Schema

Full DDL: src/lib/db/schema.sql
Kysely types: src/lib/db/types.ts (manually maintained — run codegen if schema drifts)

## Tables
| Table                | PK   | Key Relations                              | Notes                        |
|----------------------|------|--------------------------------------------|------------------------------|
| roles                | uuid | —                                          | seed: admin                  |
| permissions          | uuid | —                                          | key col = PermissionKey type |
| role_permissions     | comp | role_id → roles, permission_id → perms     | join table                   |
| users                | uuid | mirrors auth.users (Supabase)              | bootstrapped on first login  |
| user_roles           | comp | user_id → users, role_id → roles           | join table                   |
| projects             | uuid | created_by → users (nullable)              | soft delete via deleted_at   |
| project_jira_configs | uuid | project_id → projects                      | encrypted_api_token AES-256  |
| billings             | uuid | project_id → projects                      | status: draft→reviewed→final |
| worklogs             | uuid | billing_id → billings                      | snapshot, not live Jira data |
| export_logs          | uuid | billing_id → billings                      | audit trail for xlsx exports |
| allowed_emails       | uuid | —                                          | login allowlist              |

## Worklog Columns (key ones)
| Column                 | Type    | Notes                                         |
|------------------------|---------|-----------------------------------------------|
| original_seconds       | int     | raw from Jira pull, never modified            |
| modified_seconds       | int?    | null = unmodified, use original               |
| original_comment       | text?   | from Jira pull — never shown in billing UI    |
| modified_comment       | text?   | internal note only — user-entered             |
| is_manual              | bool    | DEFAULT false — true for user-added rows      |
| custom_summary         | text?   | overrides issue_summary in UI when set        |
| jira_reference_removed | bool    | DEFAULT false — hides jira_issue_key in UI    |

## Effective Value Pattern (computed in query mapping, never stored)
```
effectiveSeconds = modified_seconds ?? original_seconds
effectiveComment = modified_comment          ← NO fallback to original_comment
displaySummary   = custom_summary ?? issue_summary ?? jira_issue_key
displayIssueKey  = jira_reference_removed ? null : jira_issue_key
```

## project_jira_configs Key Columns
`instance_url`, `jira_project_key`, `user_email`, `encrypted_api_token`,
`jql_scope` (nullable), `is_verified`, `last_verified_at`

## Billing Status
`draft` → `reviewed` → `finalized`
`reviewed` → `draft` (revert, requires billing:finalize permission)
`finalized`: locked, no revert

## Migrations
Run in Supabase SQL editor or: `psql -d $DATABASE_URL -f src/lib/db/schema.sql`
All `ADD COLUMN IF NOT EXISTS` — safe to re-run.
Last migration added: `is_manual`, `custom_summary`, `jira_reference_removed` on worklogs.
