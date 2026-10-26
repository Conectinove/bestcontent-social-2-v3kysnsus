import { pb } from '@/lib/pocketbase/client'

export interface PostMetric {
  id: string
  post: string
  user?: string
  rede: string
  alcance: number
  impressoes: number
  engajamento: number
  cliques: number
  salvamentos: number
  taxa_engajamento: number
  is_simulated: boolean
  data?: string
  created?: string
  updated?: string
}

export async function getPostMetricsByPost(postId: string): Promise<PostMetric | null> {
  try {
    const record = await pb
      .collection('post_metrics')
      .getFirstListItem<PostMetric>(`post = "${postId}"`)
    return record
  } catch {
    return null
  }
}

/**
 * Retorna TODAS as métricas associadas a um post específico por rede social de destino
 */
export async function getPostMetricsListByPost(postId: string): Promise<PostMetric[]> {
  try {
    const records = await pb.collection('post_metrics').getFullList<PostMetric>({
      filter: `post = "${postId}"`,
      sort: '-taxa_engajamento',
    })
    return records
  } catch {
    return []
  }
}

export async function getAllPostMetrics(): Promise<PostMetric[]> {
  try {
    const records = await pb.collection('post_metrics').getFullList<PostMetric>({
      sort: '-data',
    })
    return records
  } catch {
    return []
  }
}

/**
 * Normaliza o slug da rede social
 */
export function normalizeNetworkSlug(networkName?: string): string {
  const plat = (networkName || 'instagram').toLowerCase()
  if (plat.includes('tik')) return 'tiktok'
  if (plat.includes('link')) return 'linkedin'
  if (plat.includes('you')) return 'youtube'
  if (plat.includes('face')) return 'facebook'
  if (plat.includes('whats')) return 'whatsapp'
  if (plat.includes('twit') || plat === 'x') return 'twitter'
  return 'instagram'
}

/**
 * Retorna métrica do post ou simula uma baseline plausível de acordo com a rede caso não exista
 */
export function getSimulatedMetricFallback(
  postId: string,
  platform = 'Instagram',
  publishedDate?: string,
): PostMetric {
  const rede = normalizeNetworkSlug(platform)

  const factor =
    rede === 'instagram'
      ? 1.0
      : rede === 'facebook'
        ? 0.75
        : rede === 'linkedin'
          ? 0.65
          : rede === 'tiktok'
            ? 1.35
            : 0.8

  const seed = (postId.charCodeAt(0) * 19 + postId.length * 23) % 100
  const alcance = Math.round((1100 + seed * 45) * factor)
  const impressoes = Math.round(alcance * (1.3 + (seed % 20) / 100))
  const cliques = Math.round(alcance * (0.04 + (seed % 30) / 1000))
  const salvamentos = Math.round(alcance * (0.025 + (seed % 25) / 1000))
  const engajamento = Math.round(alcance * (0.065 + (seed % 35) / 1000))
  const taxa = Number(((engajamento / Math.max(impressoes, 1)) * 100).toFixed(2))

  return {
    id: `sim-${postId}-${rede}`,
    post: postId,
    rede,
    alcance,
    impressoes,
    cliques,
    salvamentos,
    engajamento,
    taxa_engajamento: taxa,
    is_simulated: true,
    data: publishedDate || new Date().toISOString(),
  }
}

/**
 * Gera métricas simuladas por cada rede de destino para fallback quando não houver no banco
 */
export function getSimulatedMultiNetworkMetrics(
  postId: string,
  targetNetworks: string[] = ['instagram'],
  publishedDate?: string,
): PostMetric[] {
  const list = targetNetworks.length > 0 ? targetNetworks : ['instagram']
  return list.map((net, idx) => {
    const rede = normalizeNetworkSlug(net)
    const factor =
      rede === 'instagram'
        ? 1.0
        : rede === 'facebook'
          ? 0.75
          : rede === 'linkedin'
            ? 0.65
            : rede === 'tiktok'
              ? 1.35
              : 0.8

    const seed = (postId.charCodeAt(0) * 19 + postId.length * 23 + idx * 31) % 100
    const alcance = Math.round((1100 + seed * 45) * factor)
    const impressoes = Math.round(alcance * (1.3 + (seed % 20) / 100))
    const cliques = Math.round(alcance * (0.04 + (seed % 30) / 1000))
    const salvamentos = Math.round(alcance * (0.025 + (seed % 25) / 1000))
    const engajamento = Math.round(alcance * (0.065 + (seed % 35) / 1000))
    const taxa = Number(((engajamento / Math.max(impressoes, 1)) * 100).toFixed(2))

    return {
      id: `sim-${postId}-${rede}-${idx}`,
      post: postId,
      rede,
      alcance,
      impressoes,
      cliques,
      salvamentos,
      engajamento,
      taxa_engajamento: taxa,
      is_simulated: true,
      data: publishedDate || new Date().toISOString(),
    }
  })
}
