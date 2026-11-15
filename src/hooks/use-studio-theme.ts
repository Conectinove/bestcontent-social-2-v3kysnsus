import { useEffect, useMemo, useState } from 'react'
import type { Brand } from '@/types'
import type { NetworkThemeId } from '@/lib/network-themes'

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
  /** Rede social associada (variação de accent) — apenas temas do usuário/equipe. */
  network?: string
  /** Accent sobreposto pela rede social (tokens HSL "h s% l%"). */
  accentOverride?: string
  /** Compartilhado com a equipe (escopo organização, coleção studio_themes). */
  isShared?: boolean
  /** Origem do registro: criado por mim ("mine") ou compartilhado por outro usuário ("team"). */
  origin?: 'mine' | 'team'
  /**
   * Escopo do tema persistido: "team" (equipe/organização — o comportamento
   * atual, compartilhado via is_shared) ou "personal" (só para mim — aplica
   * apenas na sessão/conta deste usuário, sem afetar o tema da equipe).
   */
  scope?: 'team' | 'personal'
  /** Id do registro remoto na coleção studio_themes (quando persistido no banco). */
  remoteId?: string
  /** Id do usuário dono do tema compartilhado (apenas temas da equipe). */
  ownerId?: string
  /** Nome do usuário dono do tema compartilhado (via expand, apenas equipe). */
  ownerName?: string
  /** Tema marcado como padrão da organização (coleção studio_themes). */
  isOrgDefault?: boolean
}

export interface StudioCustomColors {
  background: string // ex: "#09090b"
  surface: string // cards, ex: "#18181b"
  primary: string // cor de destaque, ex: "#7c3aed"
  text: string // texto principal, ex: "#fafafa"
}

import { createStudioTheme as createStudioThemeRemote } from '@/services/studio-themes'

const STORAGE_KEY = 'midiaviva_studio_theme'
const CUSTOM_THEMES_KEY = 'midiaviva_studio_custom_themes'
import {
  updateStudioTheme as updateStudioThemeRemote,
  type StudioThemeInput,
} from '@/services/studio-themes'
import { NETWORK_THEMES } from '@/lib/network-themes'

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
  // ---- Presets adicionais (esmeralda, rosa/magenta, azul-royal, coral, índigo) ----
  {
    id: 'esmeralda-dark',
    name: 'Esmeralda Profunda',
    mode: 'dark',
    primary: '160 84% 45%',
    accent: '162 60% 16%',
    ring: '160 84% 45%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #059669, #6ee7b7)',
  },
  {
    id: 'esmeralda-light',
    name: 'Esmeralda Claro',
    mode: 'light',
    primary: '160 88% 32%',
    accent: '152 76% 92%',
    ring: '160 88% 32%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #10b981, #d1fae5)',
  },
  {
    id: 'rosa-dark',
    name: 'Rosa Magenta',
    mode: 'dark',
    primary: '330 85% 60%',
    accent: '322 60% 18%',
    ring: '330 85% 60%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #db2777, #f9a8d4)',
  },
  {
    id: 'rosa-light',
    name: 'Rosa Claro',
    mode: 'light',
    primary: '330 81% 48%',
    accent: '326 78% 94%',
    ring: '330 81% 48%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #ec4899, #fce7f3)',
  },
  {
    id: 'azul-royal-dark',
    name: 'Azul Royal',
    mode: 'dark',
    primary: '221 90% 62%',
    accent: '222 60% 20%',
    ring: '221 90% 62%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #2563eb, #93c5fd)',
  },
  {
    id: 'azul-royal-light',
    name: 'Azul Royal Claro',
    mode: 'light',
    primary: '221 85% 48%',
    accent: '214 95% 93%',
    ring: '221 85% 48%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #3b82f6, #dbeafe)',
  },
  {
    id: 'coral-dark',
    name: 'Coral Vivo',
    mode: 'dark',
    primary: '16 92% 60%',
    accent: '14 65% 18%',
    ring: '16 92% 60%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #f97316, #fdba74)',
  },
  {
    id: 'coral-light',
    name: 'Coral Claro',
    mode: 'light',
    primary: '16 91% 48%',
    accent: '23 97% 93%',
    ring: '16 91% 48%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #fb7185, #ffe4e6)',
  },
  {
    id: 'indigo-dark',
    name: 'Indigo Elétrico',
    mode: 'dark',
    primary: '243 85% 65%',
    accent: '243 55% 20%',
    ring: '243 85% 65%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #6366f1, #a5b4fc)',
  },
  {
    id: 'indigo-light',
    name: 'Indigo Claro',
    mode: 'light',
    primary: '243 78% 52%',
    accent: '238 90% 94%',
    ring: '243 78% 52%',
    source: 'builtin',
    preview: 'linear-gradient(135deg, #818cf8, #e0e7ff)',
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
export function hslStr(tokens: { h: number; s: number; l: number }): string {
  return `${tokens.h} ${tokens.s}% ${tokens.l}%`
}

/** Lê tokens HSL no formato "262 83% 62%" (padrão das CSS vars) — null se inválido. */
export function parseHslTokens(value: string): { h: number; s: number; l: number } | null {
  const m = /^\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*$/.exec(value || '')
  if (!m) return null
  return {
    h: Math.round(parseFloat(m[1])),
    s: Math.round(parseFloat(m[2])),
    l: Math.round(parseFloat(m[3])),
  }
}

/** Converte tokens HSL em hex "#7c3aed" — inverso de hexToHslTokens. */
export function hslTokensToHex(tokens: { h: number; s: number; l: number }): string {
  const h = (((tokens.h % 360) + 360) % 360) / 360
  const s = Math.min(100, Math.max(0, tokens.s)) / 100
  const l = Math.min(100, Math.max(0, tokens.l)) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 1 / 6) [r, g, b] = [c, x, 0]
  else if (h < 2 / 6) [r, g, b] = [x, c, 0]
  else if (h < 3 / 6) [r, g, b] = [0, c, x]
  else if (h < 4 / 6) [r, g, b] = [0, x, c]
  else if (h < 5 / 6) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const to255 = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to255(r)}${to255(g)}${to255(b)}`
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
      .map((t: any) => ({
        ...buildCustomTheme(t.name, t.colors, t.id),
        network: t.network || undefined,
        accentOverride: t.accentOverride || undefined,
        scope: t.scope === 'team' ? ('team' as const) : ('personal' as const),
        isShared: Boolean(t.isShared),
        origin: t.origin === 'mine' || t.origin === 'team' ? t.origin : ('mine' as const),
        remoteId: t.remoteId || undefined,
        ownerId: t.ownerId || undefined,
        ownerName: t.ownerName || undefined,
        isOrgDefault: Boolean(t.isOrgDefault),
      }))
  } catch {
    return []
  }
}

/**
 * Salva a lista completa de temas personalizados no localStorage — inclui os
 * metadados (rede-alvo, accent da rede, escopo pessoal/equipe, origem, remoteId
 * e dono) para que o tema sobreviva ao reload exatamente como foi criado.
 */
export function persistCustomThemes(themes: StudioThemeOption[]) {
  try {
    localStorage.setItem(
      CUSTOM_THEMES_KEY,
      JSON.stringify(
        themes.map((t) => ({
          id: t.id,
          name: t.name,
          colors: t.colors,
          network: t.network || null,
          accentOverride: t.accentOverride || null,
          scope: t.scope || null,
          isShared: Boolean(t.isShared),
          origin: t.origin || null,
          remoteId: t.remoteId || null,
          ownerId: t.ownerId || null,
          ownerName: t.ownerName || null,
          isOrgDefault: Boolean(t.isOrgDefault),
        })),
      ),
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
  const [customThemes, setCustomThemes] = useState<StudioThemeOption[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_THEMES_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed
            .filter(
              (t: any) =>
                t &&
                typeof t.id === 'string' &&
                typeof t.name === 'string' &&
                t.colors &&
                typeof t.colors.primary === 'string',
            )
            .map((t: any) => ({
              ...buildCustomTheme(t.name, t.colors, t.id),
              network: t.network || undefined,
              accentOverride: t.accentOverride || undefined,
              scope: t.scope === 'team' ? 'team' : 'personal',
              isShared: Boolean(t.isShared),
              origin: t.origin === 'mine' ? 'mine' : 'team',
              remoteId: t.remoteId || undefined,
              ownerId: t.ownerId || undefined,
              ownerName: t.ownerName || undefined,
            }))
        }
      }
    } catch {
      /* fallback abaixo */
    }
    return loadCustomThemes()
  })

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

  /**
   * Cria um tema personalizado (com rede + compartilhamento), salva, aplica na hora.
   * Assíncrono e sem retorno (Promise<void>) para casar com a prop onCreateCustom
   * do StudioThemeSwitcher (mesma assinatura do motor global use-app-theme).
   */
  const addCustomTheme = async (opts: {
    name: string
    colors: StudioCustomColors
    network?: NetworkThemeId
    isShared?: boolean
  }): Promise<void> => {
    const newTheme = buildCustomTheme(opts.name, opts.colors)
    if (opts.network && opts.network !== 'none') newTheme.network = opts.network
    newTheme.isShared = Boolean(opts.isShared)
    newTheme.scope = opts.isShared ? 'team' : 'personal'
    setCustomThemes((prev) => {
      const next = [...prev, newTheme]
      persistCustomThemes(next)
      return next
    })
    setThemeId(newTheme.id)
    // Persiste também na coleção studio_themes (best-effort): sem rede não
    // perde o tema — na próxima carga, fetchStudioThemes/remoteId reconcilia.
    try {
      const remote = await createStudioThemeRemote({
        name: newTheme.name,
        colors: opts.colors,
        network: newTheme.network || null,
        isShared: newTheme.isShared,
        scope: newTheme.scope,
      })
      setCustomThemes((prev) => {
        const next = prev.map((t) =>
          t.id === newTheme.id ? { ...t, remoteId: remote.remoteId } : t,
        )
        persistCustomThemes(next)
        return next
      })
    } catch {
      /* silencioso — tema segue funcional no localStorage */
    }
  }

  /** Edita um tema personalizado do Studio (nome, cores, rede) e persiste. */
  const updateCustomTheme = (id: StudioThemeId, input: StudioThemeInput): void => {
    const target = customThemes.find((t) => t.id === id)
    if (!target) return
    const network =
      input.network && input.network !== 'none' ? (input.network as NetworkThemeId) : undefined
    const accentOverride =
      network && NETWORK_THEMES[network as keyof typeof NETWORK_THEMES]
        ? NETWORK_THEMES[network as keyof typeof NETWORK_THEMES].primary
        : target.accentOverride
    const updated: StudioThemeOption = {
      ...target,
      name: input.name || target.name,
      colors: input.colors,
      mode:
        (input.colors.background || '').toLowerCase().startsWith('#') &&
        hexToHslTokens(input.colors.background)!.l > 50
          ? 'light'
          : 'dark',
      network,
      accentOverride,
      preview: `linear-gradient(135deg, ${input.colors.primary}, ${input.colors.surface})`,
      isShared: input.isShared !== undefined ? Boolean(input.isShared) : target.isShared,
      scope: input.scope !== undefined ? input.scope : target.scope,
    }
    setCustomThemes((prev) => {
      const next = prev.map((t) => (t.id === id ? updated : t))
      persistCustomThemes(next)
      return next
    })
    if (target.remoteId) {
      updateStudioThemeRemote(target.remoteId, {
        name: updated.name,
        colors: input.colors,
        network: updated.network || null,
        accentOverride: updated.accentOverride || null,
        isShared: updated.isShared,
        scope: updated.scope,
      }).catch(() => {
        /* silencioso — estado local já aplicado */
      })
    }
  }

  /**
   * Importa um tema de arquivo JSON já validado (parseThemeFile) — cria a
   * entrada personalizada e a aplica. Sem acesso ao banco aqui (o hook do
   * Studio é local); o motor global persiste via addImportedTheme.
   */
  const addImportedTheme = (input: {
    name: string
    colors: StudioCustomColors
    network?: string | null
    accentOverride?: string | null
  }) => {
    const newTheme = buildCustomTheme(input.name, input.colors)
    if (input.network && input.network !== 'none') newTheme.network = input.network
    if (input.accentOverride) newTheme.accentOverride = input.accentOverride
    newTheme.scope = 'personal'
    newTheme.origin = 'mine'
    setCustomThemes((prev) => {
      const next = [...prev, newTheme]
      persistCustomThemes(next)
      return next
    })
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

  return {
    theme,
    themeId,
    setThemeId,
    allThemes,
    addCustomTheme,
    updateCustomTheme,
    addImportedTheme,
    removeCustomTheme,
  }
}
