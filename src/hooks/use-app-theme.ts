import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Brand } from '@/types'
import {
  loadCustomThemes,
  persistCustomThemes,
  buildCustomTheme,
  buildBrandThemes,
  BUILTIN_STUDIO_THEMES,
  hexToHslTokens,
  hslStr,
  type StudioThemeOption,
  type StudioCustomColors,
  type StudioThemeId,
} from '@/hooks/use-studio-theme'
import {
  createStudioTheme,
  updateStudioTheme,
  deleteStudioTheme,
  fetchStudioThemes,
  type StudioThemeInput,
} from '@/services/studio-themes'
import type { ParsedThemeInput } from '@/lib/theme-file'
import {
  loadNetworkThemeId,
  saveNetworkThemeId,
  normalizeNetworkThemeId,
  NETWORK_THEMES,
  type NetworkThemeId,
} from '@/lib/network-themes'

export type { StudioThemeOption, StudioCustomColors, StudioThemeId } from '@/hooks/use-studio-theme'
export { hexToHslTokens, hslStr } from '@/hooks/use-studio-theme'

export interface CreateThemeOptions {
  name: string
  colors: StudioCustomColors
  network?: NetworkThemeId
  isShared?: boolean
  /** Escopo do tema salvo: "personal" (só para mim, default) ou "team" (equipe). */
  scope?: 'team' | 'personal'
}

/** Escolha de tema do usuário: qual tema aplicar e em qual escopo. */
export type ThemeApplyScope = 'personal' | 'team'

const DEFAULT_THEME_ID: StudioThemeId = 'violeta-dark'

/**
 * Tema aplicado no APP INTEIRO via CSS vars no `:root` (documentElement).
 * Roda no layout autenticado global (`src/components/Layout.tsx`), então
 * sidebar, header e todas as telas sob /app mudam de cor juntas.
 *
 * - Escolha do tema + rede social: localStorage (`midiaviva_studio_theme`,
 *   `midiaviva_theme_network`) — sobrevive ao reload.
 * - Temas personalizados: cache local instantâneo + persistência no banco
 *   (coleção studio_themes), incluindo rede, accent e flag de compartilhamento.
 * - Temas compartilhados pela equipe: carregados do banco (mesma company).
 * - Rede social: aplica o accent da rede sobre o tema ativo (Instagram roxo/rosa,
 *   TikTok ciano/rosa, LinkedIn azul...) sem trocar o tema base nem o modo.
 */
export function useAppTheme(brands: Brand[], remoteKey: string = '') {
  const [themeId, setThemeIdState] = useState<StudioThemeId>(() => {
    try {
      return localStorage.getItem('midiaviva_studio_theme') || DEFAULT_THEME_ID
    } catch {
      return DEFAULT_THEME_ID
    }
  })
  const [customThemes, setCustomThemes] = useState<StudioThemeOption[]>(() => loadCustomThemes())
  const [teamThemes, setTeamThemes] = useState<StudioThemeOption[]>([])
  const [networkId, setNetworkIdState] = useState<NetworkThemeId>(() => loadNetworkThemeId())
  const [isSaving, setIsSaving] = useState(false)
  /**
   * Pré-visualização (hover no seletor / live preview no editor): tema que a
   * raiz mostra AGORA. Ao confirmar, confirmPreview() grava em themeId.
   */
  const [previewTheme, setPreviewTheme] = useState<StudioThemeOption | null>(null)

  const brandThemes = useMemo(() => buildBrandThemes(brands), [brands])

  const allThemes = useMemo(
    () => [...BUILTIN_STUDIO_THEMES, ...brandThemes, ...customThemes, ...teamThemes],
    [brandThemes, customThemes, teamThemes],
  )

  const theme = useMemo(
    () => allThemes.find((t) => t.id === themeId) || BUILTIN_STUDIO_THEMES[0],
    [allThemes, themeId],
  )

  /** Tema efetivamente renderizado: o de preview (hover) ou o confirmado. */
  const renderedTheme = previewTheme ?? theme

  // Carrega temas do usuário + compartilhados pela equipe (uma vez por login)
  useEffect(() => {
    if (!remoteKey) return
    let active = true
    fetchStudioThemes()
      .then((list) => {
        if (!active) return
        // Temas remotos entram em teamThemes quando não são do usuário logado
        const mine = list.filter((t) => t.origin === 'mine')
        const team = list.filter((t) => t.origin === 'team')
        setTeamThemes(team)
        setCustomThemes((prev) => {
          const remoteIds = new Set(mine.map((t) => t.remoteId))
          const localOnly = prev.filter((t) => !t.remoteId)
          // Merge: remotos (fonte da verdade) + locais sem remoteId
          const merged = [...mine, ...localOnly.filter((t) => !remoteIds.has(t.id))]
          persistCustomThemes(merged)
          return merged
        })
      })
      .catch(() => {
        /* silencioso — seletor funciona mesmo sem banco */
      })
    return () => {
      active = false
    }
  }, [remoteKey])

  // Persistência da escolha (localStorage — reload mantém o tema)
  useEffect(() => {
    try {
      localStorage.setItem('midiaviva_studio_theme', themeId)
    } catch {
      /* intentionally ignored */
    }
  }, [themeId])

  // Persistência da rede social escolhida
  useEffect(() => {
    saveNetworkThemeId(networkId)
  }, [networkId])

  // Aplica as variáveis CSS do tema no nível global (:root).
  // Durante a pré-visualização (hover), mostra o tema temporário; ao sair,
  // volta ao confirmado sem gravar nada em localStorage ou banco.
  useEffect(() => {
    applyThemeVars(renderedTheme, networkId)
  }, [renderedTheme, networkId])

  const setThemeId = useCallback((id: StudioThemeId) => setThemeIdState(id), [])
  const setNetworkId = useCallback((id: NetworkThemeId) => setNetworkIdState(id), [])

  /**
   * Preset por rede social: aplica o accent da rede sobre o tema ativo e
   * persiste — localStorage (networkId, sempre) + banco (network/accentOverride
   * do tema ativo, quando ele é um tema próprio com registro remoto).
   */
  const applyNetworkAccent = useCallback(
    (id: NetworkThemeId) => {
      setNetworkIdState(id)
      const target = allThemes.find((t) => t.id === themeId)
      if (!target || target.source !== 'custom' || target.origin !== 'mine' || !target.remoteId)
        return
      const network = id === 'none' ? undefined : id
      const accentOverride = network ? NETWORK_THEMES[network].primary : undefined
      setCustomThemes((prev) => {
        const next = prev.map((t) => (t.id === themeId ? { ...t, network, accentOverride } : t))
        persistCustomThemes(next)
        return next
      })
      updateStudioTheme(target.remoteId, {
        network: network || null,
        accentOverride: accentOverride || null,
      }).catch(() => {
        /* silencioso — a rede já persistiu no localStorage */
      })
    },
    [allThemes, themeId],
  )

  /** Pré-visualização: aplica o tema na raiz SEM confirmar (hover no seletor). */
  const startPreview = useCallback(
    (id: StudioThemeId) => {
      const found = allThemes.find((t) => t.id === id)
      if (found) setPreviewTheme(found)
    },
    [allThemes],
  )
  /** Encerra a pré-visualização e volta ao tema confirmado. */
  const cancelPreview = useCallback(() => setPreviewTheme(null), [])
  /** Confirma o tema em pré-visualização (persiste a escolha). */
  const confirmPreview = useCallback(() => {
    if (previewTheme) setThemeIdState(previewTheme.id)
    setPreviewTheme(null)
  }, [previewTheme])

  /** Cria um tema personalizado (com rede + escopo team/personal) e aplica. */
  const addCustomTheme = useCallback(async (opts: CreateThemeOptions): Promise<void> => {
    const scope = opts.scope === 'team' ? 'team' : 'personal'
    const isShared = scope === 'team'
    const newTheme = buildCustomTheme(opts.name, opts.colors)
    const enriched: StudioThemeOption = {
      ...newTheme,
      network: opts.network && opts.network !== 'none' ? opts.network : undefined,
      accentOverride:
        opts.network && opts.network !== 'none' ? NETWORK_THEMES[opts.network].primary : undefined,
      origin: 'mine',
      isShared,
      scope,
    }
    setIsSaving(true)
    try {
      const saved = await createStudioTheme({
        name: enriched.name,
        colors: opts.colors,
        network: enriched.network || null,
        isShared,
        accentOverride: enriched.accentOverride || null,
        scope,
      })
      enriched.remoteId = saved.remoteId
    } catch {
      /* fallback: fica só no localStorage */
    }
    setCustomThemes((prev) => {
      const next = [...prev, enriched]
      persistCustomThemes(next)
      return next
    })
    if (enriched.network) setNetworkIdState(normalizeNetworkThemeId(enriched.network))
    setThemeIdState(enriched.id)
    setIsSaving(false)
  }, [])

  /** Importa um tema de arquivo JSON validado (parseThemeFile) e o aplica. */
  const importTheme = useCallback((input: ParsedThemeInput): StudioThemeOption => {
    const imported = buildCustomTheme(input.name, input.colors)
    const enriched: StudioThemeOption = {
      ...imported,
      network: input.network && input.network !== 'none' ? input.network : undefined,
      accentOverride: input.accentOverride || undefined,
      origin: 'mine',
      scope: 'personal',
      isShared: false,
    }
    // Persiste no banco (best-effort) — tema importado começa "só para mim"
    createStudioTheme({
      name: enriched.name,
      colors: input.colors,
      network: enriched.network || null,
      isShared: false,
      accentOverride: input.accentOverride || null,
      scope: 'personal',
    })
      .then((saved) => {
        enriched.remoteId = saved.remoteId
        setCustomThemes((prev) => {
          const next = prev.map((t) =>
            t.id === enriched.id ? { ...t, remoteId: saved.remoteId } : t,
          )
          persistCustomThemes(next)
          return next
        })
      })
      .catch(() => {
        /* fallback: fica só no localStorage */
      })
    setCustomThemes((prev) => {
      const next = [...prev, enriched]
      persistCustomThemes(next)
      return next
    })
    setThemeIdState(enriched.id)
    return enriched
  }, [])

  /** Edita um tema personalizado existente (nome, cores, rede) e persiste. */
  const updateCustomTheme = useCallback(
    async (id: StudioThemeId, input: StudioThemeInput): Promise<void> => {
      const target = customThemes.find((t) => t.id === id)
      if (!target) return
      const network = input.network && input.network !== 'none' ? input.network : undefined
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
      }
      setIsSaving(true)
      setCustomThemes((prev) => {
        const next = prev.map((t) => (t.id === id ? updated : t))
        persistCustomThemes(next)
        return next
      })
      if (target.remoteId) {
        try {
          await updateStudioTheme(target.remoteId, {
            name: updated.name,
            colors: input.colors,
            network: updated.network || null,
            accentOverride: updated.accentOverride || null,
          })
        } catch {
          /* silencioso — estado local já aplicado */
        }
      }
      if (themeId === id) applyThemeVars(updated, networkId)
      setIsSaving(false)
    },
    [customThemes, themeId, networkId],
  )

  /** Marca/desmarca compartilhamento com a equipe (persistido no banco). */
  const toggleShared = useCallback(
    async (id: StudioThemeId, isShared: boolean): Promise<void> => {
      setCustomThemes((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, isShared } : t))
        persistCustomThemes(next)
        return next
      })
      const target =
        customThemes.find((t) => t.id === id) || teamThemes.find((t) => t.remoteId === id)
      if (!target?.remoteId) return
      try {
        await updateStudioTheme(target.remoteId, { isShared })
        // Sucesso: nada mais a fazer — o estado otimista já foi aplicado acima.
      } catch {
        /* silencioso — estado otimista já aplicado */
      }
    },
    [customThemes, teamThemes],
  )

  /** Exclui um tema personalizado; se era o ativo, volta ao padrão. */
  const removeCustomTheme = useCallback(
    async (id: StudioThemeId) => {
      const target = customThemes.find((t) => t.id === id)
      setCustomThemes((prev) => {
        const next = prev.filter((t) => t.id !== id)
        persistCustomThemes(next)
        return next
      })
      setThemeIdState((cur) => (cur === id ? DEFAULT_THEME_ID : cur))
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
    networkId,
    setNetworkId,
    applyNetworkAccent,
    addCustomTheme,
    importTheme,
    updateCustomTheme,
    toggleShared,
    removeCustomTheme,
    isSaving,
    previewTheme,
    startPreview,
    cancelPreview,
    confirmPreview,
    isPreviewing: previewTheme !== null,
  }
}

/**
 * Aplica as CSS vars do tema (+ accent da rede social) no elemento raiz,
 * mudando o app inteiro: sidebar, header, cards, dialogs e telas fora do Studio.
 * Superfícies com cores fixas do Tailwind (bg-zinc-900 etc.) não mudam.
 */
export function applyThemeVars(theme: StudioThemeOption, networkId: NetworkThemeId = 'none') {
  const root = document.documentElement
  const isDark = theme.mode === 'dark'
  const isCustom = theme.source === 'custom' && theme.colors
  const primaryTokens = hexToHslTokens(theme.colors?.primary || '')
  const bgTokens = hexToHslTokens(theme.colors?.background || '')
  const surfaceTokens = hexToHslTokens(theme.colors?.surface || '')
  const textTokens = hexToHslTokens(theme.colors?.text || '')

  // Accent da rede social (quando escolhida): sobrepõe o accent/primary do tema
  const networkTheme =
    networkId && networkId !== 'none'
      ? NETWORK_THEMES[networkId as keyof typeof NETWORK_THEMES]
      : null
  const primary = networkTheme ? networkTheme.primary : theme.primary
  const accent = networkTheme ? networkTheme.accent : theme.accent
  const ring = networkTheme ? networkTheme.primary : theme.ring

  root.style.setProperty('--primary', primary)
  root.style.setProperty('--primary-foreground', '0 0% 100%')
  root.style.setProperty('--accent', accent)
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
  root.style.setProperty('--ring', ring)
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
  // Atributo global: permite CSS específica de tema escuro/clara e de rede no app
  root.setAttribute('data-app-theme', theme.mode)
  if (networkId && networkId !== 'none') {
    root.setAttribute('data-app-theme-network', networkId)
  } else {
    root.removeAttribute('data-app-theme-network')
  }
}
