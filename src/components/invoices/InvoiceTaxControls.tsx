'use client'

import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InvoiceTaxControlsProps {
  vatEnabled: boolean
  vatRate: number
  vatLabel: string
  discountEnabled: boolean
  discountAmount: number
  discountLabel: string
  disabled?: boolean
  onChange: (field: string, value: boolean | number | string) => void
}

export default function InvoiceTaxControls({
  vatEnabled,
  vatRate,
  vatLabel,
  discountEnabled,
  discountAmount,
  discountLabel,
  disabled = false,
  onChange,
}: InvoiceTaxControlsProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* VAT */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Switch
            id="vat_enabled"
            checked={vatEnabled}
            onCheckedChange={(v) => onChange('vatEnabled', v)}
            disabled={disabled}
          />
          <Label htmlFor="vat_enabled" className="text-sm cursor-pointer select-none">
            Apply tax
          </Label>
        </div>
        {vatEnabled && (
          <div className="ml-9 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="vat_label" className="text-[11px] text-muted-foreground">
                Label
              </Label>
              <Input
                id="vat_label"
                value={vatLabel}
                onChange={(e) => onChange('vatLabel', e.target.value)}
                placeholder="VAT"
                disabled={disabled}
                className="h-7 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vat_rate" className="text-[11px] text-muted-foreground">
                Rate (%)
              </Label>
              <Input
                id="vat_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={vatRate}
                onChange={(e) => onChange('vatRate', parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className="h-7 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Discount */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Switch
            id="discount_enabled"
            checked={discountEnabled}
            onCheckedChange={(v) => onChange('discountEnabled', v)}
            disabled={disabled}
          />
          <Label htmlFor="discount_enabled" className="text-sm cursor-pointer select-none">
            Apply discount
          </Label>
        </div>
        {discountEnabled && (
          <div className="ml-9 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="discount_label" className="text-[11px] text-muted-foreground">
                Label
              </Label>
              <Input
                id="discount_label"
                value={discountLabel}
                onChange={(e) => onChange('discountLabel', e.target.value)}
                placeholder="Discount"
                disabled={disabled}
                className="h-7 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="discount_amount" className="text-[11px] text-muted-foreground">
                Amount
              </Label>
              <Input
                id="discount_amount"
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => onChange('discountAmount', parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className="h-7 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
