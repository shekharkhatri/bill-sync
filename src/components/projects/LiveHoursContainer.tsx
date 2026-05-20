'use client'

// IMPORTANT: Do NOT import any server-only modules or Server Components here.
// This file is a Client Component. Server Components (e.g. ProjectOverviewPanel)
// must be passed in as `children` by a parent Server Component, never imported directly.

import { useState, Suspense } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DatePeriodFilter from '@/components/shared/DatePeriodFilter'
import { LiveHoursSkeleton } from '@/components/projects/LiveHoursSkeleton'
import type { DatePeriodFilter as DatePeriodFilterType } from '@/lib/billings/period-filter-types'

interface LiveHoursContainerProps {
  /** The filter state as determined by the server from URL params. */
  initialFilter: DatePeriodFilterType
  /**
   * A cache-busting key derived from the active filter dates (e.g. "2025-04-01-2025-04-30").
   * Passed from the server so the Suspense boundary remounts when the server re-renders
   * with new URL params, showing the skeleton while new data loads.
   */
  filterKey: string
  /** ProjectOverviewPanel rendered by the server — passed as a slot to avoid bundling
   *  server-only code (pg, Kysely) into the client bundle. */
  children: React.ReactNode
}

export default function LiveHoursContainer({
  initialFilter,
  filterKey,
  children,
}: LiveHoursContainerProps): React.JSX.Element {
  const [filter, setFilter] = useState<DatePeriodFilterType>(initialFilter)
  const router = useRouter()
  const pathname = usePathname()

  function handleFilterChange(newFilter: DatePeriodFilterType): void {
    setFilter(newFilter)
    router.replace(`${pathname}?start=${newFilter.startDate}&end=${newFilter.endDate}`, {
      scroll: false,
    })
  }

  return (
    <div>
      {/* Period filter — right-aligned, compact, sits above stat row */}
      <div className="flex justify-end mb-3">
        <DatePeriodFilter value={filter} onChange={handleFilterChange} />
      </div>

      {/*
        key={filterKey} comes from the SERVER (URL params), not client state.
        When the URL changes the server re-renders, passing a new filterKey, which
        remounts this Suspense boundary and shows the skeleton while new data loads.
      */}
      <Suspense key={filterKey} fallback={<LiveHoursSkeleton />}>
        {children}
      </Suspense>
    </div>
  )
}
