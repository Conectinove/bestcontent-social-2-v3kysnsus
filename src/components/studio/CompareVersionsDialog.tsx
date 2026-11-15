import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowRight, GitCompareArrows, Minus, Plus } from 'lucide-react'

/**
 * Comparação visual de versões do histórico de edições (pedido 2):
 * escolhe duas versões (ou versão vs. estado atual) e mostra os settings
 * lado a lado com as diferenças destacadas (mudou/adicionado/removido).
 */

export interface CompareVersionEntry {
  id: string
  version_label: string
  editor_name?: string
  settings?: Record<string, unknown> | null
  created?: string
}

interface CompareVersionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Versões do histórico (ordenadas da mais recente para a mais antiga). */
  versions: CompareVersionEntry[]
  /** Estado atual do editor (comparação "versão vs. atual"). */
  currentSettings?: Record<string, unknown> | null
}

/** Labels legíveis para os ajustes (não exibir chaves cruas). */
const SETTING_LABELS: Record<string, string> = {
  brightness: 'Brilho',
  contrast: 'Contraste',
  saturation: 'Saturação',
  blur: 'Desfoque',
  rotation: 'Rotação',
  flipHorizontal: 'Espelhar horizontal',
  flipVertical: 'Espelhar vertical',
  layerOpacity: 'Opacidade da camada',
  overlayOpacity: 'Opacidade do overlay',
  borderWidth: 'Espessura da borda',
  borderColor: 'Cor da borda',
  shadow: 'Sombra',
  gradientMode: 'Modo do gradiente',
  overlayColor: 'Cor do overlay',
  primaryColor: 'Cor primária',
  secondaryColor: 'Cor secundária',
  aspectRatio: 'Proporção',
  filter: 'Filtro',
  presetName: 'Preset',
}

const BOOL_TRUE_LABELS: Record<string, string> = { flipHorizontal: 'Sim', flipVertical: 'Sim' }

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return BOOL_TRUE_LABELS[key] ?? (value ? 'Sim' : 'Não')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

type DiffKind = 'changed' | 'added' | 'removed'

interface DiffRow {
  key: string
  kind: DiffKind
  before: unknown
  after: unknown
}

function diffSettings(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): DiffRow[] {
  const b = before ?? {}
  const a = after ?? {}
  const rows: DiffRow[] = []
  const keys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)])).sort()
  for (const key of keys) {
    const bv = b[key]
    const av = a[key]
    if (typeof bv === 'undefined' && typeof av !== 'undefined') {
      rows.push({ key, kind: 'added', before: bv, after: av })
    } else if (typeof bv !== 'undefined' && typeof av === 'undefined') {
      rows.push({ key, kind: 'removed', before: bv, after: av })
    } else if (String(formatValue(key, bv)) !== String(formatValue(key, av))) {
      rows.push({ key, kind: 'changed', before: bv, after: av })
    }
  }
  // Mudanças primeiro, depois adicionados/removidos — o que interessa no topo.
  return rows.sort((x, y) => (x.kind === 'changed' ? -1 : 0) - (y.kind === 'changed' ? -1 : 0))
}

function DiffValue({
  value,
  tone,
  diffKey,
}: {
  value: unknown
  tone: 'old' | 'new'
  diffKey: string
}) {
  const isColor = typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-mono break-all ${
        tone === 'old'
          ? 'bg-red-500/10 text-red-700 dark:text-red-300'
          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      }`}
    >
      {isColor && (
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm border border-border shrink-0"
          style={{ backgroundColor: String(value) }}
        />
      )}
      {formatValue(diffKey, value)}
    </span>
  )
}

const KIND_META: Record<DiffKind, { label: string; badge: string }> = {
  changed: {
    label: 'Mudou',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  added: {
    label: 'Adicionado',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  removed: {
    label: 'Removido',
    badge: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  },
}

export function CompareVersionsDialog({
  open,
  onOpenChange,
  versions,
  currentSettings,
}: CompareVersionsDialogProps) {
  const [leftId, setLeftId] = useState<string>('')
  const [rightId, setRightId] = useState<string>('')

  const options = useMemo(() => {
    const list = versions.map((v) => ({
      id: v.id,
      label: `${v.version_label} — ${v.editor_name || 'Autor desconhecido'}${v.created ? ` (${new Date(v.created).toLocaleDateString('pt-BR')})` : ''}`,
    }))
    if (currentSettings) {
      list.unshift({ id: '__current__', label: 'Versão atual (em edição)' })
    }
    return list
  }, [versions, currentSettings])

  const settingsById = useMemo(() => {
    const map: Record<string, Record<string, unknown> | null> = {}
    for (const v of versions) map[v.id] = v.settings ?? null
    if (currentSettings) map['__current__'] = currentSettings
    return map
  }, [versions, currentSettings])

  const leftIdSafe = leftId || options[0]?.id || ''
  const rightIdSafe = rightId || options[1]?.id || leftIdSafe

  const left = settingsById[leftIdSafe] ?? null
  const right = settingsById[rightIdSafe] ?? null
  const rows = useMemo(
    () => (open && leftIdSafe !== rightIdSafe ? diffSettings(left, right) : []),
    [open, leftIdSafe, rightIdSafe, left, right],
  )

  const leftLabel = options.find((o) => o.id === leftIdSafe)?.label || '—'
  const rightLabel = options.find((o) => o.id === rightIdSafe)?.label || '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitCompareArrows className="w-4 h-4 text-primary" />
            Comparar versões
          </DialogTitle>
          <DialogDescription>
            Escolha duas versões (ou versão vs. atual) para ver os ajustes lado a lado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
              Antes
            </p>
            <Select value={leftIdSafe} onValueChange={setLeftId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
              Depois
            </p>
            <Select value={rightIdSafe} onValueChange={setRightId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[46vh] rounded-xl border border-border">
          <div className="p-3 space-y-1.5">
            {rows.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                {leftIdSafe === rightIdSafe
                  ? 'Selecione duas versões diferentes para comparar.'
                  : 'Nenhuma diferença nos ajustes entre estas versões.'}
              </p>
            ) : (
              rows.map((row) => (
                <div
                  key={row.key}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 rounded-lg border border-border/60 px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-1.5 sm:w-44 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${KIND_META[row.kind].badge}`}>
                      {row.kind === 'changed' ? (
                        <ArrowRight className="w-3 h-3 mr-0.5" />
                      ) : row.kind === 'added' ? (
                        <Plus className="w-3 h-3 mr-0.5" />
                      ) : (
                        <Minus className="w-3 h-3 mr-0.5" />
                      )}
                      {KIND_META[row.kind].label}
                    </Badge>
                    <span className="text-xs font-semibold truncate">
                      {SETTING_LABELS[row.key] || row.key}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {row.kind !== 'added' && (
                      <DiffValue key="before" diffKey={row.key} value={row.before} tone="old" />
                    )}
                    {row.kind !== 'removed' && (
                      <DiffValue key="after" diffKey={row.key} value={row.after} tone="new" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">
            <b>{leftLabel}</b> <ArrowRight className="inline w-3 h-3 mx-0.5" /> <b>{rightLabel}</b>
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
