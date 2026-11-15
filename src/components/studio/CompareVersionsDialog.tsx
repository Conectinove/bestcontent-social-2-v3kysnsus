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
import { VersionZoomPane, clampZoom, clampZoomState, type ZoomState } from './VersionZoomPane'
import type { TextLayer } from '@/services/studio-edit-versions'

/**
 * Comparação de versões do histórico de edições (pedidos 1 e 4):
 * - lado a lado com PRÉVIA RASTERIZADA da imagem de cada versão (mesmo motor
 *   da exportação PNG/JPG/WebP), com placeholder quando não há imagem;
 * - zoom/pan SINCRONIZADOS (mesmo estado nos dois lados) por botões +/−,
 *   scroll, arrastar e pinça;
 * - diff textual dos ajustes com as diferenças destacadas abaixo.
 */

export interface CompareVersionEntry {
  id: string
  version_label: string
  editor_name?: string
  settings?: Record<string, unknown> | null
  /** URL da imagem base da versão (preview_url/result_url do snapshot). */
  image_url?: string | null
  text_layers?: TextLayer[] | null
  aspect_ratio?: string
  created?: string
}

interface CompareVersionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Versões do histórico (ordenadas da mais recente para a mais antiga). */
  versions: CompareVersionEntry[]
  /** Estado atual do editor (comparação "versão vs. atual"). */
  currentSettings?: Record<string, unknown> | null
  /** Imagem base do estado atual (para rasterizar o lado "atual"). */
  currentImageUrl?: string | null
  /** Camadas de texto do estado atual (rasterização do lado "atual"). */
  currentTextLayers?: TextLayer[] | null
  /** Proporção atual do editor. */
  currentAspectRatio?: string
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
  vignette: 'Vinheta',
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
  currentImageUrl,
  currentTextLayers,
  currentAspectRatio,
}: CompareVersionsDialogProps) {
  const [leftId, setLeftId] = useState<string>('')
  const [rightId, setRightId] = useState<string>('')
  // Zoom/pan sincronizados: UM estado para os dois lados (pedido 1).
  const [view, setView] = useState<ZoomState>({ zoom: 1, x: 0, y: 0 })

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

  const byId = useMemo(() => {
    const map: Record<
      string,
      {
        settings: Record<string, unknown> | null
        image: string | null
        textLayers: TextLayer[] | null
        ratio: string
      } | null
    > = {}
    for (const v of versions) {
      map[v.id] = {
        settings: v.settings ?? null,
        image: v.image_url || null,
        textLayers: v.text_layers ?? null,
        ratio: v.aspect_ratio || '',
      }
    }
    if (currentSettings) {
      map['__current__'] = {
        settings: currentSettings,
        image: currentImageUrl || null,
        textLayers: currentTextLayers ?? null,
        ratio: currentAspectRatio || '',
      }
    }
    return map
  }, [versions, currentSettings, currentImageUrl, currentTextLayers, currentAspectRatio])

  const leftIdSafe = leftId || options[0]?.id || ''
  const rightIdSafe = rightId || options[1]?.id || leftIdSafe

  const left = byId[leftIdSafe] ?? null
  const right = byId[rightIdSafe] ?? null
  const rows = useMemo(
    () => (open && leftIdSafe !== rightIdSafe ? diffSettings(left?.settings, right?.settings) : []),
    [open, leftIdSafe, rightIdSafe, left, right],
  )

  const leftLabel = options.find((o) => o.id === leftIdSafe)?.label || '—'
  const rightLabel = options.find((o) => o.id === rightIdSafe)?.label || '—'

  const zoomIn = () => setView((s) => clampZoomState({ ...s, zoom: clampZoom(s.zoom * 1.25) }))
  const zoomOut = () => setView((s) => clampZoomState({ ...s, zoom: clampZoom(s.zoom / 1.25) }))
  const zoomReset = () => setView({ zoom: 1, x: 0, y: 0 })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitCompareArrows className="w-4 h-4 text-primary" />
            Comparar versões
          </DialogTitle>
          <DialogDescription>
            Prévias rasterizadas lado a lado (zoom sincronizado) + diff dos ajustes.
          </DialogDescription>
        </DialogHeader>

        {/* Prévias rasterizadas com zoom/pan sincronizado (pedidos 1 e 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <VersionZoomPane
            label={`Antes — ${leftLabel}`}
            src={left?.image}
            settings={left?.settings ?? null}
            textLayers={left?.textLayers ?? undefined}
            aspectRatio={left?.ratio || undefined}
            view={view}
            onViewChange={setView}
          />
          <VersionZoomPane
            label={`Depois — ${rightLabel}`}
            src={right?.image}
            settings={right?.settings ?? null}
            textLayers={right?.textLayers ?? undefined}
            aspectRatio={right?.ratio || undefined}
            view={view}
            onViewChange={setView}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
              Versão antes
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
              Versão depois
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

        <ScrollArea className="h-[30vh] rounded-xl border border-border">
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
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={zoomOut}
              title="Diminuir zoom"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-[10px] font-mono w-10 text-center">
              {Math.round(view.zoom * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={zoomIn}
              title="Ampliar"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={zoomReset}>
              1:1
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
