/**
 * Editor completo de temas do Studio/MidiaViva: permite criar (ou editar) um
 * tema do zero — nome, cor primária/accent, fundo, superfície e texto — com
 * pré-visualização viva (mini mockup) e a lista das CSS vars geradas.
 * Salva na mesma coleção studio_themes (motor global use-app-theme).
 */
import { useEffect, useMemo, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ThemePreviewCard } from '@/components/studio/ThemePreviewCard'
import { hexToHslTokens } from '@/hooks/use-studio-theme'
import { NETWORK_THEME_LIST } from '@/lib/network-themes'
import { cn } from '@/lib/utils'
import type { StudioCustomColors, StudioThemeOption } from '@/hooks/use-studio-theme'

export interface ThemeEditorSubmit {
  name: string
  colors: StudioCustomColors
  network?: string | null
  scope: 'team' | 'personal'
}

interface ThemeEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tema em edição (quando null, cria um tema novo do zero). */
  editing?: StudioThemeOption | null
  onSubmit: (input: ThemeEditorSubmit) => Promise<void> | void
  isSaving?: boolean
}

const DEFAULT_COLORS: StudioCustomColors = {
  background: '#0b0b12',
  surface: '#171724',
  primary: '#8b5cf6',
  text: '#f5f5fa',
}

const COLOR_FIELDS: { key: keyof StudioCustomColors; label: string; hint: string }[] = [
  { key: 'primary', label: 'Cor primária / accent', hint: 'Botões, links e destaques' },
  { key: 'background', label: 'Cor de fundo', hint: 'Fundo geral do app' },
  { key: 'surface', label: 'Cor de superfície', hint: 'Cartões, painéis e popovers' },
  { key: 'text', label: 'Cor de texto', hint: 'Texto principal sobre fundo/superfície' },
]

function varLine(name: string, hex: string): string | null {
  const tokens = hexToHslTokens(hex)
  return tokens ? `--${name}: hsl(${tokens});` : null
}

export function ThemeEditorDialog({
  open,
  onOpenChange,
  editing = null,
  onSubmit,
  isSaving = false,
}: ThemeEditorDialogProps) {
  const [name, setName] = useState('')
  const [colors, setColors] = useState<StudioCustomColors>(DEFAULT_COLORS)
  const [network, setNetwork] = useState<string>('none')
  const [scope, setScope] = useState<'team' | 'personal'>('personal')
  const [error, setError] = useState('')

  // (Re)inicia o formulário ao abrir — cria novo ou carrega o tema em edição
  useEffect(() => {
    if (!open) return
    setError('')
    if (editing?.colors) {
      setName(editing.name)
      setColors({ ...editing.colors })
      setNetwork(editing.network || 'none')
      setScope(editing.scope === 'team' ? 'team' : 'personal')
    } else {
      setName('')
      setColors({ ...DEFAULT_COLORS })
      setNetwork('none')
      setScope('personal')
    }
  }, [open, editing])

  const previewTheme = useMemo<StudioThemeOption>(
    () => ({
      id: editing?.id || 'editor-preview',
      name: name || 'Novo tema',
      mode: (() => {
        const bg = hexToHslTokens(colors.background)
        return bg && bg.l > 50 ? 'light' : 'dark'
      })(),
      primary: '0 0% 0%',
      accent: '0 0% 0%',
      ring: '0 0% 0%',
      source: 'custom',
      preview: '',
      colors: { ...colors },
    }),
    [name, colors, editing?.id],
  )

  const cssVars = useMemo(
    () =>
      [
        varLine('primary', colors.primary),
        varLine('background', colors.background),
        varLine('card', colors.surface),
        varLine('popover', colors.surface),
        varLine('foreground', colors.text),
      ].filter((v): v is string => Boolean(v)),
    [colors],
  )

  const canSubmit = name.trim().length >= 2 && !isSaving

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Dê um nome com pelo menos 2 letras ao tema.')
      return
    }
    setError('')
    await onSubmit({
      name: name.trim().slice(0, 60),
      colors: { ...colors },
      network: network === 'none' ? null : network,
      scope,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar tema' : 'Criar tema do zero'}</DialogTitle>
          <DialogDescription>
            Defina o nome e todas as cores do tema. A pré-visualização mostra o resultado antes de
            aplicar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="theme-name">Nome do tema</Label>
            <Input
              id="theme-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Midnight Roxo"
              maxLength={60}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COLOR_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`theme-color-${field.key}`}>{field.label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    id={`theme-color-${field.key}`}
                    type="color"
                    value={colors[field.key]}
                    onChange={(e) => setColors((c) => ({ ...c, [field.key]: e.target.value }))}
                    className="h-9 w-12 rounded-md border border-border bg-transparent cursor-pointer p-0.5"
                    aria-label={field.label}
                  />
                  <Input
                    value={colors[field.key]}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v))
                        setColors((c) => ({ ...c, [field.key]: v }))
                    }}
                    className="font-mono text-xs uppercase"
                    maxLength={7}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{field.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rede social (accent)</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger aria-label="Rede social do tema">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {NETWORK_THEME_LIST.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="theme-scope">Escopo do tema</Label>
              <div className="flex h-9 items-center gap-2 rounded-md border border-border px-3">
                <Switch
                  id="theme-scope"
                  checked={scope === 'team'}
                  onCheckedChange={(v) => setScope(v ? 'team' : 'personal')}
                />
                <span className="text-xs text-muted-foreground">
                  {scope === 'team' ? 'Compartilhar com a equipe' : 'Só para mim'}
                </span>
              </div>
            </div>
          </div>

          {/* Pré-visualização viva do tema em construção */}
          <div className="space-y-1.5">
            <Label>Pré-visualização</Label>
            <ThemePreviewCard theme={previewTheme} />
          </div>

          <div className="space-y-1.5">
            <Label>CSS vars geradas</Label>
            <pre className="rounded-md bg-muted/60 border border-border p-3 text-[11px] leading-relaxed font-mono overflow-x-auto text-muted-foreground">
              {cssVars.join('\n')}
            </pre>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSaving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {editing ? 'Salvar alterações' : 'Criar tema'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Botão de acesso rápido ao editor (usado no seletor e nas Configurações). */
export function ThemeEditorTrigger({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-primary', className)}
    >
      <X className="w-3.5 h-3.5 rotate-45" /> Editor de temas
    </span>
  )
}
