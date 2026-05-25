'use client'

import { useState, useTransition } from 'react'
import { FileText, Pencil, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import InvoiceMetaFields from '@/components/invoices/InvoiceMetaFields'
import AddressBlock from '@/components/invoices/AddressBlock'
import InvoiceTaxControls from '@/components/invoices/InvoiceTaxControls'
import LineItemsEditor, { type LineItemDraft } from '@/components/invoices/LineItemsEditor'
import {
  createInvoiceAction,
  updateInvoiceAction,
  deleteInvoiceAction,
} from '@/lib/invoices/actions'
import type {
  InvoiceWithLineItems,
  CompanySettingsMap,
  InvoiceCurrency,
} from '@/lib/invoices/types'

function toDateString(d: Date | null | undefined): string {
  if (!d) return ''
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toISOString().split('T')[0]
}

interface InvoiceDraft {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
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

function buildDraft(
  invoice: InvoiceWithLineItems | null,
  settings: CompanySettingsMap,
  clientName: string,
): InvoiceDraft {
  if (invoice) {
    return {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: toDateString(invoice.invoiceDate),
      dueDate: toDateString(invoice.dueDate),
      currency: invoice.currency,
      clientName: invoice.clientName,
      clientAddress: invoice.clientAddress,
      clientEmail: invoice.clientEmail,
      companyName: invoice.companyName,
      companyAddress: invoice.companyAddress,
      companyPhone: invoice.companyPhone,
      companyEmail: invoice.companyEmail,
      bankName: invoice.bankName,
      bankAccount: invoice.bankAccount,
      bankSwift: invoice.bankSwift,
      vatEnabled: invoice.vatEnabled,
      vatRate: invoice.vatRate,
      vatLabel: invoice.vatLabel,
      discountEnabled: invoice.discountEnabled,
      discountAmount: invoice.discountAmount,
      discountLabel: invoice.discountLabel,
      notes: invoice.notes,
    }
  }

  return {
    invoiceNumber: '',
    invoiceDate: toDateString(new Date()),
    dueDate: '',
    currency: 'NPR',
    clientName,
    clientAddress: '',
    clientEmail: '',
    companyName: settings.company_name ?? '',
    companyAddress: settings.company_address ?? '',
    companyPhone: settings.company_phone ?? '',
    companyEmail: settings.company_email ?? '',
    bankName: settings.bank_name ?? '',
    bankAccount: settings.bank_account ?? '',
    bankSwift: settings.bank_swift ?? '',
    vatEnabled: true,
    vatRate: parseFloat(settings.vat_rate ?? '13') || 13,
    vatLabel: settings.vat_label ?? 'VAT',
    discountEnabled: false,
    discountAmount: 0,
    discountLabel: 'Discount',
    notes: '',
  }
}

function buildLineItemDrafts(invoice: InvoiceWithLineItems | null): LineItemDraft[] {
  if (!invoice) return []
  return invoice.lineItems.map((li) => ({
    id: li.id,
    description: li.description,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
  }))
}

interface InvoiceEditorFormProps {
  billingId: string
  clientName: string
  invoice: InvoiceWithLineItems | null
  settings: CompanySettingsMap
}

export default function InvoiceEditorForm({
  billingId,
  clientName,
  invoice: initialInvoice,
  settings,
}: InvoiceEditorFormProps): React.ReactElement {
  const [invoice, setInvoice] = useState<InvoiceWithLineItems | null>(initialInvoice)
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(initialInvoice ? 'view' : 'create')
  const [draft, setDraft] = useState<InvoiceDraft>(() => buildDraft(initialInvoice, settings, clientName))
  const [lineItems, setLineItems] = useState<LineItemDraft[]>(() => buildLineItemDrafts(initialInvoice))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isEditing = mode !== 'view'
  const isDisabled = isPending

  function updateDraft(field: string, value: boolean | number | string): void {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function handleMetaChange(field: string, value: string): void {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function handleAddressChange(key: string, value: string): void {
    // key is the raw setting key e.g. 'clientName' or companyName etc
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handleCancel(): void {
    if (invoice) {
      setDraft(buildDraft(invoice, settings, clientName))
      setLineItems(buildLineItemDrafts(invoice))
      setMode('view')
    }
    setError(null)
  }

  function handleSave(): void {
    setError(null)
    startTransition(async () => {
      const fields = {
        invoiceNumber: draft.invoiceNumber,
        invoiceDate: draft.invoiceDate ? new Date(draft.invoiceDate) : null,
        dueDate: draft.dueDate ? new Date(draft.dueDate) : null,
        currency: draft.currency,
        clientName: draft.clientName,
        clientAddress: draft.clientAddress,
        clientEmail: draft.clientEmail,
        companyName: draft.companyName,
        companyAddress: draft.companyAddress,
        companyPhone: draft.companyPhone,
        companyEmail: draft.companyEmail,
        bankName: draft.bankName,
        bankAccount: draft.bankAccount,
        bankSwift: draft.bankSwift,
        vatEnabled: draft.vatEnabled,
        vatRate: draft.vatRate,
        vatLabel: draft.vatLabel,
        discountEnabled: draft.discountEnabled,
        discountAmount: draft.discountAmount,
        discountLabel: draft.discountLabel,
        notes: draft.notes,
      }

      const items = lineItems.map((li, i) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        sortOrder: i,
      }))

      if (invoice) {
        const result = await updateInvoiceAction(invoice.id, billingId, fields, items)
        if (!result.success) {
          setError(result.error)
          return
        }
        setInvoice(result.data)
        setDraft(buildDraft(result.data, settings, clientName))
        setLineItems(buildLineItemDrafts(result.data))
      } else {
        const result = await createInvoiceAction({ billingId, ...fields })
        if (!result.success) {
          setError(result.error)
          return
        }
        setInvoice(result.data)
        setDraft(buildDraft(result.data, settings, clientName))
        setLineItems(buildLineItemDrafts(result.data))
      }
      setMode('view')
    })
  }

  function handleDelete(): void {
    if (!invoice) return
    setError(null)
    startTransition(async () => {
      const result = await deleteInvoiceAction(invoice.id, billingId)
      if (!result.success) {
        setError(result.error)
        return
      }
      setInvoice(null)
      setDraft(buildDraft(null, settings, clientName))
      setLineItems([])
      setMode('create')
    })
  }

  // ── No invoice yet — "Create Invoice" prompt ──
  if (!invoice && mode !== 'create') {
    return (
      <div className="border border-dashed border-border rounded-md p-6 text-center">
        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          No proforma invoice yet. Create one to send alongside this billing.
        </p>
        <Button size="sm" onClick={() => setMode('create')}>
          Create Invoice
        </Button>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Invoice
            {invoice?.invoiceNumber ? ` — ${invoice.invoiceNumber}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'view' && invoice && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode('edit')}
                className="gap-1.5 h-7"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the invoice and all its line items. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {isEditing && (
            <>
              {invoice && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isDisabled}
                  className="gap-1.5 h-7"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={isDisabled} className="h-7">
                {isPending ? 'Saving…' : invoice ? 'Save Changes' : 'Create Invoice'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-[13px] border-b border-border">
          {error}
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Meta row */}
        <InvoiceMetaFields
          invoiceNumber={draft.invoiceNumber}
          invoiceDate={draft.invoiceDate}
          dueDate={draft.dueDate}
          currency={draft.currency}
          disabled={!isEditing || isDisabled}
          onChange={handleMetaChange}
        />

        <Separator />

        {/* Two-column address blocks */}
        <div className="grid grid-cols-2 gap-6">
          <AddressBlock
            title="From (Your Company)"
            nameKey="companyName"
            addressKey="companyAddress"
            emailKey="companyEmail"
            nameValue={draft.companyName}
            addressValue={draft.companyAddress}
            emailValue={draft.companyEmail}
            disabled={!isEditing || isDisabled}
            onChange={handleAddressChange}
          />
          <AddressBlock
            title="To (Client)"
            nameKey="clientName"
            addressKey="clientAddress"
            emailKey="clientEmail"
            nameValue={draft.clientName}
            addressValue={draft.clientAddress}
            emailValue={draft.clientEmail}
            disabled={!isEditing || isDisabled}
            onChange={handleAddressChange}
          />
        </div>

        <Separator />

        {/* Line items */}
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
            Line Items
          </p>
          <LineItemsEditor
            items={lineItems}
            currency={draft.currency}
            vatEnabled={draft.vatEnabled}
            vatRate={draft.vatRate}
            vatLabel={draft.vatLabel}
            discountEnabled={draft.discountEnabled}
            discountAmount={draft.discountAmount}
            discountLabel={draft.discountLabel}
            disabled={!isEditing || isDisabled}
            onChange={setLineItems}
          />
        </div>

        {isEditing && (
          <>
            <Separator />

            {/* Tax + discount controls */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                Tax & Discount
              </p>
              <InvoiceTaxControls
                vatEnabled={draft.vatEnabled}
                vatRate={draft.vatRate}
                vatLabel={draft.vatLabel}
                discountEnabled={draft.discountEnabled}
                discountAmount={draft.discountAmount}
                discountLabel={draft.discountLabel}
                disabled={isDisabled}
                onChange={updateDraft}
              />
            </div>

            <Separator />

            {/* Bank details + phone (editable in form) */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                Company Details (for this invoice)
              </p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  ['companyPhone', 'Phone'],
                  ['bankName', 'Bank Name'],
                  ['bankAccount', 'Account Number'],
                  ['bankSwift', 'SWIFT / BIC'],
                ] as [keyof InvoiceDraft, string][]).map(([field, label]) => (
                  <div key={field} className="space-y-1.5">
                    <Label htmlFor={field} className="text-[11px] text-muted-foreground">
                      {label}
                    </Label>
                    <Input
                      id={field}
                      value={String(draft[field])}
                      onChange={(e) => updateDraft(field, e.target.value)}
                      disabled={isDisabled}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="invoice_notes" className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Notes
              </Label>
              <Input
                id="invoice_notes"
                value={draft.notes}
                onChange={(e) => updateDraft('notes', e.target.value)}
                placeholder="Payment terms, thank-you note, etc."
                disabled={isDisabled}
                className="h-8 text-sm"
              />
            </div>
          </>
        )}

        {/* View mode: bank details + notes */}
        {mode === 'view' && invoice && (
          <>
            {(invoice.bankName || invoice.bankAccount || invoice.notes) && (
              <Separator />
            )}
            {(invoice.bankName || invoice.bankAccount) && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {invoice.bankName && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                      Bank
                    </p>
                    <p>{invoice.bankName}</p>
                    {invoice.bankAccount && <p className="text-muted-foreground">{invoice.bankAccount}</p>}
                    {invoice.bankSwift && <p className="text-muted-foreground">SWIFT: {invoice.bankSwift}</p>}
                  </div>
                )}
                {invoice.companyPhone && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                      Phone
                    </p>
                    <p>{invoice.companyPhone}</p>
                  </div>
                )}
              </div>
            )}
            {invoice.notes && (
              <p className="text-[13px] text-muted-foreground italic">{invoice.notes}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
