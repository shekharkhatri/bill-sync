// SERVER ONLY — never import from Client Components

import { db } from '@/lib/db/client'
import { generateShareToken, isTokenExpired } from '@/lib/share/token'
import { getBillingWithStats } from '@/lib/billings/queries'
import { getBillingTaskSummaries } from '@/lib/billings/queries'
import { getProjectById } from '@/lib/projects/queries'
import { getInvoiceByBilling } from '@/lib/invoices/queries'
import type {
  BillingShareToken,
  SharedBillingView,
  SharedTaskRow,
  SharedInvoiceView,
  SharedInvoiceLineItem,
} from '@/lib/share/types'

function mapToken(row: {
  id: string
  billing_id: string
  token: string
  created_by: string | null
  created_at: Date
  expires_at: Date | null
  is_active: boolean
  csv_enabled: boolean
  password_hash: string | null
  password_enabled: boolean
}): BillingShareToken {
  return {
    id: row.id,
    billingId: row.billing_id,
    token: row.token,
    createdBy: row.created_by,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    csvEnabled: row.csv_enabled,
    passwordHash: row.password_hash,
    passwordEnabled: row.password_enabled,
  }
}

/** Returns the most recent active share token for a billing, or null if none. */
export async function getShareToken(billingId: string): Promise<BillingShareToken | null> {
  const row = await db
    .selectFrom('billing_share_tokens')
    .selectAll()
    .where('billing_id', '=', billingId)
    .where('is_active', '=', true)
    .orderBy('created_at', 'desc')
    .limit(1)
    .executeTakeFirst()

  return row ? mapToken(row) : null
}

/** Returns a token row by its token string value, or null if not found. */
export async function getShareTokenByValue(token: string): Promise<BillingShareToken | null> {
  const row = await db
    .selectFrom('billing_share_tokens')
    .selectAll()
    .where('token', '=', token)
    .executeTakeFirst()

  return row ? mapToken(row) : null
}

/**
 * Creates a new share token for a billing.
 * Deactivates any existing active tokens first — one active link per billing at a time.
 */
export async function createShareToken(
  billingId: string,
  userId: string,
  csvEnabled: boolean,
  passwordEnabled: boolean,
  passwordHash: string | null,
  expiresAt?: Date,
): Promise<BillingShareToken> {
  const tokenValue = generateShareToken()

  // Deactivate any existing active tokens for this billing
  await db
    .updateTable('billing_share_tokens')
    .set({ is_active: false })
    .where('billing_id', '=', billingId)
    .where('is_active', '=', true)
    .execute()

  // Insert the new active token
  const row = await db
    .insertInto('billing_share_tokens')
    .values({
      billing_id: billingId,
      token: tokenValue,
      created_by: userId,
      expires_at: expiresAt ?? null,
      is_active: true,
      csv_enabled: csvEnabled,
      password_enabled: passwordEnabled,
      password_hash: passwordHash,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return mapToken(row)
}

/**
 * Deactivates all active share tokens for a billing.
 * Existing links immediately stop working.
 */
export async function revokeShareToken(billingId: string): Promise<void> {
  try {
    await db
      .updateTable('billing_share_tokens')
      .set({ is_active: false })
      .where('billing_id', '=', billingId)
      .where('is_active', '=', true)
      .execute()
  } catch (err) {
    console.error('[revokeShareToken] Failed:', err)
    throw err
  }
}

/**
 * Updates the password_enabled flag and hash on the active share token for a billing.
 */
export async function updateShareTokenPassword(
  billingId: string,
  passwordEnabled: boolean,
  passwordHash: string | null,
): Promise<void> {
  await db
    .updateTable('billing_share_tokens')
    .set({ password_enabled: passwordEnabled, password_hash: passwordHash })
    .where('billing_id', '=', billingId)
    .where('is_active', '=', true)
    .execute()
}

/**
 * Updates the csv_enabled flag on the active share token for a billing.
 */
export async function updateShareTokenCsv(
  billingId: string,
  csvEnabled: boolean,
): Promise<void> {
  await db
    .updateTable('billing_share_tokens')
    .set({ csv_enabled: csvEnabled })
    .where('billing_id', '=', billingId)
    .where('is_active', '=', true)
    .execute()
}

/**
 * Validates a share token and returns the billing view data.
 * Returns null for invalid, revoked, expired tokens, or draft billings.
 * internalNote is intentionally excluded — internal data must not leak to external users.
 */
export async function getSharedBillingView(token: string): Promise<SharedBillingView | null> {
  try {
    const tokenRow = await getShareTokenByValue(token)
    if (!tokenRow) return null
    if (!tokenRow.isActive) return null
    if (isTokenExpired(tokenRow.expiresAt)) return null

    const billing = await getBillingWithStats(tokenRow.billingId)
    if (!billing || billing.status === 'draft') return null

    const project = await getProjectById(billing.projectId)
    if (!project) return null

    const [taskList, invoiceData] = await Promise.all([
      getBillingTaskSummaries(tokenRow.billingId),
      getInvoiceByBilling(tokenRow.billingId),
    ])

    const tasks: SharedTaskRow[] = taskList.map((task) => ({
      displaySummary: task.displaySummary,
      displayIssueKey: task.displayIssueKey,
      effectiveHours: task.effectiveSeconds / 3600,
      isManual: task.isManual,
    }))

    let sharedInvoice: SharedInvoiceView | null = null
    if (invoiceData) {
      const lineItems: SharedInvoiceLineItem[] = invoiceData.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        amount: li.quantity * li.unitPrice,
      }))
      const subtotal = lineItems.reduce((s, li) => s + li.amount, 0)
      const discountValue = invoiceData.discountEnabled ? invoiceData.discountAmount : 0
      const taxBase = subtotal - discountValue
      const vatValue = invoiceData.vatEnabled ? (taxBase * invoiceData.vatRate) / 100 : 0
      const total = taxBase + vatValue

      sharedInvoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate,
        currency: invoiceData.currency,
        clientName: invoiceData.clientName,
        clientAddress: invoiceData.clientAddress,
        clientEmail: invoiceData.clientEmail,
        companyName: invoiceData.companyName,
        companyAddress: invoiceData.companyAddress,
        companyPhone: invoiceData.companyPhone,
        companyEmail: invoiceData.companyEmail,
        bankName: invoiceData.bankName,
        bankAccount: invoiceData.bankAccount,
        bankSwift: invoiceData.bankSwift,
        vatEnabled: invoiceData.vatEnabled,
        vatRate: invoiceData.vatRate,
        vatLabel: invoiceData.vatLabel,
        discountEnabled: invoiceData.discountEnabled,
        discountAmount: invoiceData.discountAmount,
        discountLabel: invoiceData.discountLabel,
        notes: invoiceData.notes,
        lineItems,
        subtotal,
        discountValue,
        vatValue,
        total,
      }
    }

    return {
      billing: {
        id: billing.id,
        label: billing.label,
        startDate: billing.startDate,
        endDate: billing.endDate,
        status: billing.status,
        totalOriginalHours: billing.totalOriginalHours,
        totalModifiedHours: billing.totalModifiedHours,
      },
      project: {
        name: project.name,
        clientName: project.clientName,
      },
      tasks,
      invoice: sharedInvoice,
      generatedAt: new Date(),
      tokenId: tokenRow.id,
      csvEnabled: tokenRow.csvEnabled,
      passwordEnabled: tokenRow.passwordEnabled,
    }
  } catch (err) {
    console.error('[getSharedBillingView] Failed:', err)
    return null
  }
}
