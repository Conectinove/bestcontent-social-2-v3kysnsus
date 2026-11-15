import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Loader2,
  Save,
  Type as TypeIcon,
  FlipHorizontal,
  FlipVertical,
  LayoutTemplate,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  AdvancedCustomizationPanel,
  AdvancedCustomizationState,
  DEFAULT_CUSTOMIZATION,
} from '@/components/workspace/AdvancedCustomizationPanel'
import { Slider } from '@/components/ui/slider'

interface SecondBrainAdvancedImageEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  imageUrl: string | null
  /** Estado previamente salvo (reabrir o item restaura os ajustes). */
  initialCustomization?: Partial<AdvancedCustomizationState> | null
  onSave: (result: {
    editedUrl: string | null
    filter: string
    customization: AdvancedCustomizationState
  }) => void
  /** Salva a composição atual como modelo de mídia (studio_edit_presets). */
  onSaveAsTemplate?: (settings: AdvancedCustomizationState) => void
}

/** Mesmo filtro CSS do motor do Studio (buildStudioImageFilter), local para não acoplar. */
export function buildBrainImageFilter(c: AdvancedCustomizationState): string {
  return [
    `brightness(${c.brightness}%)`,
    `contrast(${c.contrast}%)`,
    `saturate(${c.saturation}%)`,
    c.blur > 0 ? `blur(${c.blur}px)` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

const DEFAULT_STATE: AdvancedCustomizationState = {
  ...DEFAULT_CUSTOMIZATION,
  gradientMode: 'none',
  overlayOpacity: 0,
}

/**
 * Edição Avançada de imagens do Segundo Cérebro.
 * Reusa o motor AdvancedCustomizationPanel (filtros, ajustes, presets) já usado
 * no Studio/community/brand-kit — não cria um motor novo. A rasterização final
 * é feita em canvas (filtros, rotação/flip, vinheta, overlay, borda e texto).
 */
export const SecondBrainAdvancedImageEditor: React.FC<SecondBrainAdvancedImageEditorProps> = ({
  open,
  onOpenChange,
  title,
  imageUrl,
  initialCustomization,
  onSave,
  onSaveAsTemplate,
}) => {
  const { toast } = useToast()
  const [customization, setCustomization] = useState<AdvancedCustomizationState>(DEFAULT_STATE)
  const [overlayTitle, setOverlayTitle] = useState('')
  const [overlaySubtitle, setOverlaySubtitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [imgReady, setImgReady] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  // Chave para forçar remontagem do <img> (cache do browser ignora mudança só de src igual)
  const [reloadKey, setReloadKey] = useState(0)

  // Reset/restauração ao abrir
  useEffect(() => {
    if (open) {
      setCustomization({ ...DEFAULT_STATE, ...(initialCustomization || {}) })
      setOverlayTitle('')
      setOverlaySubtitle('')
      setImgReady(false)
      setReloadKey((k) => k + 1)
    }
  }, [open, initialCustomization])

  const previewFilter = useMemo(() => buildBrainImageFilter(customization), [customization])

  const handleSave = () => {
    const img = imgRef.current
    if (!img || !imgReady) {
      toast({
        title: 'Imagem não carregada',
        description: 'Aguarde o carregamento antes de salvar.',
        variant: 'destructive',
      })
      return
    }
    setIsSaving(true)
    try {
      const c = customization
      const rot = ((c.rotation % 360) + 360) % 360
      const swap = rot === 90 || rot === 270
      const maxW = 1600
      const scale = Math.min(1, maxW / (swap ? img.naturalHeight : img.naturalWidth))
      const w = Math.round((swap ? img.naturalHeight : img.naturalWidth) * scale)
      const h = Math.round((swap ? img.naturalWidth : img.naturalHeight) * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas')

      ctx.filter = previewFilter || 'none'
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate((rot * Math.PI) / 180)
      ctx.scale(c.flipHorizontal ? -1 : 1, c.flipVertical ? -1 : 1)
      const dw = swap ? h : w
      const dh = swap ? w : h
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
      ctx.restore()
      ctx.filter = 'none'

      // Overlay de cor
      if (c.overlayOpacity > 0) {
        ctx.globalAlpha = c.overlayOpacity / 100
        ctx.fillStyle = c.overlayColor
        ctx.fillRect(0, 0, w, h)
        ctx.globalAlpha = 1
      }

      // Vinheta (o motor guarda no próprio estado)
      if (c.vignette > 0) {
        const grad = ctx.createRadialGradient(
          w / 2,
          h / 2,
          Math.min(w, h) * 0.35,
          w / 2,
          h / 2,
          Math.max(w, h) * 0.75,
        )
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(1, `rgba(0,0,0,${c.vignette / 100})`)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      // Barra de gradiente (quando ativa)
      if (c.gradientMode === 'linear') {
        const grad = ctx.createLinearGradient(0, h, w, 0)
        grad.addColorStop(0, c.primaryColor)
        grad.addColorStop(1, c.secondaryColor)
        ctx.globalAlpha = 0.55
        ctx.fillStyle = grad
        ctx.fillRect(0, Math.round(h * 0.72), w, Math.round(h * 0.28))
        ctx.globalAlpha = 1
      }

      // Texto sobreposto (título + subtítulo)
      if (overlayTitle.trim() || overlaySubtitle.trim()) {
        ctx.textAlign =
          c.textAlign === 'left' ? 'left' : c.textAlign === 'right' ? 'right' : 'center'
        const pad = Math.round(Math.min(w, h) * 0.06)
        const anchorX = c.textAlign === 'left' ? pad : c.textAlign === 'right' ? w - pad : w / 2
        ctx.shadowColor = 'rgba(0,0,0,0.65)'
        ctx.shadowBlur = 8
        let y = h - pad
        if (overlaySubtitle.trim()) {
          ctx.font = `600 ${Math.max(14, Math.round(h * 0.035))}px ${c.fontFamily}`
          const subLines = wrapText(ctx, overlaySubtitle.trim(), w - pad * 2).reverse()
          ctx.fillStyle = 'rgba(255,255,255,0.85)'
          for (const l of subLines) {
            ctx.fillText(l, anchorX, y)
            y -= Math.max(18, Math.round(h * 0.045))
          }
        }
        if (overlayTitle.trim()) {
          ctx.font = `${c.fontWeight === 'extrabold' ? 800 : c.fontWeight === 'bold' ? 700 : 400} ${Math.max(20, Math.round(h * 0.06))}px ${c.fontFamily}`
          const titleLines = wrapText(ctx, overlayTitle.trim(), w - pad * 2).reverse()
          ctx.fillStyle = '#ffffff'
          for (const l of titleLines) {
            ctx.fillText(l, anchorX, y)
            y -= Math.round(h * 0.075)
          }
        }
        ctx.shadowBlur = 0
      }

      // Borda
      if (c.borderWidth > 0) {
        ctx.strokeStyle = c.borderColor
        ctx.lineWidth = Math.max(2, (c.borderWidth / 100) * Math.min(w, h) * 0.5)
        ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth)
      }

      const editedUrl = canvas.toDataURL('image/jpeg', 0.9)
      onSave({ editedUrl, filter: previewFilter, customization: c })
      onOpenChange(false)
    } catch {
      // Canvas contaminado (imagem sem CORS, ex. thumbnail de Drive) — salva a receita
      // de ajustes, que é aplicada como filtro CSS na exibição do item.
      onSave({ editedUrl: null, filter: previewFilter, customization })
      toast({
        title: 'Ajustes salvos (modo leve)',
        description:
          'A imagem não pôde ser rasterizada (fonte sem CORS). Os ajustes ficam salvos e aplicados na exibição.',
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setCustomization(DEFAULT_STATE)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[calc(100vw-1rem)] sm:w-full max-h-[92vh] overflow-y-auto bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg text-white">
            Edição Avançada
            <Badge
              variant="outline"
              className="text-[10px] font-mono nb-accent-border nb-accent-text max-w-full"
            >
              <span className="truncate max-w-[240px]">{title || 'Imagem'}</span>
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Filtros, ajustes, presets e texto sobreposto — o mesmo motor de edição usado no Studio.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Preview */}
          <div className="lg:col-span-3 space-y-3 min-w-0">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex items-center justify-center min-h-[180px] p-2">
              {imageUrl ? (
                <img
                  key={reloadKey}
                  ref={imgRef}
                  src={imageUrl}
                  alt={title}
                  crossOrigin="anonymous"
                  onLoad={() => setImgReady(true)}
                  onError={() => setImgReady(false)}
                  style={{ filter: previewFilter }}
                  className="max-h-[42vh] w-auto max-w-full object-contain rounded-lg"
                />
              ) : (
                <div className="p-10 text-center text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin opacity-60" />
                  Carregando imagem…
                </div>
              )}
            </div>

            {/* Texto sobreposto */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <TypeIcon className="w-3.5 h-3.5 nb-accent-text" /> Texto sobreposto
              </p>
              <input
                value={overlayTitle}
                onChange={(e) => setOverlayTitle(e.target.value)}
                placeholder="Título (ex.: Destaque da semana)"
                className="w-full h-9 rounded-lg bg-slate-800/60 border border-slate-700 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-slate-500"
              />
              <input
                value={overlaySubtitle}
                onChange={(e) => setOverlaySubtitle(e.target.value)}
                placeholder="Subtítulo (opcional)"
                className="w-full h-8 rounded-lg bg-slate-800/60 border border-slate-700 px-3 text-[11px] text-slate-300 placeholder:text-slate-500 focus:outline-hidden focus:border-slate-500"
              />
            </div>

            {/* Flips */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setCustomization((c) => ({ ...c, flipHorizontal: !c.flipHorizontal }))
                }
                className="h-8 border-slate-700 text-slate-300 hover:text-white gap-1.5"
                title="Espelhar horizontal"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Horizontal</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCustomization((c) => ({ ...c, flipVertical: !c.flipVertical }))}
                className="h-8 border-slate-700 text-slate-300 hover:text-white gap-1.5"
                title="Espelhar vertical"
              >
                <FlipVertical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vertical</span>
              </Button>
            </div>
          </div>

          {/* Painel do motor (filtros/ajustes/presets) */}
          <div className="lg:col-span-2 min-w-0">
            <AdvancedCustomizationPanel
              customization={customization}
              onChange={setCustomization}
              onReset={handleReset}
              platform="second-brain"
              caption={overlayTitle || title}
              hasMedia={Boolean(imageUrl)}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs text-slate-400 hover:text-white"
          >
            Cancelar
          </Button>
          {onSaveAsTemplate && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onSaveAsTemplate(customization)}
              className="h-9 border-slate-700 text-slate-300 hover:text-white text-xs gap-1.5 rounded-xl"
              title="Guardar composição atual para aplicar em outra mídia"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              Salvar como modelo
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !imgReady}
            className="h-9 nb-accent-grad text-white font-bold text-xs gap-1.5 rounded-xl"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvar no item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SecondBrainAdvancedImageEditor
