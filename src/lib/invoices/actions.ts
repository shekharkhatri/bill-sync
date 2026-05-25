'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { guardAction } from '@/lib/auth/permissions'
import { getBillingById } from '@/lib/billings/queries'
import {
  createInvoice,
  updateInvoice,
  upsertLineItems,
  deleteInvoice,
  getInvoiceByBilling,
} from '@/lib/invoices/queries'
import type {
  InvoiceWithLineItems,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreateLineItemInput,
  InvoiceCurrency,
} from '@/lib/invoices/types'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

const VALID_CURRENCIES = new Set<string>(['NPR', 'USD', 'AUD'])

function validateCurrency(c: string): c is InvoiceCurrency {
  return VALID_CURRENCIES.has(c)
}

/** Creates a new invoice for a billing. Requires billing:finalize permission. */
export async function createInvoiceAction(
  input: CreateInvoiceInput,
): Promise<ActionResult<InvoiceWithLineItems>> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'billing:finalize')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(input.billingId)
    if (!billing) return { success: false, error: 'Billing not found.' }

    if (!validateCurrency(input.currency)) {
      return { success: false, error: 'Invalid currency.' }
    }

    const existing = await getInvoiceByBilling(input.billingId)
    if (existing) {
      return { success: false, error: 'An invoice already exists for this billing.' }
    }

    const invoice = await createInvoice(input, user.id)

    revalidatePath(`/projects/${billing.projectId}/billings/${billing.id}`)
    return { success: true, data: invoice }
  } catch (err) {
    console.error('[createInvoiceAction] Failed:', err)
    return { success: false, error: 'Failed to create invoice.' }
  }
}

/** Updates invoice fields and replaces line items atomically. Requires billing:finalize. */
export async function updateInvoiceAction(
  invoiceId: string,
  billingId: string,
  fields: UpdateInvoiceInput,
  lineItems: CreateLineItemInput[],
): Promise<ActionResult<InvoiceWithLineItems>> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'billing:finalize')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing not found.' }

    if (fields.currency && !validateCurrency(fields.currency)) {
      return { success: false, error: 'Invalid currency.' }
    }

    if (lineItems.length > 200) {
      return { success: false, error: 'Too many line items (max 200).' }
    }

    await updateInvoice(invoiceId, fields)
    const updatedItems = await upsertLineItems(invoiceId, lineItems)

    revalidatePath(`/projects/${billing.projectId}/billings/${billing.id}`)

    const updatedInvoice = await getInvoiceByBilling(billingId)
    if (!updatedInvoice) return { success: false, error: 'Invoice not found after update.' }

    return { success: true, data: { ...updatedInvoice, lineItems: updatedItems } }
  } catch (err) {
    console.error('[updateInvoiceAction] Failed:', err)
    return { success: false, error: 'Failed to update invoice.' }
  }
}

/** Deletes an invoice. Requires billing:finalize permission. */
export async function deleteInvoiceAction(
  invoiceId: string,
  billingId: string,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const permError = await guardAction(user.id, 'billing:finalize')
    if (permError) return { success: false, error: permError }

    const billing = await getBillingById(billingId)
    if (!billing) return { success: false, error: 'Billing not found.' }

    await deleteInvoice(invoiceId)

    revalidatePath(`/projects/${billing.projectId}/billings/${billing.id}`)
    return { success: true, data: undefined }
  } catch (err) {
    console.error('[deleteInvoiceAction] Failed:', err)
    return { success: false, error: 'Failed to delete invoice.' }
  }
}
