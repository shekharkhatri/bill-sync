'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { updateCompanySettingsAction } from '@/lib/invoices/settings-actions'
import type { CompanySettingsMap } from '@/lib/invoices/types'

interface CompanySettingsFormProps {
  settings: CompanySettingsMap
}

interface FieldDef {
  key: string
  label: string
  placeholder?: string
  type?: string
}

const COMPANY_FIELDS: FieldDef[] = [
  { key: 'company_name', label: 'Company Name', placeholder: 'Your company name' },
  { key: 'company_email', label: 'Email', placeholder: 'hello@yourcompany.com', type: 'email' },
  { key: 'company_phone', label: 'Phone', placeholder: '+1 555 000 0000' },
  { key: 'company_address', label: 'Address', placeholder: '123 Main St, City, Country' },
]

const BANK_FIELDS: FieldDef[] = [
  { key: 'bank_name', label: 'Bank Name', placeholder: 'Your bank' },
  { key: 'bank_account', label: 'Account Number', placeholder: 'Account / IBAN' },
  { key: 'bank_swift', label: 'SWIFT / BIC', placeholder: 'SWIFT code' },
]

const TAX_FIELDS: FieldDef[] = [
  { key: 'vat_label', label: 'Tax Label', placeholder: 'VAT' },
  { key: 'vat_rate', label: 'Default Tax Rate (%)', placeholder: '13', type: 'number' },
]

export default function CompanySettingsForm({
  settings,
}: CompanySettingsFormProps): React.ReactElement {
  const [values, setValues] = useState<Record<string, string>>(settings)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange(key: string, value: string): void {
    setSaved(false)
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateCompanySettingsAction(values)
      if (result.success) {
        setSaved(true)
      } else {
        setError(result.error)
      }
    })
  }

  function renderField({ key, label, placeholder, type }: FieldDef): React.ReactElement {
    return (
      <div key={key} className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor={key} className="text-right text-[13px]">
          {label}
        </Label>
        <Input
          id={key}
          type={type ?? 'text'}
          value={values[key] ?? ''}
          onChange={(e) => handleChange(key, e.target.value)}
          placeholder={placeholder}
          className="col-span-2 h-8 text-sm"
          disabled={isPending}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Details */}
      <section>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-4">
          Company Details
        </p>
        <div className="space-y-3">
          {COMPANY_FIELDS.map(renderField)}
        </div>
      </section>

      <Separator />

      {/* Bank Details */}
      <section>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-4">
          Bank Details
        </p>
        <div className="space-y-3">
          {BANK_FIELDS.map(renderField)}
        </div>
      </section>

      <Separator />

      {/* Invoice Defaults */}
      <section>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-4">
          Invoice Defaults
        </p>
        <div className="space-y-3">
          {TAX_FIELDS.map(renderField)}
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Settings'}
        </Button>
        {saved && (
          <span className="text-[13px] text-success-600">Settings saved.</span>
        )}
        {error && (
          <span className="text-[13px] text-destructive">{error}</span>
        )}
      </div>
    </form>
  )
}
