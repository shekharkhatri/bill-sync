import { createServerClient } from '@/lib/auth/clients'
import { guardAction } from '@/lib/auth/permissions'
import { getBillingWithStats, getBillingTaskSummaries } from '@/lib/billings/queries'
import { getProjectById } from '@/lib/projects/queries'
import { buildBillingCSV, getCSVFilename } from '@/lib/export/csv'
import { db } from '@/lib/db/client'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  // 1. Session check
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Permission check
  const permError = await guardAction(user.id, 'billing:export')
  if (permError) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params

    // 3. Fetch billing
    const billing = await getBillingWithStats(id)
    if (!billing) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    // 4. Status check
    if (billing.status === 'draft') {
      return Response.json(
        { error: 'Export is only available for reviewed or finalized billings.' },
        { status: 400 },
      )
    }

    // 5. Fetch project
    const project = await getProjectById(billing.projectId)
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // 6. Fetch tasks
    const tasks = await getBillingTaskSummaries(id)

    // 7. Build CSV
    const csv = buildBillingCSV(project, billing, tasks)
    const filename = getCSVFilename(project, billing)

    // 8. Log export — fire and forget, non-blocking
    db.insertInto('export_logs')
      .values({
        billing_id: id,
        exported_by: user.id,
        format: 'csv',
      })
      .execute()
      .catch((err: unknown) => console.error('[export] Failed to log export:', err))

    // 9. Return CSV response
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[export] Unexpected error:', err)
    return Response.json({ error: 'Export failed.' }, { status: 500 })
  }
}
