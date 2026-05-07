'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  PERIOD_PRESET_LABELS,
  getPresetDateRange,
} from '@/lib/billings/period-filter-types'
import { formatDateRange } from '@/lib/billings/date-utils'
import type { DatePeriodFilter, PeriodPreset } from '@/lib/billings/period-filter-types'

interface DatePeriodFilterProps {
  value: DatePeriodFilter
  onChange: (filter: DatePeriodFilter) => void
  disabled?: boolean
}

export default function DatePeriodFilter({
  value,
  onChange,
  disabled,
}: DatePeriodFilterProps): React.JSX.Element {
  function handlePresetChange(preset: string | null): void {
    if (!preset) return
    const typedPreset = preset as PeriodPreset
    if (typedPreset === 'custom') {
      onChange({ preset: 'custom', startDate: value.startDate, endDate: value.endDate })
    } else {
      const range = getPresetDateRange(typedPreset)
      onChange({ preset: typedPreset, ...range })
    }
  }

  function handleCustomDateChange(field: 'startDate' | 'endDate', newVal: string): void {
    const updated = { ...value, [field]: newVal }
    if (field === 'startDate' && newVal > updated.endDate) {
      updated.endDate = newVal
    }
    onChange(updated)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Period</Label>
        <Select value={value.preset} onValueChange={handlePresetChange} disabled={disabled}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue>{PERIOD_PRESET_LABELS[value.preset]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(PERIOD_PRESET_LABELS) as [PeriodPreset, string][]).map(
              ([preset, label]) => (
                <SelectItem key={preset} value={preset}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {value.preset === 'custom' && (
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={value.startDate}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="h-9 w-[150px] text-sm"
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={value.endDate}
              min={value.startDate}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="h-9 w-[150px] text-sm"
              disabled={disabled}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground self-end pb-2">
        {formatDateRange(value.startDate, value.endDate)}
      </p>
    </div>
  )
}
