// SERVER ONLY — never import from Client Components

import { db } from '@/lib/db/client'
import type { CompanySettingsMap } from '@/lib/invoices/types'

/** Returns all company settings as a flat key→value map. */
export async function getCompanySettings(): Promise<CompanySettingsMap> {
  const rows = await db
    .selectFrom('company_settings')
    .selectAll()
    .execute()

  const map: CompanySettingsMap = {}
  for (const row of rows) {
    map[row.key] = row.value ?? ''
  }
  return map
}

/** Upserts a single company setting key/value. */
export async function updateCompanySetting(
  key: string,
  value: string,
  updatedBy: string,
): Promise<void> {
  await db
    .insertInto('company_settings')
    .values({ key, value, updated_by: updatedBy })
    .onConflict((oc) =>
      oc.column('key').doUpdateSet({ value, updated_by: updatedBy }),
    )
    .execute()
}
