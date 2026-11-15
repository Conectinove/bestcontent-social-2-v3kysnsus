import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'
import { buildStudioImageFilter } from '@/components/studio/StudioAdvancedEditorDialog'
import type { TextLayer } from '@/services/studio-edit-versions'

/** Reexporta o filtro do motor (mesmo mecanismo do editor) para os chamadores. */
export { buildStudioImageFilter }

export interface RasterizeInput {
  /** URL da imagem base (http ou data:). */
  src: string
  settings: AdvancedCustomizationState
  textLayers?: TextLayer[] | null
  aspectRatio?: '16:9' | '1:1' | '4:5' | '9:16' | string
  /** Formato de saída do canvas. */
  format?: 'png' | 'jpeg' | 'webp'
}

export type RasterizeFormat = NonNullable<RasterizeInput['format']>

export const EXPORT_FORMATS: Array<{
  key: RasterizeFormat
  label: string
  mime: string
  ext: string
}> = [
  { key: 'png', label: 'PNG', mime: 'image/png', ext: 'png' },
  { key: 'jpeg', label: 'JPG', mime: 'image/jpeg', ext: 'jpg' },
  { key: 'webp', label: 'WebP', mime: 'image/webp', ext: 'webp' },
]

export function mimeForFormat(format: RasterizeFormat): string {
  return EXPORT_FORMATS.find((f) => f.key === format)?.mime || 'image/png'
}

export function extForFormat(format: RasterizeFormat): string {
  return EXPORT_FORMATS.find((f) => f.key === format)?.ext || 'png'
}

/** Converte um data URL (ou blob URL) em File para upload. */
export function dataUrlToFile(dataUrl: string, fileName: string): File | null {
  try {
    const [meta, b64] = dataUrl.split(',')
    if (!b64) return null
    const mimeMatch = meta.match(/data:([^;]+)/)
    const mime = mimeMatch?.[1] || 'image/png'
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new File([bytes], fileName, { type: mime })
  } catch {
    return null
  }
}

/**
 * Rasteriza a imagem + settings da Edição Avançada num canvas e devolve
 * um data URL no formato pedido (PNG/JPG/WebP). Mesmo desenho do
 * handleSave do StudioAdvancedEditorDialog (padrão da casa).
 * Lança erro se o canvas/CORS não permitir — o chamador tem fallback.
 */
export async function rasterizeEditedImage(input: RasterizeInput): Promise<string> {
  const { src, settings, textLayers, aspectRatio } = input
  const format: RasterizeFormat = input.format || 'png'
  const mime = mimeForFormat(format)

  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Falha ao carregar a imagem'))
    img.src = src
  })

  const sizes: Record<string, { w: number; h: number }> = {
    '4:5': { w: 1080, h: 1350 },
    '1:1': { w: 1080, h: 1080 },
    '9:16': { w: 1080, h: 1920 },
    '16:9': { w: 1920, h: 1080 },
  }
  const { w, h } = sizes[aspectRatio || '1:1'] || sizes['1:1']

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível neste navegador')

  // Filtros de cor
  ctx.filter = buildStudioImageFilter(settings)
  // Cover
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale

  // Transform: rotação + flip + opacidade + sombra
  ctx.save()
  ctx.globalAlpha = settings.layerOpacity / 100
  if (settings.shadow > 0) {
    ctx.shadowColor = `rgba(0,0,0,${settings.shadow / 100})`
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 10
  }
  ctx.translate(w / 2, h / 2)
  ctx.rotate((settings.rotation * Math.PI) / 180)
  ctx.scale(settings.flipHorizontal ? -1 : 1, settings.flipVertical ? -1 : 1)
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
  ctx.restore()
  ctx.filter = 'none'

  // Overlay
  if (settings.overlayOpacity > 0) {
    ctx.globalAlpha = settings.overlayOpacity / 100
    ctx.fillStyle = settings.overlayColor
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
  }

  // Vinheta
  if (settings.vignette > 0) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.75)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${settings.vignette / 100})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  // Borda da arte
  if (settings.borderWidth > 0) {
    ctx.strokeStyle = settings.borderColor
    ctx.lineWidth = settings.borderWidth * 2
    ctx.strokeRect(0, 0, w, h)
  }

  // Gradiente da marca
  if (settings.gradientMode !== 'none') {
    const grad =
      settings.gradientMode === 'linear'
        ? ctx.createLinearGradient(0, h, w, 0)
        : ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.8)
    grad.addColorStop(0, settings.primaryColor)
    grad.addColorStop(1, settings.secondaryColor)
    ctx.globalAlpha = 0.18
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
  }

  // Camadas de texto (escala relativa à largura do canvas)
  const WEIGHT_MAP: Record<string, number> = {
    normal: 400,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
  const fontScale = w / 420
  ;(textLayers || []).forEach((layer) => {
    const px = (layer.x / 100) * w
    const py = (layer.y / 100) * h
    const fontSize = layer.fontSize * fontScale
    ctx.font = `${WEIGHT_MAP[layer.fontWeight as string] || 400} ${fontSize}px ${settings.fontFamily}`
    ctx.textAlign = (layer.align as CanvasTextAlign) || 'center'
    ctx.textBaseline = 'middle'
    const lines = String(layer.text || '').split('\n')
    const lineHeight = fontSize * settings.lineHeight
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

  return canvas.toDataURL(mime, format === 'jpeg' ? 0.92 : undefined)
}

/**
 * Re-rasteriza uma URL editada existente (http/data:) num canvas no formato
 * pedido (PNG/JPG/WebP), sem reaplicar settings — usado no export da
 * BrandKitPage. Fallback CORS fica no chamador.
 */
export async function rasterizeImageToFormat(
  src: string,
  format: RasterizeFormat,
): Promise<string> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Falha ao carregar a imagem'))
    img.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível neste navegador')
  if (format === 'jpeg') {
    // JPG não tem transparência: fundo branco.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL(mimeForFormat(format), format === 'jpeg' ? 0.92 : undefined)
}

/**
 * Baixa um data URL (canvas) no formato pedido via anchor.
 */
export async function downloadRasterized(
  dataUrl: string,
  filename: string,
  format: RasterizeFormat,
): Promise<void> {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
