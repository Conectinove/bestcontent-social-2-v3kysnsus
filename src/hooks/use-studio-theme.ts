import { useEffect, useMemo, useState } from 'react'
import type { Brand } from '@/types'

export type StudioThemeId = string

export interface StudioThemeOption {
  id: StudioThemeId
  name: string
  mode: 'light' | 'dark'
  /** Cores HSL no formato "262 83% 58%" (padrão das variáveis do Tailwind/shadcn). */
  primary: string
  accent: string
  ring: string
  /** Origem do tema: embutido, derivado de uma marca ou criado pelo usuário. */
  source: 'builtin' | 'brand' | 'custom'
  /** Prévia para o seletor (gradiente CSS). */
  preview: string
  /** Cores em hex usadas na criação de temas personalizados (apenas custom). */
  colors?: StudioCustomColors
}

export interface StudioCustomColors {
  background: string // ex: "#09090b"
  surface: string // cards, ex: "#18181b"
  primary: string // cor de destaque, ex: "#7c3aed"
  text: string // texto principal, ex: "#fafafa"
}

const STORAGE_KEY = 'midiaviva_studio_theme'
const CUSTOM_THEMES_KEY = 'midiaviva_studio_custom_themes'

/** Temas embutidos do Studio — mapeiam as variáveis --primary/--accent do app. */
export const BUILTIN_STUDIO_THEMES: StudioThemeOption[] = [
  {
    id: 'violeta-dark',
    name: 'Violeta Noturno',
    mode: 'dark',
    primary: '262 83% 62%',
    accent: '262 50% 20%',
    ring: '262 83% 62%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
  },
  {
    id: 'violeta-light',
    name: 'Violeta Claro',
    mode: 'light',
    primary: '262 83% 58%',
    accent: '262 83% 96%',
    ring: '262 83% 58%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #8b5cf6, #ede9fe)',
  },
  {
    id: 'ciano-dark',
    name: 'Ciano Neon',
    mode: 'dark',
    primary: '191 90% 50%',
    accent: '193 60% 18%',
    ring: '191 90% 50%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #06b6d4, #67e8f9)',
  },
  {
    id: 'ciano-light',
    name: 'Ciano Claro',
    mode: 'light',
    primary: '191 95% 42%',
    accent: '191 90% 94%',
    ring: '191 95% 42%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #0891b2, #cffafe)',
  },
  {
    id: 'ambar-dark',
    name: 'Âmbar High Impact',
    mode: 'dark',
    primary: '47 96% 53%',
    accent: '45 60% 18%',
    ring: '47 96% 53%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #eab308, #fde047)',
  },
  {
    id: 'ambar-light',
    name: 'Âmbar Claro',
    mode: 'light',
    primary: '32 95% 44%',
    accent: '48 96% 92%',
    ring: '32 95% 44%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #d97706, #fef3c7)',
  },
]

/** Converte "#7c3aed" em "262 83% 62%" (HSL sem unidade, formato das CSS vars). */
export function hexToHslTokens(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const int = parseInt(m[1], 16)
  const r = ((int >> 16) & 255) / 255
  const g = ((int >> 8) & 255) / 255
  const b = (int & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

/** HSL tokens → string "h s% l%" usada nas variáveis CSS. */
function hslStr(tokens: { h: number; s: number; l: number }): string {
  return `${tokens.h} ${tokens.s}% ${tokens.l}%`
}

/** Deriva temas do Studio a partir das marcas do usuário (color_theme em hex). */
export function buildBrandThemes(brands: Brand[]): StudioThemeOption[] {
  return brands
    .map((brand) => {
      const tokens = hexToHslTokens((brand as any).color_theme || '')
      if (!tokens) return null
      const h = tokens.h
      const s = Math.max(30, tokens.s)
      return {
        id: `brand-${brand.id}`,
        name: `Marca · ${brand.name}`,
        mode: 'dark' as const,
        primary: `${h} ${s}% 62%`,
        accent: `${h} ${Math.round(s * 0.6)}% 20%`,
        ring: `${h} ${s}% 62%`,
        source: 'brand' as const,
        preview: `linear-gradient(135deg, hsl(${h} ${s}% 50%), hsl(${h} ${s}% 75%))`,
      }
    })
    .filter(Boolean) as StudioThemeOption[]
}

/** Lê os temas personalizados salvos no localStorage. */
export function loadCustomThemes(): StudioThemeOption[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (t: any) =>
          t &&
          typeof t.id === 'string' &&
          typeof t.name === 'string' &&
          t.colors &&
          typeof t.colors.primary === 'string',
      )
      .map((t: any) => buildCustomTheme(t.name, t.colors, t.id))
  } catch {
    return []
  }
}

/** Salva a lista completa de temas personalizados no localStorage. */
function persistCustomThemes(themes: StudioThemeOption[]) {
  try {
    localStorage.setItem(
      CUSTOM_THEMES_KEY,
      JSON.stringify(themes.map((t) => ({ id: t.id, name: t.name, colors: t.colors }))),
    )
  } catch {
    /* intentionally ignored */
  }
}

/** Monta um tema personalizado a partir de nome + 4 cores em hex. */
export function buildCustomTheme(
  name: string,
  colors: StudioCustomColors,
  existingId?: StudioThemeId,
): StudioThemeOption {
  const primaryTokens = hexToHslTokens(colors.primary) || { h: 262, s: 83, l: 62 }
  const bgTokens = hexToHslTokens(colors.background) || { h: 0, s: 0, l: 4 }
  const surfaceTokens = hexToHslTokens(colors.surface) || { h: 0, s: 0, l: 9 }
  const textTokens = hexToHslTokens(colors.text) || { h: 210, s: 40, l: 98 }
  const isLight = bgTokens.l > 50
  return {
    id: existingId || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || 'Tema personalizado',
    mode: isLight ? 'light' : 'dark',
    primary: hslStr(primaryTokens),
    accent: hslStr({ h: primaryTokens.h, s: Math.min(90, primaryTokens.s), l: isLight ? 94 : 20 }),
    ring: hslStr(primaryTokens),
    source: 'custom',
    preview: `linear-gradient(135deg, ${colors.primary}, ${colors.background})`,
    colors,
  }
}

/**
 * Aplica o tema escolhido apenas na sub-árvore do Studio via data-attribute
 * (`data-studio-theme` no container), sem afetar o resto do app.
 */
export function useStudioTheme(brands: Brand[]) {
  const [themeId, setThemeId] = useState<StudioThemeId>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'violeta-dark'
    } catch {
      return 'violeta-dark'
    }
  })
  const [customThemes, setCustomThemes] = useState<StudioThemeOption[]>(() => loadCustomThemes())

  const brandThemes = useMemo(() => buildBrandThemes(brands), [brands])
  const allThemes = useMemo(
    () => [...BUILTIN_STUDIO_THEMES, ...brandThemes, ...customThemes],
    [brandThemes, customThemes],
  )

  const theme = allThemes.find((t) => t.id === themeId) || BUILTIN_STUDIO_THEMES[0]

  // Persistência da escolha
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      /* intentionally ignored */
    }
  }, [themeId])

  // Aplica variáveis CSS no elemento que carrega data-studio-theme
  useEffect(() => {
    const host = document.querySelector('[data-studio-theme]')
    if (!host) return
    const el = host as HTMLElement
    const isDark = theme.mode === 'dark'
    const isCustom = theme.source === 'custom' && theme.colors
    const primaryTokens = hexToHslTokens(theme.colors?.primary || '')
    const bgTokens = hexToHslTokens(theme.colors?.background || '')
    const surfaceTokens = hexToHslTokens(theme.colors?.surface || '')
    const textTokens = hexToHslTokens(theme.colors?.text || '')

    el.style.setProperty('--primary', theme.primary)
    el.style.setProperty('--primary-foreground', '0 0% 100%')
    el.style.setProperty('--accent', theme.accent)
    el.style.setProperty(
      '--accent-foreground',
      isCustom
        ? textTokens
          ? hslStr(textTokens)
          : isDark
            ? '210 40% 98%'
            : '220 13% 18%'
        : isDark
          ? '262 83% 80%'
          : '262 83% 58%',
    )
    el.style.setProperty('--ring', theme.ring)
    el.style.setProperty(
      '--background',
      bgTokens ? hslStr(bgTokens) : isDark ? '0 0% 4%' : '0 0% 100%',
    )
    el.style.setProperty(
      '--foreground',
      textTokens ? hslStr(textTokens) : isDark ? '210 40% 98%' : '220 13% 18%',
    )
    el.style.setProperty(
      '--card',
      surfaceTokens ? hslStr(surfaceTokens) : isDark ? '0 0% 8%' : '0 0% 100%',
    )
    el.style.setProperty(
      '--card-foreground',
      textTokens ? hslStr(textTokens) : isDark ? '210 40% 98%' : '220 13% 18%',
    )
    el.style.setProperty(
      '--muted',
      surfaceTokens
        ? hslStr({ ...surfaceTokens, l: Math.min(95, Math.max(6, surfaceTokens.l + 4)) })
        : isDark
          ? '0 0% 14%'
          : '210 20% 96%',
    )
    el.style.setProperty(
      '--muted-foreground',
      textTokens
        ? hslStr({ ...textTokens, l: Math.max(28, textTokens.l - 32) })
        : isDark
          ? '215 16% 65%'
          : '215 16% 47%',
    )
    el.style.setProperty('--border', isDark ? '0 0% 18%' : '214 32% 91%')
    el.style.setProperty('--input', isDark ? '0 0% 18%' : '214 32% 91%')
    el.style.setProperty(
      '--popover',
      surfaceTokens ? hslStr(surfaceTokens) : isDark ? '0 0% 8%' : '0 0% 100%',
    )
    el.style.setProperty(
      '--popover-foreground',
      textTokens ? hslStr(textTokens) : isDark ? '210 40% 98%' : '220 13% 18%',
    )
    el.style.setProperty(
      '--secondary',
      surfaceTokens
        ? hslStr({ ...surfaceTokens, l: Math.min(92, surfaceTokens.l + 6) })
        : isDark
          ? '217 33% 17%'
          : '210 40% 96%',
    )
    el.style.setProperty(
      '--secondary-foreground',
      textTokens ? hslStr(textTokens) : isDark ? '210 40% 98%' : '222 47% 11%',
    )
  }, [theme, themeId])

  /** Cria um tema personalizado, salva, aplica na hora. */
  const addCustomTheme = (name: string, colors: StudioCustomColors): StudioThemeOption => {
    const newTheme = buildCustomTheme(name, colors)
    setCustomThemes((prev) => {
      const next = [...prev, newTheme]
      persistCustomThemes(next)
      return next
    })
    setThemeId(newTheme.id)
    return newTheme
  }

  /** Exclui um tema personalizado; se era o ativo, volta ao tema padrão. */
  const removeCustomTheme = (id: StudioThemeId) => {
    setCustomThemes((prev) => {
      const next = prev.filter((t) => t.id !== id)
      persistCustomThemes(next)
      setThemeId((cur) => (cur === id ? 'violeta-dark' : cur))
      return next
    })
  }

  return { theme, themeId, setThemeId, allThemes, addCustomTheme, removeCustomTheme }
}
