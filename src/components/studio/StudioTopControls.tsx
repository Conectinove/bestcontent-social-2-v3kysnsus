import React, { useState } from 'react'
import { Maximize2, Minimize2, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudioThemeSwitcher } from '@/components/studio/StudioThemeSwitcher'
import type { StudioThemeOption, StudioCustomColors } from '@/hooks/use-studio-theme'
import type { StudioWindowMode } from '@/hooks/use-studio-window'

interface StudioTopControlsProps {
  themes: StudioThemeOption[]
  themeId: string
  onSelectTheme: (id: string) => void
  onCreateCustomTheme: (name: string, colors: StudioCustomColors) => void
  onDeleteCustomTheme: (id: string) => void
  windowMode: StudioWindowMode
  onChangeWindowMode: (mode: StudioWindowMode) => void
}

/**
 * Controles do topo do Estúdio: seletor de temas (com criação de tema
 * personalizado) e botões de maximizar/diminuir a janela do Studio.
 */
export const StudioTopControls: React.FC<StudioTopControlsProps> = ({
  themes,
  themeId,
  onSelectTheme,
  onCreateCustomTheme,
  onDeleteCustomTheme,
  windowMode,
  onChangeWindowMode,
}) => {
  const [showCompact, setShowCompact] = useState(false)

  return (
    <div className="flex items-center gap-1.5">
      <StudioThemeSwitcher
        themes={themes}
        themeId={themeId}
        onSelect={onSelectTheme}
        onCreateCustom={onCreateCustomTheme}
        onDeleteCustom={onDeleteCustomTheme}
      />

      {showCompact ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Diminuir janela (painéis colapsados, canvas menor)"
          aria-label="Diminuir janela do Estúdio"
          onClick={() => {
            onChangeWindowMode('compact')
            setShowCompact(false)
          }}
          className="gap-1.5 border-border/60 bg-card/60 text-foreground/80 hover:bg-accent hover:text-accent-foreground"
        >
          <Minimize2 className="h-4 w-4" />
          <span className="hidden sm:inline">Diminuir</span>
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Maximizar janela (canvas ocupa toda a área útil)"
          aria-label="Maximizar janela do Estúdio"
          onClick={() => {
            onChangeWindowMode('maximized')
            setShowCompact(true)
          }}
          className="gap-1.5 border-border/60 bg-card/60 text-foreground/80 hover:bg-accent hover:text-accent-foreground"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="hidden sm:inline">Maximizar</span>
        </Button>
      )}

      {/* Restaura layout padrão quando o Studio está maximizado/compacto */}
      {windowMode !== 'normal' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Restaurar layout padrão"
          aria-label="Restaurar layout padrão do Estúdio"
          onClick={() => {
            onChangeWindowMode('normal')
            setShowCompact(false)
          }}
          className="gap-1.5 border-border/60 bg-card/60 text-foreground/80 hover:bg-accent hover:text-accent-foreground"
        >
          <Minimize className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Restaurar</span>
        </Button>
      )}
    </div>
  )
}

export default StudioTopControls
