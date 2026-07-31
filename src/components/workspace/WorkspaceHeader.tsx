import { type ReactNode } from 'react'
import { Maximize2, Minimize2, LayoutGrid, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { PRESETS } from '@/hooks/use-workspace'
import { cn } from '@/lib/utils'

interface WorkspaceHeaderProps {
  focusMode: boolean
  onToggleFocus: () => void
  activePreset: string
  onApplyPreset: (id: string) => void
  actions?: ReactNode
  children?: ReactNode
}

export function WorkspaceHeader({
  focusMode,
  onToggleFocus,
  activePreset,
  onApplyPreset,
  actions,
  children,
}: WorkspaceHeaderProps) {
  const activeName = PRESETS.find((p) => p.id === activePreset)?.name || 'Personalizado'

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 mb-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">{children}</div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 transition-all duration-200 hover:border-primary/40"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{activeName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs font-bold">Perfis de Layout</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => onApplyPreset(preset.id)}
                className={cn(
                  'cursor-pointer flex items-start gap-2 py-2 transition-colors duration-200',
                  activePreset === preset.id && 'bg-primary/10',
                )}
              >
                <div className="w-4 shrink-0 pt-0.5">
                  {activePreset === preset.id && <Check className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium">{preset.name}</div>
                  <div className="text-[10px] text-muted-foreground">{preset.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-[9px] text-muted-foreground">
                Layout personalizado é salvo automaticamente.
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={focusMode ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleFocus}
          className={cn(
            'text-xs gap-1.5 transition-all duration-200',
            focusMode && 'bg-primary text-primary-foreground shadow-subtle',
          )}
        >
          {focusMode ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Foco Total</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
