import React, { useState } from 'react'
import { Maximize2, Minimize2, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudioThemeSwitcher } from '@/components/studio/StudioThemeSwitcher'
import type { StudioThemeOption, StudioCustomColors } from '@/hooks/use-studio-theme'
import type { StudioWindowMode } from '@/hooks/use-studio-window'
import type { NetworkThemeId } from '@/lib/network-themes'
import type { ParsedThemeInput } from '@/lib/theme-file'
import type { ThemeEditorSubmit } from '@/components/studio/ThemeEditorDialog'

interface StudioTopControlsProps {
  themes: StudioThemeOption[]
  themeId: string
  onSelectTheme: (id: string) => void
  onCreateCustomTheme: (opts: {
    name: string
    colors: StudioCustomColors
    network?: NetworkThemeId
    isShared?: boolean
    scope?: 'team' | 'personal'
  }) => Promise<void> | void
  onDeleteCustomTheme: (id: string) => void
  /** Marca/desmarca um tema salvo no banco como compartilhado com a equipe. */
  onToggleSharedTheme?: (id: string, isShared: boolean) => Promise<void> | void
  isSavingTheme?: boolean
  /** Rede social ativa (variação de accent) — 'none' = neutro. */
  networkId?: NetworkThemeId
  onSelectNetwork?: (id: NetworkThemeId) => void
  /** Aplica o accent da rede ao tema ativo e persiste. */
  onApplyNetworkAccent?: (id: NetworkThemeId) => void
  /** Pré-visualização sem confirmar (hover) — delega ao motor de temas. */
  onStartPreviewTheme?: (id: string) => void
  onCancelPreviewTheme?: () => void
  /** Importa um tema validado de arquivo JSON. */
  onImportTheme?: (input: ParsedThemeInput) => void
  /** Edita um tema personalizado existente. */
  onUpdateTheme?: (id: string, input: ThemeEditorSubmit) => Promise<void> | void
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
  onToggleSharedTheme,
  isSavingTheme,
  networkId,
  onSelectNetwork,
  onApplyNetworkAccent,
  onStartPreviewTheme,
  onCancelPreviewTheme,
  onImportTheme,
  onUpdateTheme,
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
        onToggleShared={onToggleSharedTheme}
        isSaving={isSavingTheme}
        networkId={networkId}
        onSelectNetwork={onSelectNetwork}
        onApplyNetworkAccent={onApplyNetworkAccent}
        onStartPreview={onStartPreviewTheme}
        onCancelPreview={onCancelPreviewTheme}
        onImportTheme={onImportTheme}
        onUpdateTheme={onUpdateTheme}
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
