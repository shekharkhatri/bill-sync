'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ProjectTabsProps {
  overviewContent: React.ReactNode
  billingsContent: React.ReactNode
}

export function ProjectTabs({
  overviewContent,
  billingsContent,
}: ProjectTabsProps): React.JSX.Element {
  const [active, setActive] = useState<'overview' | 'billings'>('overview')

  return (
    <div className="mt-6">
      {/* Underline tab bar */}
      <div className="flex border-b border-border">
        <button
          type="button"
          className={cn(
            'px-4 h-10 text-[13px] font-medium border-b-2 -mb-px transition-colors',
            active === 'overview'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setActive('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          className={cn(
            'px-4 h-10 text-[13px] font-medium border-b-2 -mb-px transition-colors',
            active === 'billings'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setActive('billings')}
        >
          Billings
        </button>
      </div>

      <div className="pt-5">
        {active === 'overview' ? overviewContent : billingsContent}
      </div>
    </div>
  )
}
