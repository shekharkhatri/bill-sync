/*
 * BillSync Billing CSV Export Format
 *
 * Row 1:  Header labels (Project, Client, Billing Period, Status, Exported At)
 * Row 2:  Header values
 * Row 3:  (blank)
 * Row 4:  Summary labels (Total Original Hours, Total Billed Hours, Line Items)
 * Row 5:  Summary values
 * Row 6:  (blank)
 * Row 7:  Column headers (Task, Hours)
 * Row 8+: One row per billing task
 * Last:   Totals row
 *
 * Encoding: UTF-8
 * Line endings: CRLF (\r\n)
 * Quoting: all string values double-quoted, internal quotes doubled
 * Filename: {client}-{label}-billing.csv (sanitized, lowercase)
 */

// SERVER ONLY — never import from Client Components

import { formatDateFull } from '@/lib/jira/format-utils'
import type { BillingWithStats, BillingTaskSummary } from '@/lib/billings/types'
import type { Project } from '@/lib/projects/types'
import type { SharedTaskRow } from '@/lib/share/types'

/**
 * Escapes a value for safe inclusion in a CSV cell.
 */
export function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return String(value)
  // Always wrap strings in double quotes; escape internal double quotes by doubling them
  return `"${value.replace(/"/g, '""')}"`
}

/**
 * Generates a safe filename for the billing CSV export.
 */
export function getCSVFilename(project: Project, billing: BillingWithStats): string {
  const sanitize = (s: string): string =>
    s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
  const sanitizedClient = sanitize(project.clientName)
  const sanitizedLabel = sanitize(billing.label)
  return `${sanitizedClient}-${sanitizedLabel}-billing.csv`
}

export function buildBillingCSV(
  project: Project,
  billing: BillingWithStats,
  tasks: BillingTaskSummary[],
): string {
  const CRLF = '\r\n'
  const rows: string[] = []

  // ── Section 1: Header block ───────────────────────────────────────────────
  const statusLabel =
    billing.status.charAt(0).toUpperCase() + billing.status.slice(1)
  const dateRange = `${formatDateFull(billing.startDate)} – ${formatDateFull(billing.endDate)}`

  rows.push(
    [
      escapeCSV('Project'),
      escapeCSV('Client'),
      escapeCSV('Billing Period'),
      escapeCSV('Status'),
      escapeCSV('Exported At'),
    ].join(','),
  )
  rows.push(
    [
      escapeCSV(project.name),
      escapeCSV(project.clientName),
      escapeCSV(dateRange),
      escapeCSV(statusLabel),
      escapeCSV(new Date().toISOString()),
    ].join(','),
  )
  rows.push('') // blank separator

  // ── Section 2: Summary ────────────────────────────────────────────────────
  rows.push(
    [
      escapeCSV('Total Hours'),
      escapeCSV('Line Items'),
    ].join(','),
  )
  rows.push(
    [
      escapeCSV(billing.totalModifiedHours.toFixed(2)),
      escapeCSV(tasks.length),
    ].join(','),
  )
  rows.push('') // blank separator

  // ── Section 3: Line items ─────────────────────────────────────────────────
  // Tasks are ordered by sort_order (user-defined drag order).
  // Order is set via reorderTasksAction and stored in worklogs.sort_order.
  rows.push(
    [
      escapeCSV('Task'),
      escapeCSV('Hours'),
    ].join(','),
  )

  let totalEffective = 0

  for (const task of tasks) {
    const effectiveHours = task.effectiveSeconds / 3600

    rows.push(
      [
        escapeCSV(task.displaySummary),
        escapeCSV(effectiveHours.toFixed(2)),
      ].join(','),
    )

    totalEffective += effectiveHours
  }

  // ── Section 4: Totals row ─────────────────────────────────────────────────
  rows.push(
    [
      escapeCSV('TOTAL'),
      escapeCSV(totalEffective.toFixed(2)),
    ].join(','),
  )

  return rows.join(CRLF)
}

/**
 * Builds a simplified CSV for the public shared worklog view.
 * Intentionally excludes: status, original hours, internal notes, difference.
 * These are internal fields and must not appear in the external-facing export.
 *
 * Columns: Task, Hours
 */
export function buildSharedBillingCSV(
  projectName: string,
  clientName: string,
  label: string,
  dateRange: string,
  totalHours: number,
  tasks: SharedTaskRow[],
): string {
  const CRLF = '\r\n'
  const rows: string[] = []

  // ── Section 1: Header block ───────────────────────────────────────────────
  rows.push(
    [
      escapeCSV('Project'),
      escapeCSV('Client'),
      escapeCSV('Billing Period'),
      escapeCSV('Exported At'),
    ].join(','),
  )
  rows.push(
    [
      escapeCSV(projectName),
      escapeCSV(clientName),
      escapeCSV(dateRange),
      escapeCSV(new Date().toISOString()),
    ].join(','),
  )
  rows.push('')

  // ── Section 2: Summary ────────────────────────────────────────────────────
  rows.push(
    [
      escapeCSV('Total Hours'),
      escapeCSV('Line Items'),
    ].join(','),
  )
  rows.push(
    [
      escapeCSV(totalHours.toFixed(2)),
      escapeCSV(tasks.length),
    ].join(','),
  )
  rows.push('')

  // ── Section 3: Line items ─────────────────────────────────────────────────
  rows.push(
    [
      escapeCSV('Task'),
      escapeCSV('Hours'),
    ].join(','),
  )

  let totalEffective = 0

  for (const task of tasks) {
    rows.push(
      [
        escapeCSV(task.displaySummary),
        escapeCSV(task.effectiveHours.toFixed(2)),
      ].join(','),
    )

    totalEffective += task.effectiveHours
  }

  // ── Section 4: Totals row ─────────────────────────────────────────────────
  rows.push(
    [
      escapeCSV('TOTAL'),
      escapeCSV(totalEffective.toFixed(2)),
    ].join(','),
  )

  return rows.join(CRLF)
}
