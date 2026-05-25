'use server'

import { requireSession } from '@/lib/auth/session'
import { guardAction } from '@/lib/auth/permissions'
import { updateCompanySetting } from '@/lib/invoices/settings-queries'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

const ALLOWED_KEYS = new Set([
  'company_name',
  'company_address',
  'company_phone',
  'company_email',
  'bank_name',
  'bank_account',
  'bank_swift',
  'vat_rate',
  'vat_label',
])

/** Updates multiple company settings at once. Requires project:edit permission. */
export async function updateCompanySettingsAction(
  settings: Record<string, string>,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'project:edit')
    if (permError) return { success: false, error: permError }

    const entries = Object.entries(settings)
    if (entries.length === 0) return { success: true, data: undefined }

    // Only update known, safe keys
    for (const [key, value] of entries) {
      if (!ALLOWED_KEYS.has(key)) {
        return { success: false, error: `Unknown setting key: ${key}` }
      }
      if (typeof value !== 'string') {
        return { success: false, error: `Invalid value for key: ${key}` }
      }
    }

    for (const [key, value] of entries) {
      await updateCompanySetting(key, value, user.id)
    }

    return { success: true, data: undefined }
  } catch (err) {
    console.error('[updateCompanySettingsAction] Failed:', err)
    return { success: false, error: 'Failed to update company settings.' }
  }
}
