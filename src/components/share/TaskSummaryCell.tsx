'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TaskSummaryCellProps {
  summary: string
}

// Future: suppress tooltip when text is not actually truncated
// by comparing span.scrollWidth > span.clientWidth in useEffect.
// Currently shows for all tasks — acceptable for this use case.

export default function TaskSummaryCell({
  summary,
}: TaskSummaryCellProps): React.ReactElement {
  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="text-sm text-neutral-900 block truncate cursor-default max-w-full" />
          }
        >
          {summary}
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          className="max-w-sm text-sm leading-relaxed"
        >
          {summary}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
