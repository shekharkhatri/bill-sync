// Auto-generate this file in future using kysely-codegen once schema is stable. For now this is manually maintained.
import type { Generated } from 'kysely'

export interface RoleTable {
  id: Generated<string>
  name: string
  description: string | null
  created_at: Generated<Date>
}

export interface PermissionTable {
  id: Generated<string>
  name: string
  key: string
  created_at: Generated<Date>
}

export interface RolePermissionTable {
  role_id: string
  permission_id: string
}

export interface UserTable {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: Generated<Date>
}

export interface UserRoleTable {
  user_id: string
  role_id: string
}

export interface ProjectTable {
  id: Generated<string>
  name: string
  client_name: string
  description: string | null
  color: string | null
  status: Generated<string>
  created_by: string | null
  created_at: Generated<Date>
  deleted_at: Date | null
}

export interface ProjectJiraConfigTable {
  id: Generated<string>
  project_id: string
  instance_url: string
  jira_project_key: string
  user_email: string
  encrypted_api_token: string
  is_verified: Generated<boolean>
  last_verified_at: Date | null
  jql_scope: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface BillingTable {
  id: Generated<string>
  project_id: string
  label: string
  start_date: Date
  end_date: Date
  status: Generated<string>
  created_by: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface WorklogTable {
  id: Generated<string>
  billing_id: string
  jira_worklog_id: string
  jira_issue_key: string
  issue_summary: string | null
  author_name: string
  author_jira_id: string
  work_started: Date
  original_seconds: number
  modified_seconds: number | null
  original_comment: string | null
  modified_comment: string | null
  is_manual: Generated<boolean>
  custom_summary: string | null
  jira_reference_removed: Generated<boolean>
  sort_order: number | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface ExportLogTable {
  id: Generated<string>
  billing_id: string
  exported_by: string | null
  exported_at: Generated<Date>
  format: Generated<string>
}

export interface AllowedEmailTable {
  id: Generated<string>
  email: string
  note: string | null
  created_at: Generated<Date>
}

export interface BillingShareTokenTable {
  id: Generated<string>
  billing_id: string
  token: string
  created_by: string | null
  created_at: Generated<Date>
  expires_at: Date | null
  is_active: Generated<boolean>
  csv_enabled: Generated<boolean>
  password_hash: string | null
  password_enabled: Generated<boolean>
}

export interface CompanySettingsTable {
  key: string
  value: string | null
  updated_by: string | null
  updated_at: Generated<Date>
}

export interface InvoicesTable {
  id: Generated<string>
  billing_id: string
  invoice_number: Generated<string>
  invoice_date: Date | null
  due_date: Date | null
  currency: Generated<string>
  client_name: Generated<string>
  client_address: Generated<string>
  client_email: Generated<string>
  company_name: Generated<string>
  company_address: Generated<string>
  company_phone: Generated<string>
  company_email: Generated<string>
  bank_name: Generated<string>
  bank_account: Generated<string>
  bank_swift: Generated<string>
  vat_enabled: Generated<boolean>
  vat_rate: Generated<number>
  vat_label: Generated<string>
  discount_enabled: Generated<boolean>
  discount_amount: Generated<number>
  discount_label: Generated<string>
  notes: Generated<string>
  created_by: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface InvoiceLineItemsTable {
  id: Generated<string>
  invoice_id: string
  description: Generated<string>
  quantity: Generated<number>
  unit_price: Generated<number>
  sort_order: Generated<number>
  created_at: Generated<Date>
}

export interface Database {
  roles: RoleTable
  permissions: PermissionTable
  role_permissions: RolePermissionTable
  users: UserTable
  user_roles: UserRoleTable
  projects: ProjectTable
  project_jira_configs: ProjectJiraConfigTable
  billings: BillingTable
  worklogs: WorklogTable
  export_logs: ExportLogTable
  allowed_emails: AllowedEmailTable
  billing_share_tokens: BillingShareTokenTable
  company_settings: CompanySettingsTable
  invoices: InvoicesTable
  invoice_line_items: InvoiceLineItemsTable
}
