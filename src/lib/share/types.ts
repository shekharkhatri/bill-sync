import type { BillingStatus } from '@/lib/billings/types'
import type { InvoiceCurrency } from '@/lib/invoices/types'

export interface SharedInvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface SharedInvoiceView {
  invoiceNumber: string
  invoiceDate: Date | null
  dueDate: Date | null
  currency: InvoiceCurrency
  clientName: string
  clientAddress: string
  clientEmail: string
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  bankName: string
  bankAccount: string
  bankSwift: string
  vatEnabled: boolean
  vatRate: number
  vatLabel: string
  discountEnabled: boolean
  discountAmount: number
  discountLabel: string
  notes: string
  lineItems: SharedInvoiceLineItem[]
  subtotal: number
  discountValue: number
  vatValue: number
  total: number
}

export interface BillingShareToken {
  id: string
  billingId: string
  token: string
  createdBy: string | null
  createdAt: Date
  expiresAt: Date | null
  isActive: boolean
  csvEnabled: boolean
}

export interface SharedBillingView {
  billing: {
    id: string
    label: string
    startDate: Date
    endDate: Date
    status: BillingStatus
    totalOriginalHours: number
    totalModifiedHours: number
  }
  project: {
    name: string
    clientName: string
  }
  tasks: SharedTaskRow[]
  invoice: SharedInvoiceView | null
  generatedAt: Date
  tokenId: string
  csvEnabled: boolean
}

export interface SharedTaskRow {
  displaySummary: string
  displayIssueKey: string | null
  effectiveHours: number
  isManual: boolean
}
