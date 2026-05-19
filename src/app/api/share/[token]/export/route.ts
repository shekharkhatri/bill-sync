// PUBLIC ROUTE — authenticated by share token only.
// No Supabase session required. Token validity checked in getSharedBillingView().
// Consider adding rate limiting (e.g. Vercel Edge rate limit or upstash/ratelimit)
// in a future hardening pass if abuse is a concern.
// Current mitigations: token is 256-bit random, export logged with format='csv-shared'.

import { db } from '@/lib/db/client'
import { getSharedBillingView } from '@/lib/share/queries'
import { buildSharedBillingCSV } from '@/lib/export/csv'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  try {
    const { token } = await params

    // 1. Validate share token — returns null for invalid, revoked, expired, or draft
    const view = await getSharedBillingView(token)
    if (!view) {
      return Response.json(
        { error: 'Link is invalid or has been disabled.' },
        { status: 403 },
      )
    }

    // 2. Build CSV from shared view types directly
    const csv = buildSharedBillingCSV(
      view.project.name,
      view.project.clientName,
      view.billing,
      view.tasks,
    )

    // 3. Generate filename
    const sanitize = (s: string): string =>
      s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
    const filename = `${sanitize(view.project.clientName)}-${sanitize(view.billing.label)}-billing.csv`

    // 4. Log the export — fire and forget, non-blocking
    db.insertInto('export_logs')
      .values({
        billing_id: view.billing.id,
        exported_by: null,
        format: 'csv-shared',
      })
      .execute()
      .catch((err: unknown) => console.error('[share-export] Log failed:', err))

    // 5. Return CSV response
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[share-export] Unexpected error:', err)
    return Response.json({ error: 'Export failed.' }, { status: 500 })
  }
}
