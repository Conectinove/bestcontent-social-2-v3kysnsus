import React, { useEffect, useRef, useState } from 'react'
import { ImageOff, Loader2, Move } from 'lucide-react'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'
import { DEFAULT_CUSTOMIZATION } from '@/components/workspace/AdvancedCustomizationPanel'
import type { TextLayer } from '@/services/studio-edit-versions'
import { rasterizeEditedImage } from '@/lib/rasterize'

/**
 * Painel de comparação visual de UMA versão (pedidos 1 e 4): renderiza a
 * prévia RASTERIZADA da imagem com os ajustes daquela versão (mesmo motor
 * da exportação PNG/JPG/WebP) e aplica zoom/pan sincronizados pelo pai:
 * - botões +/− do dialog e do próprio painel;
 * - scroll do mouse;
 * - arrastar para navegar na imagem ampliada;
 * - pinça (dois dedos / dois ponteiros) no touch.
 * Sem imagem salva na versão → placeholder elegante (nunca quebra).
 */

export interface ZoomState {
  zoom: number
  x: number
  y: number
}

export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 6

export function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
}

export function clampZoomState(s: ZoomState): ZoomState {
  return { zoom: clampZoom(s.zoom), x: s.x, y: s.y }
}

/** Cache de prévias rasterizadas (key = src+settings+ratio) entre reaberturas. */
const previewCache = new Map<string, string>()

interface VersionZoomPaneProps {
  label: string
  src?: string | null
  /** Settings da versão — aplicados na rasterização (mesmo motor do export). */
  settings: Record<string, unknown> | null
  textLayers?: TextLayer[] | null
  aspectRatio?: string
  /** Estado de zoom/pan controlado pelo pai (sincronizado entre os lados). */
  view: ZoomState
  onViewChange: (next: ZoomState) => void
}

export const VersionZoomPane: React.FC<VersionZoomPaneProps> = ({
  label,
  src,
  settings,
  textLayers,
  aspectRatio,
  view,
  onViewChange,
}) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  /** Fallback CORS: a própria imagem com filtro CSS (sem rasterizar). */
  const [cssFilter, setCssFilter] = useState<string | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{ dist: number; mx: number; my: number } | null>(null)

  const settingsKey = JSON.stringify(settings ?? {})

  // Rasteriza a prévia da versão (mesmo motor do export PNG/JPG/WebP).
  useEffect(() => {
    let alive = true
    if (!src) {
      setPreview(null)
      setCssFilter(null)
      return
    }
    const key = JSON.stringify([src, settingsKey, aspectRatio || ''])
    const cached = previewCache.get(key)
    if (cached) {
      setPreview(cached)
      setCssFilter(null)
      return
    }
    setLoading(true)
    const merged = {
      ...DEFAULT_CUSTOMIZATION,
      ...((settings ?? {}) as object),
    } as AdvancedCustomizationState
    rasterizeEditedImage({
      src,
      settings: merged,
      textLayers: textLayers || undefined,
      aspectRatio: aspectRatio || undefined,
      format: 'webp',
    })
      .then((url) => {
        if (!alive) return
        previewCache.set(key, url)
        setPreview(url)
        setCssFilter(null)
      })
      .catch(() => {
        if (!alive) return
        // CORS/canvas indisponível: mostra a imagem original com filtro CSS.
        setPreview(null)
        setCssFilter(
          `brightness(${merged.brightness}%) contrast(${merged.contrast}%) saturate(${merged.saturation}%)`,
        )
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [src, settingsKey, aspectRatio])

  // Zoom pelo scroll (precisa listener nativo com passive:false).
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault()
      onViewChange(
        clampZoomState({ ...view, zoom: clampZoom(view.zoom * Math.exp(-ev.deltaY * 0.002)) }),
      )
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onViewChange, view])

  const update = (fn: (prev: ZoomState) => ZoomState) => onViewChange(clampZoomState(fn(view)))

  const handlePointerDown = (ev: React.PointerEvent) => {
    ;(ev.target as Element).setPointerCapture?.(ev.pointerId)
    pointers.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    pinchRef.current = null
  }

  const handlePointerMove = (ev: React.PointerEvent) => {
    const prev = pointers.current.get(ev.pointerId)
    if (!prev) return
    pointers.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })

    if (pointers.current.size >= 2) {
      // Pinça: distância entre os dois primeiros ponteiros define o zoom.
      const [a, b] = Array.from(pointers.current.values())
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      if (pinchRef.current) {
        const factor = dist / (pinchRef.current.dist || dist)
        const dx = mx - pinchRef.current.mx
        const dy = my - pinchRef.current.my
        update((s) => ({ zoom: s.zoom * factor, x: s.x + dx, y: s.y + dy }))
      }
      pinchRef.current = { dist, mx, my }
      return
    }

    // Arrastar (um ponteiro): pan.
    update((s) => ({ ...s, x: s.x + (ev.clientX - prev.x), y: s.y + (ev.clientY - prev.y) }))
  }

  const handlePointerUp = (ev: React.PointerEvent) => {
    pointers.current.delete(ev.pointerId)
    if (pointers.current.size < 2) pinchRef.current = null
  }

  const stepZoom = (factor: number) => {
    update((s) => ({ ...s, zoom: s.zoom * factor }))
  }

  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 gap-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide truncate">
          {label}
        </p>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => stepZoom(1 / 1.25)}
            className="w-6 h-6 rounded-md border border-border bg-background text-xs font-black leading-none hover:bg-muted"
            title="Diminuir zoom"
          >
            −
          </button>
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">
            {Math.round(view.zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => stepZoom(1.25)}
            className="w-6 h-6 rounded-md border border-border bg-background text-xs font-black leading-none hover:bg-muted"
            title="Ampliar"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onViewChange({ zoom: 1, x: 0, y: 0 })}
            className="h-6 px-1.5 rounded-md border border-border bg-background text-[10px] font-bold hover:bg-muted"
            title="Redefinir zoom"
          >
            1:1
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative h-44 sm:h-56 touch-none select-none cursor-grab active:cursor-grabbing overflow-hidden bg-background"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {preview ? (
          <img
            src={preview}
            alt={`Prévia rasterizada — ${label}`}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain will-change-transform"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
          />
        ) : cssFilter && src ? (
          <img
            src={src}
            alt={`Imagem com ajustes — ${label}`}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain will-change-transform"
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
              filter: cssFilter,
            }}
          />
        ) : loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[10px]">Rasterizando prévia…</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <ImageOff className="w-5 h-5" />
            <span className="text-[10px] text-center px-2">
              Versão sem imagem salva — só o diff textual dos ajustes.
            </span>
          </div>
        )}

        {view.zoom > 1 && (
          <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-background/80 border border-border px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground pointer-events-none">
            <Move className="w-2.5 h-2.5" /> arraste para navegar
          </div>
        )}
      </div>
    </div>
  )
}

export default VersionZoomPane
