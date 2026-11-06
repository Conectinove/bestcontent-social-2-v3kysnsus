import { aiAction } from '@/services/ai'
import type { PostTemplate } from '@/services/post-templates'

/**
 * IA Generativa aplicada a templates.
 * Gera 2-3 variações de um modelo variando copy/gancho e direção visual
 * (paleta derivada das style_guidelines da marca/campanha quando existirem).
 * Reusa o mecanismo de IA existente (aiAction) — sem duplicar lógica de rede.
 */

export interface TemplateVariation {
  name: string
  headline: string
  subhead: string
  ctaText: string
  badgeText?: string
  direction: string
  colors?: {
    accentColor?: string
    bgColor?: string
    textColor?: string
  }
}

export interface GenerateVariationsInput {
  template: PostTemplate
  brandName?: string
  brandVoice?: string
  styleGuidelines?: string | Record<string, unknown>
}

const PALETTE_BY_DIRECTION: Record<string, { accent: string; bg: string }> = {
  'alto contraste': { accent: '#E11D48', bg: '#0B0B12' },
  'foco no produto': { accent: '#9333EA', bg: '#120B26' },
  'tom editorial': { accent: '#0EA5E9', bg: '#0A1420' },
  'energia jovem': { accent: '#F59E0B', bg: '#1A0F05' },
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function extractGuidelineColors(guidelines?: string | Record<string, unknown>): {
  accent?: string
  bg?: string
} {
  if (!guidelines) return {}
  let raw = ''
  if (typeof guidelines === 'string') raw = guidelines
  else if (guidelines.cores || guidelines.colors)
    raw = String(guidelines.cores ?? guidelines.colors)
  else raw = JSON.stringify(guidelines)

  const hexes = raw.match(/#[0-9a-fA-F]{6}/g) || []
  if (hexes.length === 0) return {}
  // accent = cor mais "viva" (heurística de saturação simples), bg = a mais escura
  const toRgb = (h: string) => {
    const v = h.slice(1)
    const n =
      v.length === 3
        ? v
            .split('')
            .map((c) => c + c)
            .join('')
        : v
    return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16))
  }
  const sat = (h: string) => {
    const [r, g, b] = toRgb(h)
    const mx = Math.max(r, g, b)
    const mn = Math.min(r, g, b)
    return mx === 0 ? 0 : (mx - mn) / mx
  }
  const lum = (h: string) => {
    const [r, g, b] = toRgb(h)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const accent = [...hexes].sort((a, b) => sat(b) - sat(a))[0]
  const bg = [...hexes].sort((a, b) => lum(a) - lum(b))[0]
  return { accent, bg }
}

function localFallback(input: GenerateVariationsInput): TemplateVariation[] {
  const base = (input.template.layout_data as Record<string, unknown>) || {}
  const headline = String(base.headline || input.template.name)
  const guidelineColors = extractGuidelineColors(input.styleGuidelines)
  const directions = Object.keys(PALETTE_BY_DIRECTION)
  return directions.map((dir, i) => ({
    name: `${input.template.name} · Var ${i + 1}`,
    headline: i === 0 ? headline : `${headline} — ${dir}`,
    subhead: `Nova direção visual: ${dir}. Copy ajustada para ${input.brandName || 'sua marca'}.`,
    ctaText: String(base.ctaText || 'SAIBA MAIS'),
    direction: dir,
    colors: guidelineColors.accent
      ? { accentColor: guidelineColors.accent, bgColor: guidelineColors.bg }
      : {
          accentColor: PALETTE_BY_DIRECTION[dir].accent,
          bgColor: PALETTE_BY_DIRECTION[dir].bg,
        },
  }))
}

function parseVariations(text: string): TemplateVariation[] {
  // O modelo deve responder com um array JSON; extrai o bloco mais externo.
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('sem json')
  const parsed = JSON.parse(match[0]) as TemplateVariation[]
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('vazio')
  return parsed.slice(0, 3).map((v) => {
    const colors = v.colors || {}
    if (colors.accentColor && !HEX_RE.test(colors.accentColor)) delete colors.accentColor
    if (colors.bgColor && !HEX_RE.test(colors.bgColor)) delete colors.bgColor
    if (colors.textColor && !HEX_RE.test(colors.textColor)) delete colors.textColor
    return {
      ...v,
      headline: String(v.headline || ''),
      subhead: String(v.subhead || ''),
      ctaText: String(v.ctaText || 'SAIBA MAIS'),
      direction: String(v.direction || 'variação'),
    }
  })
}

export async function generateTemplateVariations(
  input: GenerateVariationsInput,
): Promise<{ variations: TemplateVariation[]; source: 'ia' | 'fallback' }> {
  const base = (input.template.layout_data as Record<string, unknown>) || {}
  const styles = (input.template.style_settings as Record<string, unknown>) || {}
  const guidelineColors = extractGuidelineColors(input.styleGuidelines)

  const prompt = [
    `Você é diretor de arte e copywriter sênior de social media.`,
    `Template base: "${input.template.name}" (categoria: ${input.template.category || 'geral'}, rede: ${input.template.network || 'instagram'}).`,
    `Copy atual — headline: "${String(base.headline || input.template.name)}"; subhead: "${String(base.subhead || '')}"; CTA: "${String(base.ctaText || '')}".`,
    input.brandName ? `Marca: ${input.brandName}.` : '',
    input.brandVoice ? `Tom de voz: ${input.brandVoice}.` : '',
    input.styleGuidelines
      ? `Diretrizes visuais da marca/campanha (respeite as cores citadas): ${typeof input.styleGuidelines === 'string' ? input.styleGuidelines : JSON.stringify(input.styleGuidelines)}`
      : '',
    `Gere exatamente 3 variações criativas deste template.`,
    `Responda APENAS com um array JSON válido, sem texto ao redor, com os campos:`,
    `name, headline, subhead, ctaText, badgeText, direction (nome curto da direção visual, ex: "alto contraste"),`,
    `colors (objeto opcional com accentColor/bgColor/textColor em HEX respeitando as diretrizes).`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const res = await aiAction({ action: 'caption', prompt, maxTokens: 900, temperature: 0.9 })
    const text = typeof res === 'string' ? res : String((res as any)?.text ?? res ?? '')
    const variations = parseVariations(text)
    return { variations, source: 'ia' }
  } catch {
    return { variations: localFallback(input), source: 'fallback' }
  }
}

export function applyVariationToTemplate(
  template: PostTemplate,
  variation: TemplateVariation,
): { layout_data: Record<string, unknown>; style_settings: Record<string, unknown> } {
  const layout = { ...((template.layout_data as Record<string, unknown>) || {}) }
  const styles = { ...((template.style_settings as Record<string, unknown>) || {}) }
  layout.headline = variation.headline
  if (variation.subhead) layout.subhead = variation.subhead
  if (variation.ctaText) layout.ctaText = variation.ctaText
  if (variation.badgeText) styles.badgeText = variation.badgeText
  if (variation.colors?.accentColor) styles.accentColor = variation.colors.accentColor
  if (variation.colors?.bgColor) {
    styles.bgColor = variation.colors.bgColor
    styles.gradient = `linear-gradient(135deg, ${variation.colors.bgColor} 0%, #1a103c 100%)`
  }
  if (variation.colors?.textColor) styles.textColor = variation.colors.textColor
  return { layout_data: layout, style_settings: styles }
}
