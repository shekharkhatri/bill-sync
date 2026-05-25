'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddressBlockProps {
  title: string
  nameKey: string
  addressKey: string
  emailKey: string
  nameValue: string
  addressValue: string
  emailValue: string
  disabled?: boolean
  onChange: (key: string, value: string) => void
}

export default function AddressBlock({
  title,
  nameKey,
  addressKey,
  emailKey,
  nameValue,
  addressValue,
  emailValue,
  disabled = false,
  onChange,
}: AddressBlockProps): React.ReactElement {
  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
        {title}
      </p>
      <div className="space-y-2">
        <div>
          <Label htmlFor={nameKey} className="text-[11px] text-muted-foreground">
            Name
          </Label>
          <Input
            id={nameKey}
            value={nameValue}
            onChange={(e) => onChange(nameKey, e.target.value)}
            placeholder="Company or person name"
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>
        <div>
          <Label htmlFor={addressKey} className="text-[11px] text-muted-foreground">
            Address
          </Label>
          <Input
            id={addressKey}
            value={addressValue}
            onChange={(e) => onChange(addressKey, e.target.value)}
            placeholder="Street, City, Country"
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>
        <div>
          <Label htmlFor={emailKey} className="text-[11px] text-muted-foreground">
            Email
          </Label>
          <Input
            id={emailKey}
            type="email"
            value={emailValue}
            onChange={(e) => onChange(emailKey, e.target.value)}
            placeholder="email@example.com"
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>
      </div>
    </div>
  )
}
