import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Brand } from '@/types'
import { pb } from '@/lib/pocketbase/client'
import {
  loadCustomThemes,
  saveThemeId,
  loadThemeId,
  buildBrandThemes,
} from '@/hooks/use-studio-theme'
import {
  fetchTeamThemes,
  saveStudioTheme,
  deleteStudioTheme,
  type StudioThemeRecord,
} from '@/services/studio-themes'

export type { StudioThemeOption, StudioCustomColors, StudioThemeId } from '@/hooks/use-studio-theme'

import {
  BUILTIN_STUDIO_THEMES,
  buildCustomTheme,
  type StudioThemeOption,
  type StudioCustomColors,
  type StudioThemeId,
} from '@/hooks/use-studio-theme'

export interface CreateThemeOptions {
  name: string
  colors: StudioCustomColors
  network?: string
  accentOverride?: string
  isShared?: boolean
}

/**
 * Tema aplicado no APP INTEIRO via CSS vars no `:root` (com fallback para o
 * `<body>` em navegadores sem suporte a `:root` inline styles — ver applyThemeVars).
 * A escolha persiste em localStorage (`midiaviva_studio_theme`) — sobrevive ao reload.
 * Temas personalizados: cache local instantâneo + persistência no banco (studio_themes),
 * incluindo associação a rede social e o flag de compartilhamento com a equipe.
 */
export function useAppTheme(brands: Brand[], remoteKey: string = '') {
  const [themeId, setThemeIdState] = useState<StudioThemeId>(() => loadThemeId())
  const [customThemes, setCustomThemes] = useState<StudioThemeOption[]>(() => loadCustomThemes())
  const [teamThemes, setTeamThemes] = useState<StudioThemeOption[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const brandThemes = useMemo(() => buildBrandThemes(brands), [brands])

  const allThemes = useMemo(
    () => [...BUILTIN_STUDIO_THEMES, ...brandThemes, ...customThemes, ...teamThemes],
    [brandThemes, customThemes, teamThemes],
  )

  const theme = useMemo(
    () => allThemes.find((t) => t.id === themeId) || BUILTIN_STUDIO_THEMES[0],
    [allThemes, themeId],
  )

  // Carrega temas compartilhados pela equipe (uma vez por sessão de login)
  useEffect(() => {
    if (!remoteKey) return
    let active = true
    fetchTeamThemes()
      .then((list) => {
        if (active) setTeamThemes(list)
      })
      .catch(() => {
        /* silencioso — seletor funciona mesmo sem banco */
      })
    return () => {
      active = false
    }
  }, [remoteKey])

  // Persistência da escolha (localStorage — critério 4: reload mantém o tema)
  useEffect(() => {
    saveThemeId(themeId)
  }, [themeId])

  // Aplica as variáveis CSS no nível global
  useEffect(() => {
    applyThemeVars(theme)
  }, [theme])

  const setThemeId = useCallback((id: StudioThemeId) => setThemeIdState(id), [])

  /** Cria um tema personalizado (com rede/accent/compartilhamento) e aplica. */
  const addCustomTheme = useCallback(
    async (opts: CreateThemeOptions): Promise<StudioThemeOption> => {
      const newTheme = buildCustomTheme(opts.name, opts.colors)
      const enriched: StudioThemeOption = {
        ...newTheme,
        network: opts.network,
        accentOverride: opts.accentOverride,
        origin: opts.isShared ? ('team' as const) : ('mine' as const),
        isShared: Boolean(opts.isShared),
      }
      if (opts.accentOverride) {
        enriched.preview = `linear-gradient(135deg, ${opts.colors.primary}, ${opts.accentOverride})`
      }

      setIsSaving(true)
      try {
        // Persiste no banco (se falhar, segue só com cache local)
        const record = await saveStudioTheme({
          name: enriched.name,
          network: enriched.network || '',
          mode: enriched.mode,
          color_background: opts.colors.background,
          color_surface: opts.colors.surface,
          color_primary: opts.colors.primary,
          color_text: opts.colors.text,
          accent_override: opts.accentOverride || '',
          is_shared: Boolean(opts.isShared),
          remote_id: enriched.id,
        })
        enriched.remoteId = record.id
      } catch {
        /* fallback: fica só no localStorage */
      } finally {
        setIsSaving(false)
      }

      setCustomThemes((prev) => {
        const next = [...prev, enriched]
        persistCustom(next)
        return next
      })
      setThemeIdState(enriched.id)
      return enriched
    },
    [],
  )

  /** Atualiza um tema personalizado existente (rede/accent/compartilhamento). */
  const updateCustomTheme = useCallback(
    async (id: StudioThemeId, patch: Partial<CreateThemeOptions>): Promise<void> => {
      let updated: StudioThemeOption | null = null
      setCustomThemes((prev) => {
        const next = prev.map((t) => {
          if (t.id !== id) return t
          const merged = {
            ...t,
            network: patch.network !== undefined ? patch.network : t.network,
            accentOverride:
              patch.accentOverride !== undefined ? patch.accentOverride : t.accentOverride,
            isShared: patch.isShared !== undefined ? Boolean(patch.isShared) : t.isShared,
            origin: (patch.isShared ? 'team' : 'mine') as 'team' | 'mine',
          }
          if (patch.accentOverride && t.colors) {
            merged.preview = `linear-gradient(135deg, ${t.colors.primary}, ${patch.accentOverride})`
          }
          updated = merged
          return merged
        })
        persistCustom(next)
        return next
      })
      setTeamThemes((prev) => {
        const next = prev.map((t) => {
          if (t.remoteId !== id) return t
          const merged = {
            ...t,
            network: patch.network !== undefined ? patch.network : t.network,
            isShared: patch.isShared !== undefined ? Boolean(patch.isShared) : t.isShared,
          }
          updated = merged
          return merged
        })
        return next
      })
      // Persiste no banco (best-effort)
      try {
        const current =
          customThemes.find((t) => t.id === id) || teamThemes.find((t) => t.remoteId === id)
        if (current) {
          await saveStudioTheme({
            id: current.remoteId,
            name: current.name,
            network: (patch.network !== undefined ? patch.network : current.network) || '',
            mode: current.mode,
            color_background: current.colors?.background || '',
            color_surface: current.colors?.surface || '',
            color_primary: current.colors?.primary || '',
            color_text: current.colors?.text || '',
            accent_override:
              (patch.accentOverride !== undefined
                ? patch.accentOverride
                : current.accentOverride) || '',
            is_shared:
              patch.isShared !== undefined ? Boolean(patch.isShared) : Boolean(current.isShared),
            remote_id: current.id,
          })
        }
      } catch {
        /* fallback: fica só no localStorage */
      }
      vt
    },
    [],
  )

  /** Exclui um tema personalizado; se era o ativo, volta ao padrão. */
  const removeCustomTheme = useCallback(
    async (id: StudioThemeId) => {
      const target = customThemes.find((t) => t.id === id)
      setCustomThemes((prev) => {
        const next = prev.filter((t) => t.id !== id)
        persistCustom(next)
        return next
      })
      setThemeIdState((cur) => (cur === id ? 'violeta-dark' : cur))
      if (target?.remoteId) {
        try {
          await deleteStudioTheme(target.remoteId)
        } catch {
          /* silencioso */
        }
      }
    },
    [customThemes],
  )

  return {
    theme,
    themeId,
    setThemeId,
    allThemes,
    customThemes,
    teamThemes,
    addCustomTheme,
    updateCustomTheme,
    removeCustomTheme,
    isSaving,
  }
}

/** Atalho local para persistir a lista de temas personalizados. */
function persistCustom(themes: StudioThemeOption[]) {
  try {
    const slim = themes.map((t) => ({
      id: t.id,
      name: t.name,
      colors: t.colors,
      network: t.network,
      accentOverride: t.accentOverride,
      isShared: t.isShared,
    }))
    localStorage.setItem('midiaviva_studio_custom_themes', JSON.stringify(slim))
  } catch {
    /* intentionally ignored */
  }
}

/**
 * Aplica as CSS vars do tema no elemento raiz (:root), mudando o app inteiro.
 * Usa setProperty no documentElement — todas as superfícies que consomem as vars
 * (sidebar, header, cards, dialogs) mudam junto. Superfícies com cores fixas do
 * Tailwind (bg-zinc-900, etc.) não mudam — comportamento aceito pela especificação.
 */
export function applyThemeVars(theme: StudioThemeOption) {
  const root = document.documentElement
  const isDark = theme.mode === 'dark'
  const isCustom = theme.source === 'custom' && theme.colors
  const primaryTokens = hexToHslTokens(theme.colors?.primary || '')
  const bgTokens = hexToHslTokens(theme.colors?.background || '')
  const surfaceTokens = hexToHslTokens(theme.colors?.surface || '')
  const textTokens = hexToHslTokens(theme.colors?.text || '')

  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--primary-foreground', '0 0% 100%')
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty(
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
  root.style.setProperty('--ring', theme.ring)
  root.style.setProperty(
    '--background',
    bgTokens ? hslStr(bgTokens) : isDark ? '0 0% 4%' : '0 0% 100%',
  )
  root.style.setProperty(
    '--foreground',
    textTokens ? hslStr(textTokens) : isDark ? '210 40% 98%' : '220 13% 18%',
  )
  root.style.setProperty(
    '--card',
    surfaceTokens ? hslStr(surfaceTokens) : isDark ? '0 0% 8%' : '0 0% 100%',
  )
  root.style.setProperty(
    '--card-foreground',
    textTokens ? hslStr(textTokens) : isDark ? '210 40% 98%' : '220 13% 18%',
  )
  root.style.setProperty(
    '--muted',
    surfaceTokens
      ? hslStr({ ...surfaceTokens, l: Math.min(95, Math.max(6, surfaceTokens.l + 4)) })
      : isDark
        ? '0 0% 14%'
        : '210 20% 96%',
  )
  root.style.setProperty(
    '--muted-foreground',
    textTokens
      ? hslStr({ ...textTokens, l: Math.max(28, textTokens.l - 32) })
      : isDark
        ? '215 16% 65%'
        : '215 16% 47%',
  )
  root.style.setProperty('--border', isDark ? '0 0% 18%' : '214 32% 91%')
  root.style.setProperty('--input', isDark ? '0 0% 18%' : '214 32% 91%')
  root.style.setProperty(
    '--popover',
    surfaceTokens ? hslStr(surfaceTokens) : isDark ? '0 0% 8%' : '0 0% 100%',
  )
  root.style.setProperty(
    '--popover-foreground',
    textTokens ? hslStr(textTokens) : isDark ? '210 40% 98%' : '220 13% 18%',
  )
  root.style.setProperty(
    '--secondary',
    surfaceTokens
      ? hslStr({ ...surfaceTokens, l: Math.min(92, surfaceTokens.l + 6) })
      : isDark
        ? '217 33% 17%'
        : '210 40% 96%',
  )
  root.style.setProperty(
    '--secondary-foreground',
    textTokens ? hslStr(textTokens) : isDark ? '210 40% 98%' : '222 47% 11%',
  )
  // Atributo global: permite CSS específica de tema escuro no app (ex. sidebar)
  root.setAttribute('data-app-theme', theme.mode)
  if (theme.network) {
    root.setAttribute('data-app-theme-network', theme.network)
  } else {
    root.removeAttribute('data-app-theme-network')
  }
}

// Reexporta helpers usados por applyThemeVars e pelo switcher
export { hexToHslTokens, hslStr } from '@/hooks/use-studio-theme'
import { hexToHslTokens, hslStr } from '@/hooks/use-studio-theme'
import type { StudioThemeRecord } from '@/services/studio-themes'
