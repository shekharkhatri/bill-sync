export type InvoiceCurrency = 'NPR' | 'USD' | 'AUD'

export const CURRENCY_SYMBOLS: Record<InvoiceCurrency, string> = {
  NPR: 'Rs.',
  USD: '$',
  AUD: 'A$',
}

export const CURRENCY_LABELS: Record<InvoiceCurrency, string> = {
  NPR: 'NPR — Nepalese Rupee',
  USD: 'USD — US Dollar',
  AUD: 'AUD — Australian Dollar',
}

export interface InvoiceLineItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPrice: number
  sortOrder: number
  createdAt: Date
}

export interface Invoice {
  id: string
  billingId: string
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
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceWithLineItems extends Invoice {
  lineItems: InvoiceLineItem[]
}

/** Flat map of all company_settings rows: key → value */
export type CompanySettingsMap = Record<string, string>

export type CreateInvoiceInput = {
  billingId: string
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
}

export type UpdateInvoiceInput = Partial<Omit<CreateInvoiceInput, 'billingId'>>

export type CreateLineItemInput = {
  description: string
  quantity: number
  unitPrice: number
  sortOrder: number
}

export type UpdateLineItemInput = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  sortOrder: number
}
