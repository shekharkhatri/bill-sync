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
| export_logs          | uuid | billing_id → billings                      | audit trail for csv exports  |
| allowed_emails       | uuid | —                                          | login allowlist              |
| billing_share_tokens | uuid | billing_id → billings                      | token unique idx, is_active flag |
| company_settings     | text | —                                          | key-value store, seeded defaults |
| invoices             | uuid | billing_id → billings (UNIQUE)             | one per billing, company snapshot|
| invoice_line_items   | uuid | invoice_id → invoices                      | CASCADE delete, sort_order       |

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
| sort_order             | int?    | task display order within billing, null = unset |

## Effective Value Pattern (computed in query mapping, never stored)
```
effectiveSeconds = modified_seconds ?? original_seconds
effectiveComment = modified_comment          ← NO fallback to original_comment
displaySummary   = custom_summary ?? issue_summary ?? jira_issue_key
displayIssueKey  = jira_reference_removed ? null : jira_issue_key
```

## company_settings Key Columns
`key` (TEXT PRIMARY KEY), `value` (TEXT nullable), `updated_by` → users, `updated_at`
Seeded with: `company_name`, `company_address`, `company_phone`, `company_email`, `bank_name`, `bank_account`, `bank_swift`, `vat_rate`, `vat_label`

## invoices Key Columns
`billing_id` (UNIQUE → billings ON DELETE CASCADE), `invoice_number`, `invoice_date`, `due_date`, `currency` (NPR/USD/AUD), client snapshot fields, company snapshot fields, bank fields, `vat_enabled`, `vat_rate` NUMERIC(5,2), `vat_label`, `discount_enabled`, `discount_amount` NUMERIC(12,2), `discount_label`, `notes`
One per billing — UNIQUE constraint enforced.

## invoice_line_items Key Columns
`invoice_id` → invoices ON DELETE CASCADE, `description`, `quantity` NUMERIC(10,2), `unit_price` NUMERIC(12,2), `sort_order`

## billing_share_tokens Key Columns
`token` (URL-safe base64, 43 chars, 256-bit entropy), `is_active` (revoke by setting false),
`expires_at` (null = no expiry), `billing_id` → billings ON DELETE CASCADE,
`csv_enabled` (bool, default true) — gates CSV export on public Invoice Preview page
`password_enabled` (bool, default false) — requires password to view link
`password_hash` (TEXT nullable) — bcrypt hash of the password; NEVER sent to client

Migration (run in Supabase SQL editor):
```sql
ALTER TABLE billing_share_tokens
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_enabled BOOLEAN NOT NULL DEFAULT false;
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
Last migration added: `password_hash`, `password_enabled` on billing_share_tokens.
