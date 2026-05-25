'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CURRENCY_LABELS, type InvoiceCurrency } from '@/lib/invoices/types'

interface InvoiceMetaFieldsProps {
  invoiceNumber: string
  invoiceDate: string   // ISO date string YYYY-MM-DD or ''
  dueDate: string       // ISO date string YYYY-MM-DD or ''
  currency: InvoiceCurrency
  disabled?: boolean
  onChange: (field: string, value: string) => void
}

export default function InvoiceMetaFields({
  invoiceNumber,
  invoiceDate,
  dueDate,
  currency,
  disabled = false,
  onChange,
}: InvoiceMetaFieldsProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Invoice number */}
      <div className="space-y-1.5">
        <Label htmlFor="invoice_number" className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Invoice #
        </Label>
        <Input
          id="invoice_number"
          value={invoiceNumber}
          onChange={(e) => onChange('invoiceNumber', e.target.value)}
          placeholder="INV-001"
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>

      {/* Currency */}
      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Currency
        </Label>
        <Select
          value={currency}
          onValueChange={(v) => { if (v) onChange('currency', v) }}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(CURRENCY_LABELS) as [InvoiceCurrency, string][]).map(([code, label]) => (
              <SelectItem key={code} value={code} className="text-sm">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Invoice date */}
      <div className="space-y-1.5">
        <Label htmlFor="invoice_date" className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Invoice Date
        </Label>
        <Input
          id="invoice_date"
          type="date"
          value={invoiceDate}
          onChange={(e) => onChange('invoiceDate', e.target.value)}
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>

      {/* Due date */}
      <div className="space-y-1.5">
        <Label htmlFor="due_date" className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Due Date
        </Label>
        <Input
          id="due_date"
          type="date"
          value={dueDate}
          onChange={(e) => onChange('dueDate', e.target.value)}
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}
