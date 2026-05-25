'use client'

import { useState } from 'react'
import type { SharedInvoiceView } from '@/lib/share/types'
import { CURRENCY_SYMBOLS, type InvoiceCurrency } from '@/lib/invoices/types'
import InvoiceDescriptionCell from '@/components/share/InvoiceDescriptionCell'

interface SharePageTabsProps {
  invoice: SharedInvoiceView
  worklogContent: React.ReactNode
}

function formatDate(d: Date | null): string {
  if (!d) return '—'
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Currency symbol + thousand-separated number, e.g. "Rs.644,665.00" */
function formatCurrency(amount: number, currency: InvoiceCurrency): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${symbol}${formatted}`
}

export default function SharePageTabs({
  invoice,
  worklogContent,
}: SharePageTabsProps): React.ReactElement {
  const [tab, setTab] = useState<'invoice' | 'worklog'>('invoice')

  const hasBankDetails = !!(invoice.bankName || invoice.bankAccount || invoice.bankSwift || invoice.notes)

  return (
    <div>
      {/* ── Tab bar ── */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-0">
          {(
            [
              { key: 'invoice', label: 'Proforma Invoice' },
              { key: 'worklog', label: 'Worklog' },
            ] as { key: 'invoice' | 'worklog'; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Invoice tab ── */}
      {tab === 'invoice' && (
        <div>

          {/* ══ DESKTOP HEADER — FROM | TO | INVOICE # ══
               Col order: FROM (left) | TO (center) | INVOICE # (right-aligned)
               Hidden on mobile, replaced by stacked version below. */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-3 gap-8 mb-8 pb-8 border-b border-neutral-200">

              {/* Col 1 — FROM */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">
                  FROM
                </p>
                {invoice.companyName && (
                  <p className="text-sm font-semibold text-neutral-900">{invoice.companyName}</p>
                )}
                <div className="space-y-0.5 mt-1">
                  {invoice.companyAddress && (
                    <p className="text-[13px] text-neutral-600">{invoice.companyAddress}</p>
                  )}
                  {invoice.companyEmail && (
                    <p className="text-[13px] text-neutral-600">{invoice.companyEmail}</p>
                  )}
                  {invoice.companyPhone && (
                    <p className="text-[13px] text-neutral-600">{invoice.companyPhone}</p>
                  )}
                </div>
              </div>

              {/* Col 2 — TO (center) */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">
                  TO
                </p>
                {invoice.clientName && (
                  <p className="text-sm font-semibold text-neutral-900">{invoice.clientName}</p>
                )}
                <div className="space-y-0.5 mt-1">
                  {invoice.clientAddress && (
                    <p className="text-[13px] text-neutral-600">{invoice.clientAddress}</p>
                  )}
                  {invoice.clientEmail && (
                    <p className="text-[13px] text-neutral-600">{invoice.clientEmail}</p>
                  )}
                </div>
              </div>

              {/* Col 3 — INVOICE # (right column, right-aligned) */}
              <div className="flex flex-col items-end text-right">
                <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">
                  INVOICE #
                </p>
                <p className="text-2xl font-bold text-neutral-900 mb-3">
                  {invoice.invoiceNumber || '—'}
                </p>
                <div className="space-y-1.5 w-full">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[13px] text-neutral-500">Date</span>
                    <span className="text-[13px] font-medium text-neutral-900">
                      {formatDate(invoice.invoiceDate)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[13px] text-neutral-500">Due</span>
                    <span className="text-[13px] font-medium text-neutral-900">
                      {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[13px] text-neutral-500">Currency</span>
                    <span className="text-[13px] font-medium text-neutral-900">
                      {invoice.currency}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ══ MOBILE HEADER — stacked, Invoice Meta first ══
               DOM order: Invoice Meta | From | To
               CSS order: order-first → order-2 → order-3 */}
          <div className="block sm:hidden">
            <div className="grid grid-cols-1 gap-6 mb-6 pb-6 border-b border-neutral-200">

              {/* Invoice Meta — first on mobile */}
              <div className="order-first">
                <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">
                  INVOICE #
                </p>
                <p className="text-xl font-bold text-neutral-900">
                  {invoice.invoiceNumber || '—'}
                </p>
                <div className="space-y-1.5 mt-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-[13px] text-neutral-500">Date</span>
                    <span className="text-[13px] font-medium text-neutral-900">
                      {formatDate(invoice.invoiceDate)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[13px] text-neutral-500">Due</span>
                    <span className="text-[13px] font-medium text-neutral-900">
                      {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[13px] text-neutral-500">Currency</span>
                    <span className="text-[13px] font-medium text-neutral-900">
                      {invoice.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* From — second on mobile */}
              <div className="order-2">
                <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">
                  FROM
                </p>
                {invoice.companyName && (
                  <p className="text-sm font-semibold text-neutral-900">{invoice.companyName}</p>
                )}
                <div className="space-y-0.5 mt-1">
                  {invoice.companyAddress && (
                    <p className="text-[13px] text-neutral-600">{invoice.companyAddress}</p>
                  )}
                  {invoice.companyEmail && (
                    <p className="text-[13px] text-neutral-600">{invoice.companyEmail}</p>
                  )}
                  {invoice.companyPhone && (
                    <p className="text-[13px] text-neutral-600">{invoice.companyPhone}</p>
                  )}
                </div>
              </div>

              {/* To — third on mobile */}
              <div className="order-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-2">
                  TO
                </p>
                {invoice.clientName && (
                  <p className="text-sm font-semibold text-neutral-900">{invoice.clientName}</p>
                )}
                <div className="space-y-0.5 mt-1">
                  {invoice.clientAddress && (
                    <p className="text-[13px] text-neutral-600">{invoice.clientAddress}</p>
                  )}
                  {invoice.clientEmail && (
                    <p className="text-[13px] text-neutral-600">{invoice.clientEmail}</p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* ── LINE ITEMS heading ── */}
          <div className="mt-8 mb-3">
            <p className="text-[11px] uppercase tracking-wide font-medium text-neutral-500">
              LINE ITEMS
            </p>
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse table-fixed">
                {/* colgroup — justified inline style exception for table-fixed widths */}
                <colgroup>
                  <col style={{ width: 'auto' }} />
                  <col style={{ width: '80px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '60px' }} />
                  <col style={{ width: '130px' }} />
                </colgroup>
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-[11px] uppercase tracking-wide text-neutral-500 font-medium text-left py-2.5 pl-3">
                      Description
                    </th>
                    <th className="text-[11px] uppercase tracking-wide text-neutral-500 font-medium text-right py-2.5">
                      Qty
                    </th>
                    <th className="text-[11px] uppercase tracking-wide text-neutral-500 font-medium text-right py-2.5">
                      Unit Price
                    </th>
                    <th className="text-[11px] uppercase tracking-wide text-neutral-500 font-medium text-right py-2.5">
                      Tax
                    </th>
                    <th className="text-[11px] uppercase tracking-wide text-neutral-500 font-medium text-right py-2.5 pr-3">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.lineItems.map((li, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pl-3 min-w-0 max-w-0">
                        <InvoiceDescriptionCell description={li.description} />
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-sm text-neutral-900 whitespace-nowrap">
                        {li.quantity.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-sm text-neutral-600 whitespace-nowrap">
                        {formatCurrency(li.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-2.5 text-right text-sm text-neutral-500 whitespace-nowrap">
                        {invoice.vatEnabled ? `${invoice.vatRate}%` : '—'}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-sm font-medium text-neutral-900 whitespace-nowrap pr-3">
                        {formatCurrency(li.amount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-200">
                    <td colSpan={3} className="py-2.5 pr-3 text-right text-[13px] text-neutral-500">
                      Subtotal
                    </td>
                    <td colSpan={2} className="py-2.5 pr-3 text-right text-sm tabular-nums font-medium text-neutral-900 whitespace-nowrap">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </td>
                  </tr>
                  {invoice.discountEnabled && (
                    <tr>
                      <td colSpan={3} className="py-2.5 pr-3 text-right text-[13px] text-neutral-500">
                        {invoice.discountLabel || 'Discount'}
                      </td>
                      <td colSpan={2} className="py-2.5 pr-3 text-right text-sm tabular-nums text-destructive whitespace-nowrap">
                        −{formatCurrency(invoice.discountValue, invoice.currency)}
                      </td>
                    </tr>
                  )}
                  {invoice.vatEnabled && (
                    <tr>
                      <td colSpan={3} className="py-2.5 pr-3 text-right text-[13px] text-neutral-500">
                        {invoice.vatLabel} ({invoice.vatRate}%)
                      </td>
                      <td colSpan={2} className="py-2.5 pr-3 text-right text-sm tabular-nums text-neutral-900 whitespace-nowrap">
                        {formatCurrency(invoice.vatValue, invoice.currency)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-neutral-200">
                    <td colSpan={3} className="py-3 pr-3 text-right text-sm font-bold text-neutral-900">
                      Total Due
                    </td>
                    <td colSpan={2} className="py-3 pr-3 text-right text-sm font-bold tabular-nums text-neutral-900 whitespace-nowrap">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── Mobile cards ── */}
          <div className="block sm:hidden space-y-3">
            {invoice.lineItems.map((li, i) => (
              <div key={i} className="border border-neutral-200 rounded-md p-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-neutral-900 leading-snug min-w-0">
                    {li.description}
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-neutral-900 shrink-0">
                    {formatCurrency(li.amount, invoice.currency)}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] tabular-nums text-neutral-600">
                      {li.quantity.toFixed(2)}
                    </span>
                    <span className="text-[13px] text-neutral-400">hrs</span>
                  </div>
                  <span className="text-[13px] text-neutral-300">×</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] tabular-nums text-neutral-600">
                      {formatCurrency(li.unitPrice, invoice.currency)}
                    </span>
                    <span className="text-[13px] text-neutral-400">/ hr</span>
                  </div>
                  {invoice.vatEnabled && (
                    <>
                      <span className="text-neutral-300">·</span>
                      <span className="text-[13px] text-neutral-400">
                        {invoice.vatRate}% {invoice.vatLabel}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Mobile totals card */}
            <div className="border border-neutral-200 rounded-md overflow-hidden">
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-[13px] text-neutral-500">Subtotal</span>
                  <span className="text-[13px] tabular-nums text-neutral-900">
                    {formatCurrency(invoice.subtotal, invoice.currency)}
                  </span>
                </div>
                {invoice.discountEnabled && (
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[13px] text-neutral-500">
                      Discount
                      {invoice.discountLabel && (
                        <span className="text-neutral-400"> ({invoice.discountLabel})</span>
                      )}
                    </span>
                    <span className="text-[13px] tabular-nums text-neutral-500">
                      −{formatCurrency(invoice.discountValue, invoice.currency)}
                    </span>
                  </div>
                )}
                {invoice.vatEnabled && (
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[13px] text-neutral-500">
                      {invoice.vatLabel} ({invoice.vatRate}%)
                    </span>
                    <span className="text-[13px] tabular-nums text-neutral-900">
                      {formatCurrency(invoice.vatValue, invoice.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center px-4 py-3 bg-neutral-50">
                  <span className="text-sm font-bold text-neutral-900">Total Due</span>
                  <span className="text-sm font-bold tabular-nums text-neutral-900">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bank details + footer note ── */}
          {hasBankDetails && (
            <div className="mt-8 pt-6 border-t border-neutral-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">

                {/* Left — Due date + bank details */}
                <div>
                  {invoice.dueDate && (
                    <p className="text-sm font-bold text-neutral-900 mb-2">
                      Due Date: {formatDate(invoice.dueDate)}
                    </p>
                  )}
                  {(invoice.bankName || invoice.bankAccount) && (
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-medium text-neutral-700">Bank Details:</p>
                      {invoice.bankAccount && (
                        <p className="text-[13px] text-neutral-600">
                          A/C No — {invoice.bankAccount}
                        </p>
                      )}
                      {invoice.bankName && (
                        <p className="text-[13px] text-neutral-600">{invoice.bankName}</p>
                      )}
                      {invoice.bankSwift && (
                        <p className="text-[13px] text-neutral-600">
                          Swift Code: {invoice.bankSwift}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right — reserved for future payment instructions */}
              </div>

              {/* Footer note */}
              {invoice.notes && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <p className="text-[13px] text-neutral-400">{invoice.notes}</p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ── Worklog tab ── */}
      {tab === 'worklog' && worklogContent}
    </div>
  )
}
