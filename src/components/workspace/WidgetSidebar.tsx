import { useState, type ReactNode, type DragEvent } from 'react'
import { cn } from '@/lib/utils'
import { DraggableWidget } from './DraggableWidget'
import { type WidgetType } from '@/hooks/use-workspace'

interface WidgetSidebarProps {
  side: 'left' | 'right'
  widgets: WidgetType[]
  onReorder: (fromIdx: number, toIdx: number) => void
  renderWidget: (type: WidgetType) => ReactNode
  className?: string
}

export function WidgetSidebar({ widgets, onReorder, renderWidget, className }: WidgetSidebarProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverInfo, setDragOverInfo] = useState<{
    index: number
    position: 'above' | 'below'
  } | null>(null)

  const handleDragStart = (index: number) => setDraggedIndex(index)

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    setDragOverInfo({ index, position: e.clientY < midpoint ? 'above' : 'below' })
  }

  const handleDrop = (_index: number) => {
    if (draggedIndex === null || !dragOverInfo) {
      setDraggedIndex(null)
      setDragOverInfo(null)
      return
    }
    let target = dragOverInfo.position === 'above' ? dragOverInfo.index : dragOverInfo.index + 1
    if (draggedIndex < target) target -= 1
    if (draggedIndex !== target) {
      onReorder(draggedIndex, target)
    }
    setDraggedIndex(null)
    setDragOverInfo(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverInfo(null)
  }

  return (
    <div className={cn('flex flex-col gap-2 overflow-y-auto overflow-x-hidden pr-1', className)}>
      {widgets.map((type, index) => (
        <DraggableWidget
          key={type}
          type={type}
          index={index}
          isDragging={draggedIndex === index}
          isDragOver={dragOverInfo?.index === index && draggedIndex !== index}
          dragPosition={
            draggedIndex !== null && dragOverInfo?.index === index && draggedIndex !== index
              ? dragOverInfo.position
              : null
          }
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        >
          {renderWidget(type)}
        </DraggableWidget>
      ))}
      {widgets.length === 0 && (
        <div className="text-center text-[10px] text-muted-foreground py-4">
          Nenhum widget nesta barra
        </div>
      )}
    </div>
  )
}
