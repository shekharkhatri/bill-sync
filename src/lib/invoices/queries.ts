// SERVER ONLY — never import from Client Components

import { db } from '@/lib/db/client'
import type {
  Invoice,
  InvoiceLineItem,
  InvoiceWithLineItems,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreateLineItemInput,
} from '@/lib/invoices/types'
import type { InvoiceCurrency } from '@/lib/invoices/types'

function mapInvoice(row: {
  id: string
  billing_id: string
  invoice_number: string
  invoice_date: Date | null
  due_date: Date | null
  currency: string
  client_name: string
  client_address: string
  client_email: string
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  bank_name: string
  bank_account: string
  bank_swift: string
  vat_enabled: boolean
  vat_rate: number
  vat_label: string
  discount_enabled: boolean
  discount_amount: number
  discount_label: string
  notes: string
  created_by: string | null
  created_at: Date
  updated_at: Date
}): Invoice {
  return {
    id: row.id,
    billingId: row.billing_id,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    currency: row.currency as InvoiceCurrency,
    clientName: row.client_name,
    clientAddress: row.client_address,
    clientEmail: row.client_email,
    companyName: row.company_name,
    companyAddress: row.company_address,
    companyPhone: row.company_phone,
    companyEmail: row.company_email,
    bankName: row.bank_name,
    bankAccount: row.bank_account,
    bankSwift: row.bank_swift,
    vatEnabled: row.vat_enabled,
    vatRate: Number(row.vat_rate),
    vatLabel: row.vat_label,
    discountEnabled: row.discount_enabled,
    discountAmount: Number(row.discount_amount),
    discountLabel: row.discount_label,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapLineItem(row: {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  sort_order: number
  created_at: Date
}): InvoiceLineItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at,
  }
}

/** Returns the invoice (with line items) for a billing, or null if none. */
export async function getInvoiceByBilling(
  billingId: string,
): Promise<InvoiceWithLineItems | null> {
  const invoiceRow = await db
    .selectFrom('invoices')
    .selectAll()
    .where('billing_id', '=', billingId)
    .executeTakeFirst()

  if (!invoiceRow) return null

  const lineItemRows = await db
    .selectFrom('invoice_line_items')
    .selectAll()
    .where('invoice_id', '=', invoiceRow.id)
    .orderBy('sort_order', 'asc')
    .execute()

  return {
    ...mapInvoice(invoiceRow),
    lineItems: lineItemRows.map(mapLineItem),
  }
}

/** Returns an invoice by its ID, or null if not found. */
export async function getInvoiceById(
  invoiceId: string,
): Promise<InvoiceWithLineItems | null> {
  const invoiceRow = await db
    .selectFrom('invoices')
    .selectAll()
    .where('id', '=', invoiceId)
    .executeTakeFirst()

  if (!invoiceRow) return null

  const lineItemRows = await db
    .selectFrom('invoice_line_items')
    .selectAll()
    .where('invoice_id', '=', invoiceRow.id)
    .orderBy('sort_order', 'asc')
    .execute()

  return {
    ...mapInvoice(invoiceRow),
    lineItems: lineItemRows.map(mapLineItem),
  }
}

/** Creates a new invoice for a billing. Returns the created invoice with empty line items. */
export async function createInvoice(
  input: CreateInvoiceInput,
  createdBy: string,
): Promise<InvoiceWithLineItems> {
  const row = await db
    .insertInto('invoices')
    .values({
      billing_id: input.billingId,
      invoice_number: input.invoiceNumber,
      invoice_date: input.invoiceDate,
      due_date: input.dueDate,
      currency: input.currency,
      client_name: input.clientName,
      client_address: input.clientAddress,
      client_email: input.clientEmail,
      company_name: input.companyName,
      company_address: input.companyAddress,
      company_phone: input.companyPhone,
      company_email: input.companyEmail,
      bank_name: input.bankName,
      bank_account: input.bankAccount,
      bank_swift: input.bankSwift,
      vat_enabled: input.vatEnabled,
      vat_rate: input.vatRate,
      vat_label: input.vatLabel,
      discount_enabled: input.discountEnabled,
      discount_amount: input.discountAmount,
      discount_label: input.discountLabel,
      notes: input.notes,
      created_by: createdBy,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return { ...mapInvoice(row), lineItems: [] }
}

/** Updates an existing invoice's fields. */
export async function updateInvoice(
  invoiceId: string,
  input: UpdateInvoiceInput,
): Promise<void> {
  const updates: Record<string, unknown> = { updated_at: new Date() }

  if (input.invoiceNumber !== undefined) updates.invoice_number = input.invoiceNumber
  if (input.invoiceDate !== undefined) updates.invoice_date = input.invoiceDate
  if (input.dueDate !== undefined) updates.due_date = input.dueDate
  if (input.currency !== undefined) updates.currency = input.currency
  if (input.clientName !== undefined) updates.client_name = input.clientName
  if (input.clientAddress !== undefined) updates.client_address = input.clientAddress
  if (input.clientEmail !== undefined) updates.client_email = input.clientEmail
  if (input.companyName !== undefined) updates.company_name = input.companyName
  if (input.companyAddress !== undefined) updates.company_address = input.companyAddress
  if (input.companyPhone !== undefined) updates.company_phone = input.companyPhone
  if (input.companyEmail !== undefined) updates.company_email = input.companyEmail
  if (input.bankName !== undefined) updates.bank_name = input.bankName
  if (input.bankAccount !== undefined) updates.bank_account = input.bankAccount
  if (input.bankSwift !== undefined) updates.bank_swift = input.bankSwift
  if (input.vatEnabled !== undefined) updates.vat_enabled = input.vatEnabled
  if (input.vatRate !== undefined) updates.vat_rate = input.vatRate
  if (input.vatLabel !== undefined) updates.vat_label = input.vatLabel
  if (input.discountEnabled !== undefined) updates.discount_enabled = input.discountEnabled
  if (input.discountAmount !== undefined) updates.discount_amount = input.discountAmount
  if (input.discountLabel !== undefined) updates.discount_label = input.discountLabel
  if (input.notes !== undefined) updates.notes = input.notes

  await db
    .updateTable('invoices')
    .set(updates)
    .where('id', '=', invoiceId)
    .execute()
}

/**
 * Replaces all line items for an invoice.
 * Deletes existing items then inserts the new list in one transaction.
 */
export async function upsertLineItems(
  invoiceId: string,
  items: CreateLineItemInput[],
): Promise<InvoiceLineItem[]> {
  await db
    .deleteFrom('invoice_line_items')
    .where('invoice_id', '=', invoiceId)
    .execute()

  if (items.length === 0) return []

  const rows = await db
    .insertInto('invoice_line_items')
    .values(
      items.map((item, i) => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        sort_order: item.sortOrder ?? i,
      })),
    )
    .returningAll()
    .execute()

  return rows.map(mapLineItem)
}

/** Deletes an invoice and all its line items (CASCADE handles items). */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  await db
    .deleteFrom('invoices')
    .where('id', '=', invoiceId)
    .execute()
}
