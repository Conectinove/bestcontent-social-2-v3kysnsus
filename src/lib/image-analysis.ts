/**
 * Análise leve de imagem NO CLIENTE para os filtros avançados da grade de
 * mídias do Segundo Cérebro (abas locais: Documento, Acervo, Uploads,
 * Biblioteca, Favoritos):
 *  - orientação: derivada das dimensões naturais (paisagem/retrato/quadrada);
 *  - cor dominante: amostragem em <canvas> (imagem cross-origin sem CORS só
 *    fornece orientação — a cor fica null e o filtro a ignora).
 * Resultados são cacheados em memória (URL → análise) para não reler a mesma
 * imagem a cada render. Sem dependências novas.
 */
import type { SecondBrainColorFilter } from '@/services/second-brain-media'

export interface ImageAnalysis {
  orientation: 'square' | 'landscape' | 'portrait'
  color: SecondBrainColorFilter | null
}

export interface AnalyzedThumb {
  w: number
  h: number
  dom: string | null // cor dominante em hex, null quando indeterminada (CORS etc.)
}

type ProgressFn = (next: Record<string, AnalyzedThumb>) => void

const cache = new Map<string, AnalyzedThumb>()

/** Paleta estendida (~20 cores) — mesma lista de COLOR_OPTIONS em second-brain-media. */
const PALETTE: Array<[SecondBrainColorFilter, string]> = [
  ['black', '#1a1a1a'],
  ['white', '#f5f5f5'],
  ['gray', '#9ca3af'],
  ['red', '#dc2626'],
  ['orange', '#f97316'],
  ['yellow', '#eab308'],
  ['green', '#16a34a'],
  ['blue', '#2563eb'],
  ['purple', '#9333ea'],
  ['pink', '#ec4899'],
  ['brown', '#92400e'],
  ['beige', '#d6c7a1'],
  ['navy', '#1e3a5f'],
  ['teal', '#0d9488'],
  ['turquoise', '#22d3ee'],
  ['gold', '#d4a017'],
  ['olive', '#6b7231'],
  ['maroon', '#7f1d1d'],
  ['cyan', '#06b6d4'],
  ['magenta', '#c026d3'],
  ['silver', '#c0c4c8'],
]

const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

/** Cor de COLOR_OPTIONS mais próxima de um hex — usada ao estender cores de stock. */
export function nearestStockColor(hex: string): SecondBrainColorFilter {
  const [r, g, b] = rgb(hex)
  let best: SecondBrainColorFilter = 'gray'
  let bestD = Infinity
  for (const [key, ref] of PALETTE) {
    const [pr, pg, pbv] = rgb(ref)
    const d = (pr - r) ** 2 + (pg - g) ** 2 + (pbv - b) ** 2
    if (d < bestD) {
      bestD = d
      best = key
    }
  }
  return best
}

/** Cor de COLOR_OPTIONS mais próxima de um hex dominante calculado no canvas. */
export function dominantColorOf(hex: string | null | undefined): SecondBrainColorFilter | null {
  if (!hex) return null
  return nearestStockColor(hex)
}

const orientationOfDims = (w: number, h: number): ImageAnalysis['orientation'] => {
  if (w <= 0 || h <= 0) return 'square'
  const ratio = w / h
  if (ratio >= 0.9 && ratio <= 1.1) return 'square'
  return ratio > 1 ? 'landscape' : 'portrait'
}

/** Orientação a partir das dimensões (fallback quando o canvas falha). */
export function orientationOf(width?: number, height?: number): ImageAnalysis['orientation'] {
  return orientationOfDims(width || 0, height || 0)
}

/**
 * Analisa um lote de thumbnails em sequência (sem saturar o browser) e
 * devolve o mapa completo via onProgress a cada conclusão. Nunca lança.
 */
export async function analyzeImagesInto(
  pending: Array<{ id: string; src: string }>,
  current: Record<string, AnalyzedThumb>,
  onProgress: ProgressFn,
): Promise<void> {
  const next = { ...current }
  for (const { id, src } of pending) {
    if (next[id]) continue
    next[id] = await analyzeOne(src)
    onProgress({ ...next })
  }
}

/** Analisa UMA imagem: dimensões naturais + cor dominante (amostra 24×24). */
async function analyzeOne(src: string): Promise<AnalyzedThumb> {
  const cached = cache.get(src)
  if (cached) return cached
  const empty: AnalyzedThumb = { w: 0, h: 0, dom: null }
  if (!src || typeof document === 'undefined') return empty

  const result = await new Promise<AnalyzedThumb>((resolve) => {
    const img = new Image()
    let settled = false
    const finish = (a: AnalyzedThumb) => {
      if (settled) return
      settled = true
      resolve(a)
    }
    // Timeout de segurança: thumbnail pesado não trava a grade.
    const timer = setTimeout(() => finish(empty), 6000)
    img.onload = () => {
      clearTimeout(timer)
      const w = img.naturalWidth
      const h = img.naturalHeight
      const base: AnalyzedThumb = { w, h, dom: null }
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 24
        canvas.height = 24
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return finish(base)
        ctx.drawImage(img, 0, 0, 24, 24)
        const data = ctx.getImageData(0, 0, 24, 24).data
        let sumR = 0
        let sumG = 0
        let sumB = 0
        let n = 0
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue // ignora transparentes
          sumR += data[i]
          sumG += data[i + 1]
          sumB += data[i + 2]
          n++
        }
        if (n === 0) return finish(base)
        const r = Math.round(sumR / n)
        const g = Math.round(sumG / n)
        const b = Math.round(sumB / n)
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
        finish({ w, h, dom: hex })
      } catch {
        // Canvas contaminado (CORS) → só dimensões.
        finish(base)
      }
    }
    img.onerror = () => {
      clearTimeout(timer)
      finish(empty)
    }
    img.crossOrigin = 'anonymous' // best-effort: falha silenciosa vira dom null
    img.src = src
  })

  cache.set(src, result)
  return result
}
