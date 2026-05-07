export type PeriodPreset =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'custom'

export interface DatePeriodFilter {
  preset: PeriodPreset
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  last_6_months: 'Last 6 Months',
  this_year: 'This Year',
  custom: 'Custom Range',
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatUtcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function getPresetDateRange(preset: Exclude<PeriodPreset, 'custom'>): {
  startDate: string
  endDate: string
} {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const today = formatUtcDate(now)

  switch (preset) {
    case 'this_month':
      return {
        startDate: `${year}-${pad(month + 1)}-01`,
        endDate: today,
      }
    case 'last_month': {
      const firstOfLastMonth = new Date(Date.UTC(year, month - 1, 1))
      const lastOfLastMonth = new Date(Date.UTC(year, month, 0))
      return {
        startDate: formatUtcDate(firstOfLastMonth),
        endDate: formatUtcDate(lastOfLastMonth),
      }
    }
    case 'last_3_months': {
      const start = new Date(Date.UTC(year, month - 2, 1))
      return {
        startDate: formatUtcDate(start),
        endDate: today,
      }
    }
    case 'last_6_months': {
      const start = new Date(Date.UTC(year, month - 5, 1))
      return {
        startDate: formatUtcDate(start),
        endDate: today,
      }
    }
    case 'this_year':
      return {
        startDate: `${year}-01-01`,
        endDate: today,
      }
  }
}

export function getDefaultPeriodFilter(): DatePeriodFilter {
  return {
    preset: 'this_month',
    ...getPresetDateRange('this_month'),
  }
}
