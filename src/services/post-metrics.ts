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
 * Retorna métrica do post ou simula uma baseline plausível de acordo com a rede caso não exista
 */
export function getSimulatedMetricFallback(
  postId: string,
  platform = 'Instagram',
  publishedDate?: string,
): PostMetric {
  const plat = platform.toLowerCase()
  let rede = 'instagram'
  if (plat.includes('tik')) rede = 'tiktok'
  else if (plat.includes('link')) rede = 'linkedin'
  else if (plat.includes('you')) rede = 'youtube'
  else if (plat.includes('face')) rede = 'facebook'
  else if (plat.includes('twit') || plat === 'x') rede = 'twitter'

  const seed = (postId.charCodeAt(0) * 19 + postId.length * 23) % 100
  const alcance = 1100 + seed * 45
  const impressoes = Math.round(alcance * (1.3 + (seed % 20) / 100))
  const cliques = Math.round(alcance * (0.04 + (seed % 30) / 1000))
  const salvamentos = Math.round(alcance * (0.025 + (seed % 25) / 1000))
  const engajamento = Math.round(alcance * (0.065 + (seed % 35) / 1000))
  const taxa = Number(((engajamento / Math.max(impressoes, 1)) * 100).toFixed(2))

  return {
    id: `sim-${postId}`,
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
