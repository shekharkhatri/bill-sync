'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RefreshButton(): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRefresh(): void {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={handleRefresh}>
      <RefreshCw className={`h-4 w-4 mr-1.5 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Refreshing...' : 'Refresh'}
    </Button>
  )
}
