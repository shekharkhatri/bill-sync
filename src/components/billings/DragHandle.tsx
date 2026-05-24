'use client'

import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'

interface DragHandleProps {
  listeners: DraggableSyntheticListeners | undefined
  attributes: DraggableAttributes
  isDragging: boolean
}

export default function DragHandle({
  listeners,
  attributes,
  isDragging,
}: DragHandleProps): React.JSX.Element {
  return (
    <div
      {...listeners}
      {...attributes}
      aria-label="Drag to reorder"
      className={cn(
        'flex items-center justify-center w-6 h-6 rounded',
        'text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400',
        isDragging ? 'cursor-grabbing text-neutral-500' : 'cursor-grab',
      )}
    >
      <GripVertical className="h-4 w-4" />
    </div>
  )
}
