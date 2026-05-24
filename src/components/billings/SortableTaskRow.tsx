'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'

interface SortableTaskRowRenderProps {
  nodeRef: (node: HTMLElement | null) => void
  // transform + transition are dynamic values from @dnd-kit — must be applied as
  // inline styles on the <tr>; this is the one justified exception to no-inline-styles.
  dragStyle: React.CSSProperties
  dragHandleListeners: DraggableSyntheticListeners | undefined
  dragHandleAttributes: DraggableAttributes
  isDragging: boolean
}

interface SortableTaskRowProps {
  id: string
  disabled: boolean
  children: (props: SortableTaskRowRenderProps) => React.ReactNode
}

export default function SortableTaskRow({
  id,
  disabled,
  children,
}: SortableTaskRowProps): React.ReactNode {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return children({
    nodeRef: setNodeRef,
    dragStyle,
    dragHandleListeners: listeners,
    dragHandleAttributes: attributes,
    isDragging,
  })
}
