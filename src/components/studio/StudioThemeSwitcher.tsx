/**
 * Seletor de tema (Header global e Studio): lista temas com PRÉ-VISUALIZAÇÃO
 * ao passar o mouse (aplica na raiz sem confirmar — confirmar só no clique),
 * exportar/importar tema (arquivo JSON), abrir o editor completo de temas e
 * alternar o escopo do tema personalizado: "Só para mim" ou "Equipe".
 */
import { useState } from 'react'
import {
  Palette,
  Plus,
  Trash2,
  Check,
  Users,
  Share2,
  Loader2,
  Download,
  Upload,
  Pencil,
  WandSparkles,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import type { StudioThemeOption } from '@/hooks/use-studio-theme'
import type { NetworkThemeId } from '@/lib/network-themes'
import {
  downloadThemeFile,
  parseThemeFile,
  pickThemeFile,
  type ParsedThemeInput,
} from '@/lib/theme-file'
import { ThemeEditorDialog, type ThemeEditorSubmit } from '@/components/studio/ThemeEditorDialog'
import { NetworkThemeSubmenu } from '@/components/studio/NetworkThemeSubmenu'
import { ThemePreviewCard } from '@/components/studio/ThemePreviewCard'
import { NETWORK_THEMES, type NetworkThemeId as NtwId } from '@/lib/network-themes'

interface StudioThemeSwitcherProps {
  themes: StudioThemeOption[]
  themeId: string
  onSelect: (id: string) => void
  onCreateCustom: (opts: {
    name: string
    colors: StudioCustomColorsInput
    network?: NetworkThemeId
    isShared?: boolean
    scope?: 'team' | 'personal'
  }) => Promise<void> | void
  onDeleteCustom: (id: string) => Promise<void> | void
  /** Rede social escolhida (variação de accent) — 'none' = sem rede. */
  networkId?: NetworkThemeId
  onSelectNetwork?: (id: NetworkThemeId) => void
  /** Aplica o accent da rede ao tema ativo e persiste (localStorage + banco). */
  onApplyNetworkAccent?: (id: NetworkThemeId) => void
  /** Marca/desmarca um tema salvo no banco como compartilhado com a equipe. */
  onToggleShared?: (id: string, isShared: boolean) => Promise<void> | void
  /** Pré-visualização: aplica o tema temporariamente (hover), sem confirmar. */
  onStartPreview?: (id: string) => void
  /** Encerra a pré-visualização e volta ao tema confirmado. */
  onCancelPreview?: () => void
  /** Importa um tema validado de arquivo JSON (cria + aplica). */
  onImportTheme?: (input: ParsedThemeInput) => void
  /** Edita um tema personalizado existente (editor completo). */
  onUpdateTheme?: (id: string, input: ThemeEditorSubmit) => Promise<void> | void
  isSaving?: boolean
}

type StudioCustomColorsInput = {
  background: string
  surface: string
  primary: string
  text: string
}

export const StudioThemeSwitcher: React.FC<StudioThemeSwitcherProps> = ({
  themes,
  themeId,
  onSelect,
  onCreateCustom,
  onDeleteCustom,
  networkId = 'none',
  onSelectNetwork,
  onApplyNetworkAccent,
  onToggleShared,
  onStartPreview,
  onCancelPreview,
  onImportTheme,
  onUpdateTheme,
  isSaving = false,
}) => {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTheme, setEditingTheme] = useState<StudioThemeOption | null>(null)
  const [importing, setImporting] = useState(false)

  const handleSelect = (t: StudioThemeOption) => {
    // Clique confirma: encerra a pré-visualização e grava a escolha
    onCancelPreview?.()
    onSelect(t.id)
    if (t.network && t.network !== 'none' && onSelectNetwork) {
      onSelectNetwork(t.network as NetworkThemeId)
    }
  }

  const handleExport = (t: StudioThemeOption) => {
    const ok = downloadThemeFile(t)
    if (ok) {
      toast({ title: `Tema "${t.name}" exportado`, description: 'Arquivo JSON baixado.' })
    } else {
      toast({
        title: 'Este tema não pode ser exportado',
        description: 'Temas embutidos e de marca não têm cores hex editáveis.',
        variant: 'destructive',
      })
    }
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const raw = await pickThemeFile()
      if (!raw) return
      const parsed = parseThemeFile(raw)
      if (!parsed.ok || !parsed.input) {
        toast({
          title: 'Arquivo de tema inválido',
          description: parsed.error,
          variant: 'destructive',
        })
        return
      }
      if (onImportTheme) {
        onImportTheme(parsed.input)
      } else {
        // Motor do Studio (sem banco): cria localmente
        await onCreateCustom({
          name: parsed.input.name,
          colors: parsed.input.colors,
          network: (parsed.input.network as NetworkThemeId) || 'none',
          scope: 'personal',
        })
      }
      toast({ title: `Tema "${parsed.input.name}" importado e aplicado` })
      setOpen(false)
    } finally {
      setImporting(false)
    }
  }

  const handleEditorSubmit = async (input: ThemeEditorSubmit) => {
    if (editingTheme && onUpdateTheme) {
      await onUpdateTheme(editingTheme.id, input)
      toast({ title: `Tema "${input.name}" atualizado` })
    } else {
      await onCreateCustom({
        name: input.name,
        colors: input.colors,
        network: (input.network as NetworkThemeId) || 'none',
        scope: input.scope,
        isShared: input.scope === 'team',
      })
      toast({
        title: `Tema "${input.name}" criado e aplicado`,
        description: input.scope === 'team' ? 'Compartilhado com a equipe.' : 'Só para você.',
      })
    }
    setEditingTheme(null)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-border/60 bg-card/60 text-foreground/80 hover:bg-accent hover:text-accent-foreground"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Tema</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Tema do app</p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-xs"
                onClick={() => handleImport()}
                disabled={importing}
                title="Importar tema de arquivo JSON"
              >
                {importing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Importar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-xs"
                onClick={() => {
                  setEditingTheme(null)
                  setEditorOpen(true)
                }}
                title="Criar tema do zero (editor completo)"
              >
                <Plus className="h-3.5 w-3.5" /> Novo
              </Button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {themes.map((t) => {
              const active = t.id === themeId
              const isTeam = t.origin === 'team'
              const canExport = t.source === 'custom' && Boolean(t.colors)
              return (
                <div
                  key={t.id}
                  className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    active ? 'bg-accent' : 'hover:bg-muted/60'
                  }`}
                  // Pré-visualização ao passar o mouse: aplica sem confirmar
                  onMouseEnter={() => !active && onStartPreview?.(t.id)}
                  onMouseLeave={() => onCancelPreview?.()}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(t)}
                    className="flex flex-1 min-w-0 items-center gap-2 text-left"
                    title="Aplicar tema (clique para confirmar)"
                  >
                    {/* Swatch: prévia do tema + ponto de accent da rede social */}
                    <span
                      className="relative h-6 w-6 shrink-0 rounded-md border border-border shadow-sm"
                      style={{ background: t.preview }}
                      aria-hidden
                    >
                      {(() => {
                        const nid = (t.network || 'none') as NtwId
                        const nt =
                          nid !== 'none' ? NETWORK_THEMES[nid as keyof typeof NETWORK_THEMES] : null
                        if (!nt && !t.accentOverride) return null
                        return (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background shadow"
                            style={{
                              background: nt ? `hsl(${nt.primary})` : `hsl(${t.accentOverride})`,
                            }}
                          />
                        )
                      })()}
                    </span>
                    <span className="flex-1 min-w-0">
                      {/* PRÉVIA (mini mockup) consistente em todas as telas: o
                          mesmo card do gerenciador de Configurações, com a
                          faixa do accent da rede social ativa do tema. */}
                      {t.colors && (
                        <span className="mb-1.5 hidden group-hover:block">
                          <ThemePreviewCard theme={t} active={active} compact />
                        </span>
                      )}
                      <span className="flex items-center gap-1 truncate text-sm font-medium">
                        {t.name}
                        {isTeam && (
                          <Users
                            className="h-3 w-3 shrink-0 text-primary"
                            aria-label="Tema da equipe"
                          />
                        )}
                        {t.scope === 'personal' && t.source === 'custom' && (
                          <span className="shrink-0 rounded bg-muted px-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Só p/ mim
                          </span>
                        )}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                        {t.source === 'builtin'
                          ? 'Embutido'
                          : t.source === 'brand'
                            ? 'Marca'
                            : isTeam
                              ? `Equipe${t.ownerName ? ` · ${t.ownerName}` : ''}`
                              : t.scope === 'personal'
                                ? 'Pessoal'
                                : 'Personalizado'}
                      </span>
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>

                  {/* Escopo: compartilhar com a equipe ↔ só para mim */}
                  {t.source === 'custom' && onToggleShared && !isTeam && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onToggleShared(t.id, !t.isShared)
                        toast({
                          title: t.isShared
                            ? `Tema "${t.name}" agora é só para você`
                            : `Tema "${t.name}" compartilhado com a equipe`,
                        })
                      }}
                      className={`p-1 transition-opacity ${
                        t.isShared
                          ? 'text-primary opacity-90 hover:opacity-100'
                          : 'text-muted-foreground opacity-60 hover:opacity-100'
                      }`}
                      aria-label={
                        t.isShared
                          ? `Tornar tema ${t.name} privado (só para mim)`
                          : `Compartilhar tema ${t.name} com a equipe`
                      }
                      title={
                        t.isShared
                          ? 'Visível para a equipe (clique: só para mim)'
                          : 'Só para mim (clique: equipe)'
                      }
                    >
                      {t.isShared ? (
                        <Share2 className="h-3.5 w-3.5" />
                      ) : (
                        <Users className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}

                  {/* Exportar tema (JSON) */}
                  {canExport && (
                    <button
                      type="button"
                      onClick={() => handleExport(t)}
                      className="p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-70 hover:!opacity-100"
                      aria-label={`Exportar tema ${t.name}`}
                      title="Exportar tema (arquivo JSON)"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Editar (editor completo) */}
                  {t.source === 'custom' && !isTeam && onUpdateTheme && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTheme(t)
                        setEditorOpen(true)
                      }}
                      className="p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-70 hover:!opacity-100"
                      aria-label={`Editar tema ${t.name}`}
                      title="Editar tema"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {t.source === 'custom' && !isTeam && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustom(t.id)}
                      className="p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-70 hover:!opacity-100"
                      aria-label={`Excluir tema ${t.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
            <Separator className="my-2" />
            <NetworkThemeSubmenu
              networkId={networkId}
              onSelectNetwork={onSelectNetwork}
              onApplyNetworkAccent={onApplyNetworkAccent}
            />
            <p className="px-2 pb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <WandSparkles className="h-3 w-3 shrink-0" />
              Passe o mouse para pré-visualizar; clique para aplicar.
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Editor completo de temas (criar do zero ou editar existente) */}
      <ThemeEditorDialog
        open={editorOpen}
        onOpenChange={(v) => {
          setEditorOpen(v)
          if (!v) setEditingTheme(null)
        }}
        editing={editingTheme}
        onSubmit={handleEditorSubmit}
        isSaving={isSaving}
      />
    </>
  )
}

export default StudioThemeSwitcher
