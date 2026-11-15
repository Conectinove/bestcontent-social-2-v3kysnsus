import { useEffect, useState } from 'react'
import { Palette, Plus, Trash2, Check, Users, Share2, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import type { StudioThemeOption, StudioCustomColors } from '@/hooks/use-studio-theme'
import { NETWORK_THEME_LIST, type NetworkThemeId } from '@/lib/network-themes'

interface StudioThemeSwitcherProps {
  themes: StudioThemeOption[]
  themeId: string
  onSelect: (id: string) => void
  onCreateCustom: (opts: {
    name: string
    colors: StudioCustomColors
    network?: NetworkThemeId
    isShared?: boolean
  }) => Promise<void> | void
  onDeleteCustom: (id: string) => Promise<void> | void
  /** Rede social escolhida (variação de accent) — 'none' = sem rede. */
  networkId?: NetworkThemeId
  onSelectNetwork?: (id: NetworkThemeId) => void
  /** Marca/desmarca um tema salvo no banco como compartilhado com a equipe. */
  onToggleShared?: (id: string, isShared: boolean) => Promise<void> | void
  isSaving?: boolean
}

const COLOR_FIELDS: Array<{
  key: keyof StudioCustomColors
  label: string
  defaultValue: string
}> = [
  { key: 'background', label: 'Fundo', defaultValue: '#09090b' },
  { key: 'surface', label: 'Superfície (cards)', defaultValue: '#18181b' },
  { key: 'primary', label: 'Cor primária', defaultValue: '#7c3aed' },
  { key: 'text', label: 'Texto', defaultValue: '#fafafa' },
]

const emptyColors: StudioCustomColors = {
  background: '#09090b',
  surface: '#18181b',
  primary: '#7c3aed',
  text: '#fafafa',
}

export const StudioThemeSwitcher: React.FC<StudioThemeSwitcherProps> = ({
  themes,
  themeId,
  onSelect,
  onCreateCustom,
  onDeleteCustom,
  networkId = 'none',
  onSelectNetwork,
  onToggleShared,
  isSaving = false,
}) => {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('Meu tema')
  const [colors, setColors] = useState<StudioCustomColors>(emptyColors)
  const [newNetwork, setNewNetwork] = useState<NetworkThemeId>('none')
  const [isShared, setIsShared] = useState(false)

  // Reabre o formulário sempre que o popover reabre, pronto para criar outro tema
  useEffect(() => {
    if (!open) setCreating(false)
  }, [open])

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: 'Dê um nome ao tema', variant: 'destructive' })
      return
    }
    await onCreateCustom({
      name,
      colors,
      network: newNetwork,
      isShared,
    })
    toast({
      title: `Tema "${name.trim()}" criado e aplicado`,
      description: isShared ? 'Compartilhado com a equipe (salvo no banco).' : undefined,
    })
    setCreating(false)
    setName('Meu tema')
    setColors(emptyColors)
    setNewNetwork('none')
    setIsShared(false)
    setOpen(false)
  }

  return (
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
          {!creating && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs"
              onClick={() => setCreating(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Novo
            </Button>
          )}
        </div>

        {creating ? (
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="studio-theme-name" className="text-xs">
                Nome do tema
              </Label>
              <Input
                id="studio-theme-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Meu tema roxo"
                maxLength={24}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label
                    htmlFor={`studio-color-${f.key}`}
                    className="text-[11px] text-muted-foreground"
                  >
                    {f.label}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id={`studio-color-${f.key}`}
                      type="color"
                      value={colors[f.key]}
                      onChange={(e) => setColors((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                      aria-label={f.label}
                    />
                    <Input
                      value={colors[f.key]}
                      onChange={(e) => setColors((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="h-8 font-mono text-[11px] px-2"
                      maxLength={7}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Rede social: variação de accent do tema (opcional) */}
            {onSelectNetwork && (
              <div className="space-y-1.5">
                <Label htmlFor="studio-theme-network" className="text-xs">
                  Rede social (variação de cor)
                </Label>
                <select
                  id="studio-theme-network"
                  value={newNetwork}
                  onChange={(e) => setNewNetwork(e.target.value as NetworkThemeId)}
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="none">Sem rede (tema neutro)</option>
                  {NETWORK_THEME_LIST.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Compartilhar com a equipe (persistido no banco) */}
            {onToggleShared && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5 shrink-0" /> Compartilhar com a equipe
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Salvo no banco; colegas da mesma organização veem na lista.
                  </p>
                </div>
                <Switch
                  checked={isShared}
                  onCheckedChange={setIsShared}
                  aria-label="Compartilhar com a equipe"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
                Voltar
              </Button>
              <Button type="button" size="sm" onClick={handleCreate} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="mr-1 h-3.5 w-3.5" />
                )}
                {isSaving ? 'Salvando...' : 'Criar e aplicar'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto p-2">
            {themes.map((t) => {
              const active = t.id === themeId
              const isTeam = t.origin === 'team'
              return (
                <div
                  key={t.id}
                  className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    active ? 'bg-accent' : 'hover:bg-muted/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(t.id)}
                    className="flex flex-1 min-w-0 items-center gap-2 text-left"
                  >
                    <span
                      className="h-6 w-6 shrink-0 rounded-md border border-border shadow-sm"
                      style={{ background: t.preview }}
                      aria-hidden
                    />
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1 truncate text-sm font-medium">
                        {t.name}
                        {isTeam && (
                          <Users
                            className="h-3 w-3 shrink-0 text-primary"
                            aria-label="Tema da equipe"
                          />
                        )}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                        {t.source === 'builtin'
                          ? 'Embutido'
                          : t.source === 'brand'
                            ? 'Marca'
                            : isTeam
                              ? `Equipe${t.ownerName ? ` · ${t.ownerName}` : ''}`
                              : 'Personalizado'}
                      </span>
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                  {t.source === 'custom' && onToggleShared && !isTeam && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onToggleShared(t.id, !t.isShared)
                        toast({
                          title: t.isShared
                            ? `Tema "${t.name}" agora é privado`
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
                          ? `Descompartilhar tema ${t.name}`
                          : `Compartilhar tema ${t.name} com a equipe`
                      }
                      title={
                        t.isShared
                          ? 'Privado (clique para compartilhar)'
                          : 'Compartilhar com a equipe'
                      }
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {t.source === 'custom' && !isTeam && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustom(t.id)}
                      className="opacity-60 hover:opacity-100 text-muted-foreground hover:text-destructive p-1"
                      aria-label={`Excluir tema ${t.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
            <Separator className="my-2" />
            <p className="px-2 pb-1 text-[11px] text-muted-foreground">
              Dica: crie um tema com as cores da sua marca em “Novo”.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default StudioThemeSwitcher
