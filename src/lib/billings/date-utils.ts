const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatDateShort(date: Date): string {
  return shortDateFormatter.format(date)
}

export function formatDateFullSafe(date: Date): string {
  return fullDateFormatter.format(date)
}

/**
 * Parses a YYYY-MM-DD string to a Date object at UTC midnight.
 * Throws if the format is invalid.
 */
export function parseDateString(dateStr: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date string: ${dateStr}`)
  }
  const [year, month, day] = dateStr.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(year, month - 1, day))
}

const shortMonthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const shortMonthDayYear = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDateString(startDate)
  const end = parseDateString(endDate)
  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${shortMonthDay.format(start)} – ${shortMonthDayYear.format(end)}`
  }
  return `${shortMonthDayYear.format(start)} – ${shortMonthDayYear.format(end)}`
}

export function isDateRangeValid(startDate: string, endDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return false
  }
  return startDate <= endDate
}

export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const pad = (n: number): string => String(n).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    startDate: `${year}-${pad(month + 1)}-01`,
    endDate: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  }
}
