import { useState, type ReactNode, type DragEvent } from 'react'
import { GripVertical, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WIDGET_TITLES, type WidgetType } from '@/hooks/use-workspace'

interface DraggableWidgetProps {
  type: WidgetType
  index: number
  isDragging: boolean
  isDragOver: boolean
  dragPosition: 'above' | 'below' | null
  onDragStart: (index: number) => void
  onDragOver: (e: DragEvent, index: number) => void
  onDrop: (index: number) => void
  onDragEnd: () => void
  children: ReactNode
}

export function DraggableWidget({
  type,
  index,
  isDragging,
  isDragOver,
  dragPosition,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  children,
}: DraggableWidgetProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={cn(
        'rounded-xl border bg-card transition-all duration-200 relative',
        isDragging && 'opacity-40',
        isDragOver && dragPosition === 'above' && 'ring-t-2 ring-primary',
        isDragOver && dragPosition === 'below' && 'ring-b-2 ring-primary',
      )}
    >
      {isDragOver && dragPosition === 'above' && (
        <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-20" />
      )}
      {isDragOver && dragPosition === 'below' && (
        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-20" />
      )}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', type)
          e.dataTransfer.effectAllowed = 'move'
          onDragStart(index)
        }}
        onDragEnd={onDragEnd}
        className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing border-b border-border select-none hover:bg-muted/50 transition-colors"
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-bold flex-1">{WIDGET_TITLES[type]}</span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={cn('w-3.5 h-3.5 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </div>
      {!collapsed && <div className="p-3">{children}</div>}
    </div>
  )
}
