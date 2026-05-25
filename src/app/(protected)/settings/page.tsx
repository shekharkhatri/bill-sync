import { redirect } from 'next/navigation'
import { getUserContext, hasPermission } from '@/lib/auth/permissions'
import { getCompanySettings } from '@/lib/invoices/settings-queries'
import CompanySettingsForm from '@/components/invoices/CompanySettingsForm'

export const metadata = { title: 'Settings — BillSync' }

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const context = await getUserContext()

  if (!hasPermission(context, 'project:edit')) {
    redirect('/forbidden')
  }

  const settings = await getCompanySettings()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Company details used as defaults when creating proforma invoices.
        </p>
      </div>

      <CompanySettingsForm settings={settings} />
    </div>
  )
}
