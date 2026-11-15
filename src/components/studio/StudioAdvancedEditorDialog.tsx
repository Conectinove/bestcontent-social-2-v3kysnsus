import React, { useEffect, useMemo, useRef, useState } from 'react'
import { History, Loader2, Save, Type as TypeIcon, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  AdvancedCustomizationPanel,
  AdvancedCustomizationState,
  DEFAULT_CUSTOMIZATION,
  STYLE_PRESETS,
} from '@/components/workspace/AdvancedCustomizationPanel'
import {
  ArtTextLayer,
  AspectRatioFormat,
  ASPECT_FORMATS,
} from '@/components/workspace/ProfessionalArtStudio'
import type { StudioCreationRecord } from '@/services/ai-studio'
import { EditPresetsPanel } from './EditPresetsPanel'
import { EditHistoryPanel } from './EditHistoryPanel'
import { ExportAiAdviceDialog } from './ExportAiAdviceDialog'
import { useLiveEditCollaboration } from '@/hooks/use-live-edit-collaboration'
import { saveEditVersion } from '@/services/studio-edit-versions'
import { StudioEditCommentsPanel } from './StudioEditCommentsPanel'

interface StudioAdvancedEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creation: StudioCreationRecord | null
  /** Rede/contexto da marca — vai para a IA (edit-assistant/export-advisor). */
  network?: string
  onSave: (editedPreviewUrl: string) => void
}

const WEIGHT_MAP: Record<ArtTextLayer['fontWeight'], number> = {
  normal: 400,
  semibold: 600,
  bold: 700,
  extrabold: 800,
}

/** Estilo CSS da imagem a partir do estado de customização (mesmo mecanismo do editor de posts). */
export function buildStudioImageFilter(c: AdvancedCustomizationState): string {
  return [
    `brightness(${c.brightness}%)`,
    `contrast(${c.contrast}%)`,
    `saturate(${c.saturation}%)`,
    c.blur > 0 ? `blur(${c.blur}px)` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export const StudioAdvancedEditorDialog: React.FC<StudioAdvancedEditorDialogProps> = ({
  open,
  onOpenChange,
  creation,
  network: networkProp,
  onSave,
}) => {
  const { toast } = useToast()
  const [customization, setCustomization] = useState<AdvancedCustomizationState>({
    ...DEFAULT_CUSTOMIZATION,
  })
  const [textLayers, setTextLayers] = useState<ArtTextLayer[]>([])
  const [aspectRatio, setAspectRatio] = useState<AspectRatioFormat>('16:9')
  const [isSaving, setIsSaving] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [imgReady, setImgReady] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  // Pedido 4: dialog de sugestão de IA (export-advisor) antes do download final
  const [adviceOpen, setAdviceOpen] = useState(false)

  const isImage = creation?.type === 'image' || Boolean(creation?.preview_url)
  /** Rede/contexto efetivo: prop explícita (marca) ou "studio". */
  const effectiveNetwork = networkProp || 'studio'

  /** Chave estável da mídia/post: colaboração + histórico são por mídia. */
  const targetKey = useMemo(() => {
    if (!creation) return ''
    if (creation.id) return `creation:${creation.id}`
    return `creation:${creation.title || 'sem-titulo'}:${creation.preview_url || ''}`
  }, [creation])

  // Colaboração em tempo real: outra pessoa da mesma organização salvou?
  const { remoteEdit, dismissRemoteEdit, registerOwnSave } = useLiveEditCollaboration(
    targetKey,
    open,
  )

  // Reset do estado ao abrir uma nova mídia
  useEffect(() => {
    if (open && creation) {
      setCustomization({ ...DEFAULT_CUSTOMIZATION })
      setTextLayers([])
      setImgReady(false)
      const ratio =
        creation.aspect_ratio === '9:16'
          ? '9:16'
          : creation.aspect_ratio === '1:1'
            ? '1:1'
            : creation.aspect_ratio === '4:5'
              ? '4:5'
              : '16:9'
      setAspectRatio(ratio as AspectRatioFormat)
    }
  }, [open, creation])

  const addTextLayer = () => {
    setTextLayers((prev) => [
      ...prev,
      {
        id: `tl-${Date.now()}`,
        text: 'Seu título aqui',
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: 'extrabold',
        align: 'center',
        x: 50,
        y: 50,
        bgColor: 'rgba(0,0,0,0.45)',
        bgPadding: 8,
      },
    ])
  }

  const updateTextLayer = (id: string, patch: Partial<ArtTextLayer>) => {
    setTextLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const removeTextLayer = (id: string) => {
    setTextLayers((prev) => prev.filter((l) => l.id !== id))
  }

  const applyPreset = (name: string) => {
    const preset = STYLE_PRESETS.find((p) => p.name === name)
    if (!preset) return
    setCustomization((prev) => ({ ...prev, ...preset.settings }))
    toast({
      title: `Estilo "${preset.name}" aplicado`,
      description: preset.description,
    })
  }

  const previewFilter = useMemo(() => buildStudioImageFilter(customization), [customization])

  const ratioClass =
    ASPECT_FORMATS.find((f) => f.key === aspectRatio)?.ratioClass || 'aspect-[16/9]'

  // Pedido 4: passo opcional de IA ANTES da rasterização/download final.
  const requestExportAdvice = () => setAdviceOpen(true)

  /** Exporta o resultado (imagem + filtros + overlay + textos) para um PNG via canvas. */
  const handleSave = async () => {
    if (!creation) return
    setIsSaving(true)
    try {
      const src = creation.preview_url
      let dataUrl: string | null = null

      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('load'))
          img.src = src
        })
        imgRef.current = img

        const sizes: Record<AspectRatioFormat, { w: number; h: number }> = {
          '4:5': { w: 1080, h: 1350 },
          '1:1': { w: 1080, h: 1080 },
          '9:16': { w: 1080, h: 1920 },
          '16:9': { w: 1920, h: 1080 },
        }
        const { w, h } = sizes[aspectRatio]
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('ctx')

        // Filtros de cor
        ctx.filter = buildStudioImageFilter(customization)
        // Cover
        const scale = Math.max(w / img.width, h / img.height)
        const dw = img.width * scale
        const dh = img.height * scale

        // Transform: rotação + flip + opacidade + sombra (aplicados à mídia antes do overlay)
        ctx.save()
        ctx.globalAlpha = customization.layerOpacity / 100
        if (customization.shadow > 0) {
          ctx.shadowColor = `rgba(0,0,0,${customization.shadow / 100})`
          ctx.shadowBlur = 40
          ctx.shadowOffsetY = 10
        }
        ctx.translate(w / 2, h / 2)
        ctx.rotate((customization.rotation * Math.PI) / 180)
        ctx.scale(customization.flipHorizontal ? -1 : 1, customization.flipVertical ? -1 : 1)
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
        ctx.restore()
        ctx.filter = 'none'

        // Overlay
        if (customization.overlayOpacity > 0) {
          ctx.globalAlpha = customization.overlayOpacity / 100
          ctx.fillStyle = customization.overlayColor
          ctx.fillRect(0, 0, w, h)
          ctx.globalAlpha = 1
        }

        // Vinheta
        if (customization.vignette > 0) {
          const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.75)
          grad.addColorStop(0, 'rgba(0,0,0,0)')
          grad.addColorStop(1, `rgba(0,0,0,${customization.vignette / 100})`)
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, w, h)
        }

        // Borda da arte (interna, por cima da imagem e overlays)
        if (customization.borderWidth > 0) {
          ctx.strokeStyle = customization.borderColor
          ctx.lineWidth = customization.borderWidth * 2 // metade para dentro, metade para fora
          ctx.strokeRect(0, 0, w, h)
        }

        // Gradiente da marca
        if (customization.gradientMode !== 'none') {
          const grad =
            customization.gradientMode === 'linear'
              ? ctx.createLinearGradient(0, h, w, 0)
              : ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.8)
          grad.addColorStop(0, customization.primaryColor)
          grad.addColorStop(1, customization.secondaryColor)
          ctx.globalAlpha = 0.18
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, w, h)
          ctx.globalAlpha = 1
        }

        // Camadas de texto (escala relativa à largura do canvas)
        const fontScale = w / 420
        textLayers.forEach((layer) => {
          const px = (layer.x / 100) * w
          const py = (layer.y / 100) * h
          const fontSize = layer.fontSize * fontScale
          ctx.font = `${WEIGHT_MAP[layer.fontWeight]} ${fontSize}px ${customization.fontFamily}`
          ctx.textAlign = layer.align
          ctx.textBaseline = 'middle'
          const lines = layer.text.split('\n')
          const lineHeight = fontSize * customization.lineHeight
          const totalH = lines.length * lineHeight
          lines.forEach((line, i) => {
            const y = py - totalH / 2 + i * lineHeight + lineHeight / 2
            if (layer.bgColor && line.trim()) {
              const metrics = ctx.measureText(line)
              const pad = (layer.bgPadding || 0) * fontScale
              const boxW = metrics.width + pad * 2
              let bx = px - metrics.width / 2 - pad
              if (layer.align === 'left') bx = px - pad
              if (layer.align === 'right') bx = px - metrics.width - pad
              ctx.fillStyle = layer.bgColor
              ctx.fillRect(bx, y - lineHeight / 2, boxW, lineHeight)
            }
            ctx.fillStyle = layer.color
            ctx.fillText(line, px, y)
          })
        })

        dataUrl = canvas.toDataURL('image/png')
      } catch (e) {
        // Canvas/CORS indisponível: salva o estado visual sem rasterizar
        console.warn('[StudioAdvancedEditorDialog] rasterização indisponível:', e)
        dataUrl = null
      }

      onSave(dataUrl || creation.preview_url)

      // Histórico: cada salvamento vira uma versão restaurável (migration 0103)
      saveEditVersion({
        targetKey,
        title: creation.title || '',
        settings: customization,
      })
        .then((v) => {
          if (v) {
            registerOwnSave(v.id)
            setHistoryRefreshKey((k) => k + 1)
          }
        })
        .catch(() => {})

      toast({
        title: 'Edição avançada aplicada!',
        description: dataUrl
          ? 'A mídia editada foi salva e substitui a versão original.'
          : 'Os ajustes foram aplicados à mídia selecionada.',
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  if (!creation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-(--breakpoint-2xl) w-[96vw] max-h-[92vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          {/* Aviso de edição remota (colaboração em tempo real) */}
          {remoteEdit && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
              <Users className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-foreground/90">
                <b>{remoteEdit.userName}</b> editou esta arte agora.
              </span>
              <div className="flex-1" />
              <Button
                size="sm"
                onClick={() => {
                  if (remoteEdit.payload) {
                    setCustomization({ ...DEFAULT_CUSTOMIZATION, ...remoteEdit.payload })
                  }
                  dismissRemoteEdit()
                }}
                className="h-7 px-2 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white"
              >
                Atualizar agora
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissRemoteEdit}
                className="h-7 px-2 text-[11px] font-bold"
                title="Manter meu trabalho em andamento"
              >
                Manter o meu
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground uppercase text-[10px] font-black">
              Edição Avançada da Arte
            </Badge>
            <span className="text-xs text-muted-foreground truncate">{creation.title}</span>
          </div>
          <DialogTitle className="font-black text-xl font-heading">
            Refine a mídia gerada no Studio
          </DialogTitle>
          <DialogDescription className="text-xs">
            Mesmo mecanismo do editor de posts: filtros, gradientes, presets de estilo, proporção e
            camadas de texto sobre a arte.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">
          {/* Preview ao vivo */}
          <div className="space-y-3">
            {/* Comentários da colaboração em tempo real (migration 0108) */}
            {targetKey && (
              <StudioEditCommentsPanel
                targetKey={targetKey}
                materialLabel={creation.title || 'Mídia'}
              />
            )}
            <div
              className={`relative w-full ${ratioClass} rounded-2xl overflow-hidden bg-muted border border-border`}
            >
              {isImage ? (
                <img
                  src={creation.preview_url}
                  alt={creation.title}
                  onLoad={() => setImgReady(true)}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: previewFilter }}
                />
              ) : (
                <video
                  src={creation.preview_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: previewFilter }}
                  controls
                  muted
                />
              )}

              {/* Overlay + vinheta + gradiente (mesma composição do editor de posts) */}
              {customization.overlayOpacity > 0 && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: customization.overlayColor,
                    opacity: customization.overlayOpacity / 100,
                  }}
                />
              )}
              {customization.vignette > 0 && (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,${customization.vignette / 100}) 100%)`,
                  }}
                />
              )}
              {customization.gradientMode !== 'none' && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background:
                      customization.gradientMode === 'linear'
                        ? `linear-gradient(to top right, ${customization.primaryColor}, ${customization.secondaryColor})`
                        : `radial-gradient(circle at center, ${customization.primaryColor}, ${customization.secondaryColor})`,
                  }}
                />
              )}

              {/* Camadas de texto */}
              {textLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="absolute whitespace-pre-wrap"
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    transform: 'translate(-50%, -50%)',
                    textAlign: layer.align,
                    color: layer.color,
                    fontWeight: WEIGHT_MAP[layer.fontWeight],
                    fontSize: `${layer.fontSize}px`,
                    fontFamily: customization.fontFamily,
                    letterSpacing: `${customization.letterSpacing}px`,
                    lineHeight: customization.lineHeight,
                    backgroundColor: layer.bgColor || 'transparent',
                    padding: layer.bgColor ? `${layer.bgPadding || 0}px` : 0,
                    borderRadius: 6,
                    maxWidth: '90%',
                  }}
                >
                  {layer.text}
                </div>
              ))}

              {!imgReady && isImage && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>

            {/* Proporção */}
            <div className="flex flex-wrap gap-2">
              {ASPECT_FORMATS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setAspectRatio(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    aspectRatio === f.key
                      ? 'border-foreground bg-muted text-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Presets de estilo */}
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p.name)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Painel de controles (mesmo do editor de posts) */}
          <div className="space-y-3">
            <AdvancedCustomizationPanel
              customization={customization}
              onChange={setCustomization}
              onReset={() => setCustomization({ ...DEFAULT_CUSTOMIZATION })}
              platform="studio"
              caption={creation.prompt || ''}
              hasMedia={isImage}
            />

            {/* Presets de edição salvos por usuário (migration 0101) */}
            <EditPresetsPanel
              current={customization}
              onApply={(next) => setCustomization({ ...DEFAULT_CUSTOMIZATION, ...next })}
            />

            {/* Histórico de versões + Assistente de Edição (IA nativa) */}
            {targetKey && (
              <EditHistoryPanel
                targetKey={targetKey}
                title={creation.title || ''}
                current={customization}
                onRestore={(next) => setCustomization({ ...DEFAULT_CUSTOMIZATION, ...next })}
                refreshKey={historyRefreshKey}
                network={effectiveNetwork}
              />
            )}

            {/* Camadas de texto */}
            <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
                  <TypeIcon className="w-3.5 h-3.5 text-primary" />
                  Textos sobre a arte
                </span>
                <Button size="sm" variant="outline" onClick={addTextLayer} className="h-7 text-xs">
                  + Texto
                </Button>
              </div>

              {textLayers.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Nenhum texto. Clique em “+ Texto” para adicionar título ou legenda sobre a mídia.
                </p>
              )}

              {textLayers.map((layer) => (
                <div key={layer.id} className="rounded-xl border border-border/60 p-2 space-y-2">
                  <Input
                    value={layer.text}
                    onChange={(e) => updateTextLayer(layer.id, { text: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Texto da camada"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      type="color"
                      value={layer.color}
                      onChange={(e) => updateTextLayer(layer.id, { color: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0.5"
                      title="Cor do texto"
                    />
                    {(['normal', 'semibold', 'bold', 'extrabold'] as const).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => updateTextLayer(layer.id, { fontWeight: w })}
                        className={`px-1.5 h-7 rounded text-[10px] font-bold border ${
                          layer.fontWeight === w
                            ? 'border-foreground bg-muted text-foreground'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {w === 'normal' ? 'N' : w === 'semibold' ? 'SB' : w === 'bold' ? 'B' : 'XB'}
                      </button>
                    ))}
                    <input
                      type="range"
                      min={12}
                      max={72}
                      value={layer.fontSize}
                      onChange={(e) =>
                        updateTextLayer(layer.id, { fontSize: Number(e.target.value) })
                      }
                      className="flex-1 min-w-[60px] accent-primary"
                      title="Tamanho"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-1.5 text-destructive hover:text-destructive"
                      onClick={() => removeTextLayer(layer.id)}
                      title="Remover camada"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={layer.x}
                      onChange={(e) => updateTextLayer(layer.id, { x: Number(e.target.value) })}
                      className="flex-1 accent-primary"
                      title="Posição horizontal"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={layer.y}
                      onChange={(e) => updateTextLayer(layer.id, { y: Number(e.target.value) })}
                      className="flex-1 accent-purple-600"
                      title="Posição vertical"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={requestExportAdvice}
              disabled={isSaving}
              className="w-full rounded-full font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Aplicando ajustes…' : 'Salvar mídia editada'}
            </Button>
          </div>
        </div>

        {/* Pedido 4: IA (export-advisor) antes do download final */}
        <ExportAiAdviceDialog
          open={adviceOpen}
          onOpenChange={setAdviceOpen}
          network={effectiveNetwork}
          contentType={creation.title || 'mídia editada'}
          settings={customization}
          confirmLabel="Confirmar e salvar mídia"
          onConfirm={handleSave}
        />
      </DialogContent>
    </Dialog>
  )
}

export default StudioAdvancedEditorDialog
