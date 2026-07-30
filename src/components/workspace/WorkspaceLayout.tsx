import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { WidgetSidebar } from './WidgetSidebar'
import { type WidgetType } from '@/hooks/use-workspace'

interface WorkspaceLayoutProps {
  leftWidgets: WidgetType[]
  rightWidgets: WidgetType[]
  focusMode: boolean
  onReorder: (sidebar: 'left' | 'right', fromIdx: number, toIdx: number) => void
  renderWidget: (type: WidgetType) => ReactNode
  header: ReactNode
  children: ReactNode
}

export function WorkspaceLayout({
  leftWidgets,
  rightWidgets,
  focusMode,
  onReorder,
  renderWidget,
  header,
  children,
}: WorkspaceLayoutProps) {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      {header}
      <div className="flex flex-1 gap-3 overflow-hidden">
        <div
          className={cn(
            'shrink-0 transition-all duration-300 ease-in-out',
            focusMode ? 'w-0 opacity-0 overflow-hidden' : 'w-72 opacity-100',
          )}
        >
          <WidgetSidebar
            side="left"
            widgets={leftWidgets}
            onReorder={(f, t) => onReorder('left', f, t)}
            renderWidget={renderWidget}
            className="h-full"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-w-0">{children}</div>

        <div
          className={cn(
            'shrink-0 transition-all duration-300 ease-in-out',
            focusMode ? 'w-0 opacity-0 overflow-hidden' : 'w-72 opacity-100',
          )}
        >
          <WidgetSidebar
            side="right"
            widgets={rightWidgets}
            onReorder={(f, t) => onReorder('right', f, t)}
            renderWidget={renderWidget}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}
