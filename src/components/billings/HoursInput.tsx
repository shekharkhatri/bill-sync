'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface HoursInputProps {
  value: number | null
  originalSeconds: number
  onChange: (seconds: number | null) => void
  disabled?: boolean
}

export default function HoursInput({
  value,
  originalSeconds,
  onChange,
  disabled,
}: HoursInputProps): React.JSX.Element {
  const displayHours = value !== null ? value / 3600 : originalSeconds / 3600
  const [inputValue, setInputValue] = useState(displayHours.toFixed(2))

  useEffect(() => {
    const hours = value !== null ? value / 3600 : originalSeconds / 3600
    setInputValue(hours.toFixed(2))
  }, [value, originalSeconds])

  const parsed = parseFloat(inputValue)
  const isOutOfRange = !isNaN(parsed) && (parsed < 0 || parsed > 24)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setInputValue(e.target.value)
    const num = parseFloat(e.target.value)
    if (!isNaN(num) && num >= 0 && num <= 24) {
      onChange(Math.round(num * 3600))
    }
  }

  function handleBlur(): void {
    const num = parseFloat(inputValue)
    if (isNaN(num) || num === 0) {
      onChange(null)
      setInputValue((originalSeconds / 3600).toFixed(2))
    } else {
      setInputValue((Math.round(num * 3600) / 3600).toFixed(2))
    }
  }

  return (
    <div>
      <div className="relative flex items-center">
        <Input
          type="number"
          min="0"
          max="24"
          step="0.25"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'w-24 text-right pr-7',
            value === null && 'text-muted-foreground',
            isOutOfRange && 'border-destructive',
          )}
        />
        <span className="absolute right-2 text-sm text-muted-foreground pointer-events-none">
          h
        </span>
      </div>
      {value !== null && (
        <p className="text-xs text-muted-foreground mt-0.5 text-right">
          orig: {(originalSeconds / 3600).toFixed(2)}h
        </p>
      )}
    </div>
  )
}
