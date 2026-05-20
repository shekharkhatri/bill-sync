'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { guardAction } from '@/lib/auth/permissions'
import { getBillingById } from '@/lib/billings/queries'
import { createShareToken, revokeShareToken, updateShareTokenCsv } from '@/lib/share/queries'
import { APP_URL } from '@/lib/env'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Generates a shareable link for a reviewed or finalized billing.
 * Requires billing:finalize permission. Draft billings are blocked.
 * Generating a new link automatically revokes the previous one.
 * csvEnabled controls whether the recipient can download a CSV from the public page.
 */
export async function generateShareLinkAction(
  billingId: string,
  csvEnabled: boolean,
): Promise<ActionResult<{ token: string; url: string; csvEnabled: boolean }>> {
  try {
    const user = await requireSession()

    const permError = await guardAction(user.id, 'billing:finalize')
    if (permError) {
      return { success: false, error: permError }
    }

    const billing = await getBillingById(billingId)
    if (!billing) {
      return { success: false, error: 'Billing not found.' }
    }

    if (billing.status === 'draft') {
      return {
        success: false,
        error: 'Share links are only available for reviewed or finalized billings.',
      }
    }

    const token = await createShareToken(billingId, user.id, csvEnabled)
    const url = `${APP_URL}/share/${token.token}`

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)

    return { success: true, data: { token: token.token, url, csvEnabled: token.csvEnabled } }
  } catch (err) {
    console.error('[generateShareLinkAction] Failed:', err)
    return { success: false, error: 'Failed to generate share link.' }
  }
}

/**
 * Revokes all active share tokens for a billing.
 * Requires billing:finalize permission.
 */
export async function revokeShareLinkAction(billingId: string): Promise<ActionResult> {
  try {
    const user = await requireSession()

    const permError = await guardAction(user.id, 'billing:finalize')
    if (permError) {
      return { success: false, error: permError }
    }

    const billing = await getBillingById(billingId)
    if (!billing) {
      return { success: false, error: 'Billing not found.' }
    }

    await revokeShareToken(billingId)

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)

    return { success: true, data: undefined }
  } catch (err) {
    console.error('[revokeShareLinkAction] Failed:', err)
    return { success: false, error: 'Failed to revoke share link.' }
  }
}

/**
 * Toggles the csv_enabled flag on the active share token for a billing.
 * Requires billing:finalize permission.
 */
export async function updateShareTokenCsvAction(
  billingId: string,
  csvEnabled: boolean,
): Promise<ActionResult> {
  try {
    const user = await requireSession()

    const permError = await guardAction(user.id, 'billing:finalize')
    if (permError) {
      return { success: false, error: permError }
    }

    const billing = await getBillingById(billingId)
    if (!billing) {
      return { success: false, error: 'Billing not found.' }
    }

    await updateShareTokenCsv(billingId, csvEnabled)

    revalidatePath(`/projects/${billing.projectId}/billings/${billingId}`)

    return { success: true, data: undefined }
  } catch (err) {
    console.error('[updateShareTokenCsvAction] Failed:', err)
    return { success: false, error: 'Failed to update CSV setting.' }
  }
}
