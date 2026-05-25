'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CURRENCY_SYMBOLS, type InvoiceCurrency } from '@/lib/invoices/types'

export interface LineItemDraft {
  id: string          // client-side temp id (UUID or index-based)
  description: string
  quantity: number
  unitPrice: number
}

interface LineItemsEditorProps {
  items: LineItemDraft[]
  currency: InvoiceCurrency
  vatEnabled: boolean
  vatRate: number
  vatLabel: string
  discountEnabled: boolean
  discountAmount: number
  discountLabel: string
  disabled?: boolean
  onChange: (items: LineItemDraft[]) => void
}

function nextId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function LineItemsEditor({
  items,
  currency,
  vatEnabled,
  vatRate,
  vatLabel,
  discountEnabled,
  discountAmount,
  discountLabel,
  disabled = false,
  onChange,
}: LineItemsEditorProps): React.ReactElement {
  const symbol = CURRENCY_SYMBOLS[currency]

  function updateItem(id: string, field: keyof LineItemDraft, value: string | number): void {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  function addItem(): void {
    onChange([...items, { id: nextId(), description: '', quantity: 1, unitPrice: 0 }])
  }

  function removeItem(id: string): void {
    onChange(items.filter((item) => item.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const discountValue = discountEnabled ? discountAmount : 0
  const taxBase = subtotal - discountValue
  const vatValue = vatEnabled ? (taxBase * vatRate) / 100 : 0
  const total = taxBase + vatValue

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: 'auto' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '110px' }} />
            {!disabled && <col style={{ width: '40px' }} />}
          </colgroup>
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                Description
              </th>
              <th className="text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                Qty
              </th>
              <th className="text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                Unit Price
              </th>
              <th className="text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                Amount
              </th>
              {!disabled && <th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && (
              <tr>
                <td colSpan={disabled ? 4 : 5} className="px-3 py-4 text-center text-[13px] text-muted-foreground">
                  No line items yet.{!disabled && ' Click "Add item" to get started.'}
                </td>
              </tr>
            )}
            {items.map((item) => {
              const amount = item.quantity * item.unitPrice
              return (
                <tr key={item.id}>
                  <td className="px-2 py-1.5">
                    {disabled ? (
                      <span className="text-sm px-1">{item.description}</span>
                    ) : (
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Task or service description"
                        className="h-7 text-sm border-0 shadow-none focus-visible:ring-1 px-1"
                        disabled={disabled}
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {disabled ? (
                      <span className="text-sm text-right block px-1 tabular-nums">{item.quantity}</span>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="h-7 text-sm text-right border-0 shadow-none focus-visible:ring-1 px-1 tabular-nums"
                        disabled={disabled}
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {disabled ? (
                      <span className="text-sm text-right block px-1 tabular-nums">
                        {symbol}{item.unitPrice.toFixed(2)}
                      </span>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        className="h-7 text-sm text-right border-0 shadow-none focus-visible:ring-1 px-1 tabular-nums"
                        disabled={disabled}
                      />
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-sm font-medium">
                    {symbol}{amount.toFixed(2)}
                  </td>
                  {!disabled && (
                    <td className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                        aria-label="Remove line item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>

          {/* Totals footer */}
          <tfoot className="border-t-2 border-border bg-gray-50 divide-y divide-border">
            <tr>
              <td colSpan={disabled ? 3 : 4} className="px-3 py-2 text-right text-[13px] text-muted-foreground">
                Subtotal
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-sm">
                {symbol}{subtotal.toFixed(2)}
              </td>
            </tr>
            {discountEnabled && (
              <tr>
                <td colSpan={disabled ? 3 : 4} className="px-3 py-2 text-right text-[13px] text-muted-foreground">
                  {discountLabel}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-sm text-destructive">
                  −{symbol}{discountValue.toFixed(2)}
                </td>
              </tr>
            )}
            {vatEnabled && (
              <tr>
                <td colSpan={disabled ? 3 : 4} className="px-3 py-2 text-right text-[13px] text-muted-foreground">
                  {vatLabel} ({vatRate}%)
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-sm">
                  {symbol}{vatValue.toFixed(2)}
                </td>
              </tr>
            )}
            <tr className="font-semibold">
              <td colSpan={disabled ? 3 : 4} className="px-3 py-2.5 text-right text-sm">
                Total Due
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-sm">
                {symbol}{total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </Button>
      )}
    </div>
  )
}
