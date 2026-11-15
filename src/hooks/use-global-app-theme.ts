/**
 * Tema global do app: conecta o hook `useAppTheme` ao layout autenticado
 * (`src/components/Layout.tsx`), para que TODAS as telas sob /app obedeçam
 * às CSS vars do tema escolhido (accent, cores, modo) — não só o Studio.
 *
 * A rede social ativa é derivada automaticamente da URL (criador/editor com
 * rede escolhida, ex.: /app/editor/:postId?network=instagram), com fallback
 * para a rede persistida manualmente no seletor (`midiaviva_theme_network`).
 */
import { useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import type { Brand } from '@/types'
import { useAppTheme } from '@/hooks/use-app-theme'
import { useAuth } from '@/context/AuthContext'
import { normalizeNetworkThemeId, type NetworkThemeId } from '@/lib/network-themes'

/** "Instagram" | "twitter" | "tiktok" (record do post) → id do motor de temas. */
export function networkIdFromPlatform(platform: string): NetworkThemeId {
  const v = (platform || '').toLowerCase()
  if (v === 'twitter/x' || v === 'twitter' || v === 'x') return 'x'
  return normalizeNetworkThemeId(v)
}

/** Detecta a rede alvo na URL atual, se houver (best-effort, silencioso). */
function detectNetworkFromUrl(pathname: string, search: string): NetworkThemeId | null {
  if (!pathname.startsWith('/app')) return null

  // 1) Query string explícita (?network=instagram&platform=TikTok&net=linkedin)
  const params = new URLSearchParams(search)
  const explicit = normalizeNetworkThemeId(
    params.get('network') || params.get('platform') || params.get('net') || '',
  )
  if (explicit !== 'none') return explicit

  // 2) Rotas de criação/edição: rede no caminho (ex.: /app/criar/instagram)
  const routeMatch = /^\/app\/(?:criar|content\/new)\/([a-z0-9-]+)/i.exec(pathname)
  if (routeMatch) {
    const fromRoute = normalizeNetworkThemeId(routeMatch[1])
    if (fromRoute !== 'none') return fromRoute
  }
  return null
}

export function useGlobalAppTheme(brands: Brand[]) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  // Rede alvo na URL atual (query ou rota) — tem precedência sobre o seletor
  const urlNetwork = useMemo(
    () => detectNetworkFromUrl(location.pathname, location.search),
    [location.pathname, location.search],
  )

  // Post aberto no editor: rede do registro (platform) manda, se válida
  const editorNetwork = useMemo(() => {
    if (urlNetwork !== null) return urlNetwork
    if (!/^\/app\/editor\//.test(location.pathname)) return null
    const fromPost = networkIdFromPlatform(searchParams.get('platform') || '')
    return fromPost !== 'none' ? fromPost : null
  }, [urlNetwork, location.pathname, searchParams])

  const activeNetwork: NetworkThemeId = urlNetwork || editorNetwork || 'none'

  const appTheme = useAppTheme(brands, user?.id || '')

  // Sincroniza a rede ativa no motor (aplica o accent da rede sobre o tema)
  useEffect(() => {
    if (activeNetwork !== 'none') {
      appTheme.setNetworkId(activeNetwork)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNetwork])

  return appTheme
}
