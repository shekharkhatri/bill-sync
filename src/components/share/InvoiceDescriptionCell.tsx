'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Same pattern as TaskSummaryCell — tooltip always shown (acceptable for this use case).
// Future: suppress when scrollWidth <= clientWidth.

export default function InvoiceDescriptionCell({
  description,
}: {
  description: string
}): React.ReactElement {
  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="text-sm text-neutral-900 block truncate cursor-default max-w-full" />
          }
        >
          {description}
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          className="max-w-sm text-sm leading-relaxed"
        >
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
