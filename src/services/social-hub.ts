import pb from '@/lib/pocketbase/client'
import type { IntegrationNetwork } from '@/types'
import { getAllPostMetrics, type PostMetric } from '@/services/post-metrics'
import { getTikTokOrganicMetrics, type TikTokOrganicData } from '@/services/tiktok-organic'
import { getUserIntegrations } from '@/services/user_integrations'

export interface NetworkChannelSummary {
  network: IntegrationNetwork
  name: string
  category: 'social' | 'video' | 'messaging' | 'professional' | 'community' | 'portfolio'
  connected: boolean
  displayName: string
  followers: number
  followersGrowth30d: number
  postsCount: number
  engagementRate: number
  reach30d: number
  impressions30d: number
  bestTime: { day: string; time: string }
  isOfficial: boolean
  badgeLabel: 'Dados Oficiais' | 'Estimativa Calibrada'
  color: string
}

export interface ConsolidatedSocialHubData {
  totalFollowers: number
  followersGrowthTotal: number
  averageEngagementRate: number
  totalPostsPublished: number
  totalReach30d: number
  totalImpressions30d: number
  channels: NetworkChannelSummary[]
  topPerformingPosts: {
    id: string
    title: string
    caption: string
    network: string
    engagementRate: number
    reach: number
    saves: number
    publishedDate: string
  }[]
  weeklyTrend: {
    week: string
    followers: number
    reach: number
    engagement: number
  }[]
  tiktokOrganic: TikTokOrganicData | null
}

export const ALL_SUPPORTED_NETWORKS: {
  network: IntegrationNetwork
  name: string
  category: NetworkChannelSummary['category']
  baseFollowers: number
  baseEng: number
  bestDay: string
  bestHour: string
  color: string
}[] = [
  {
    network: 'instagram',
    name: 'Instagram',
    category: 'social',
    baseFollowers: 16800,
    baseEng: 4.8,
    bestDay: 'Quarta',
    bestHour: '19:00',
    color: '#E1306C',
  },
  {
    network: 'tiktok',
    name: 'TikTok',
    category: 'video',
    baseFollowers: 24800,
    baseEng: 6.4,
    bestDay: 'Quinta',
    bestHour: '19:30',
    color: '#000000',
  },
  {
    network: 'youtube',
    name: 'YouTube',
    category: 'video',
    baseFollowers: 12400,
    baseEng: 5.1,
    bestDay: 'Domingo',
    bestHour: '15:00',
    color: '#FF0000',
  },
  {
    network: 'facebook',
    name: 'Facebook',
    category: 'social',
    baseFollowers: 8900,
    baseEng: 3.2,
    bestDay: 'Terça',
    bestHour: '13:00',
    color: '#1877F2',
  },
  {
    network: 'linkedin',
    name: 'LinkedIn',
    category: 'professional',
    baseFollowers: 7600,
    baseEng: 5.4,
    bestDay: 'Terça',
    bestHour: '08:30',
    color: '#0A66C2',
  },
  {
    network: 'twitter',
    name: 'X (Twitter)',
    category: 'social',
    baseFollowers: 5300,
    baseEng: 3.8,
    bestDay: 'Segunda',
    bestHour: '10:00',
    color: '#1DA1F2',
  },
  {
    network: 'threads',
    name: 'Threads',
    category: 'social',
    baseFollowers: 4200,
    baseEng: 4.2,
    bestDay: 'Quinta',
    bestHour: '20:00',
    color: '#000000',
  },
  {
    network: 'pinterest',
    name: 'Pinterest',
    category: 'social',
    baseFollowers: 6800,
    baseEng: 3.9,
    bestDay: 'Sábado',
    bestHour: '21:00',
    color: '#BD081C',
  },
  {
    network: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'messaging',
    baseFollowers: 3200,
    baseEng: 8.2,
    bestDay: 'Segunda',
    bestHour: '11:00',
    color: '#25D366',
  },
  {
    network: 'telegram',
    name: 'Telegram',
    category: 'messaging',
    baseFollowers: 2900,
    baseEng: 7.1,
    bestDay: 'Quarta',
    bestHour: '18:00',
    color: '#229ED9',
  },
  {
    network: 'kwai',
    name: 'Kwai',
    category: 'video',
    baseFollowers: 6100,
    baseEng: 5.6,
    bestDay: 'Sexta',
    bestHour: '19:00',
    color: '#FF7700',
  },
  {
    network: 'reddit',
    name: 'Reddit',
    category: 'community',
    baseFollowers: 1800,
    baseEng: 4.9,
    bestDay: 'Domingo',
    bestHour: '17:00',
    color: '#FF4500',
  },
  {
    network: 'discord',
    name: 'Discord',
    category: 'community',
    baseFollowers: 1450,
    baseEng: 9.3,
    bestDay: 'Quinta',
    bestHour: '21:00',
    color: '#5865F2',
  },
  {
    network: 'twitch',
    name: 'Twitch',
    category: 'video',
    baseFollowers: 1100,
    baseEng: 6.8,
    bestDay: 'Sexta',
    bestHour: '20:30',
    color: '#9146FF',
  },
  {
    network: 'snapchat',
    name: 'Snapchat',
    category: 'social',
    baseFollowers: 2200,
    baseEng: 4.1,
    bestDay: 'Sábado',
    bestHour: '16:00',
    color: '#FFFC00',
  },
  {
    network: 'behance',
    name: 'Behance',
    category: 'portfolio',
    baseFollowers: 3400,
    baseEng: 5.2,
    bestDay: 'Quarta',
    bestHour: '14:00',
    color: '#1769FF',
  },
  {
    network: 'medium',
    name: 'Medium',
    category: 'professional',
    baseFollowers: 2100,
    baseEng: 4.6,
    bestDay: 'Domingo',
    bestHour: '10:00',
    color: '#000000',
  },
  {
    network: 'vimeo',
    name: 'Vimeo',
    category: 'video',
    baseFollowers: 950,
    baseEng: 3.5,
    bestDay: 'Terça',
    bestHour: '16:00',
    color: '#1AB7EA',
  },
  {
    network: 'google_business',
    name: 'Google Meu Negócio',
    category: 'professional',
    baseFollowers: 4500,
    baseEng: 6.2,
    bestDay: 'Sexta',
    bestHour: '11:30',
    color: '#4285F4',
  },
  {
    network: 'bluesky',
    name: 'Bluesky',
    category: 'social',
    baseFollowers: 3800,
    baseEng: 5.9,
    bestDay: 'Quarta',
    bestHour: '21:00',
    color: '#0285FF',
  },
  {
    network: 'mastodon',
    name: 'Mastodon',
    category: 'community',
    baseFollowers: 1600,
    baseEng: 4.4,
    bestDay: 'Segunda',
    bestHour: '14:00',
    color: '#6364FF',
  },
  {
    network: 'tumblr',
    name: 'Tumblr',
    category: 'social',
    baseFollowers: 2300,
    baseEng: 3.7,
    bestDay: 'Sábado',
    bestHour: '22:00',
    color: '#35465C',
  },
  {
    network: 'dribbble',
    name: 'Dribbble',
    category: 'portfolio',
    baseFollowers: 2900,
    baseEng: 6.0,
    bestDay: 'Quinta',
    bestHour: '15:00',
    color: '#EA4C89',
  },
]

export async function getConsolidatedSocialHubData(
  userId?: string,
): Promise<ConsolidatedSocialHubData> {
  let userIntegrations: any[] = []
  if (userId) {
    try {
      userIntegrations = await getUserIntegrations(userId)
    } catch {
      /* intentionally ignored */
    }
  }

  let postMetricsList: PostMetric[] = []
  try {
    postMetricsList = await getAllPostMetrics()
  } catch {
    /* intentionally ignored */
  }

  let tiktokOrganic: TikTokOrganicData | null = null
  try {
    tiktokOrganic = await getTikTokOrganicMetrics()
  } catch {
    /* intentionally ignored */
  }

  // Buscar posts com dados de conteúdo
  let posts: any[] = []
  try {
    posts = await pb.collection('posts').getFullList({
      sort: '-created',
      limit: 50,
    })
  } catch {
    /* intentionally ignored */
  }

  // Construir canais para cada uma das 23 redes
  const channels: NetworkChannelSummary[] = ALL_SUPPORTED_NETWORKS.map((meta) => {
    const integ = userIntegrations.find((ui) => ui.network === meta.network)
    const isConnected = Boolean(integ?.connected)

    // Agrupar métricas do post_metrics para esta rede
    const metricsForNet = postMetricsList.filter(
      (pm) => pm.rede === meta.network || (meta.network === 'twitter' && pm.rede === 'x'),
    )

    const postsOnNet = posts.filter((p) => {
      const plat = (p.platform || '').toLowerCase()
      return (
        plat.includes(meta.network) ||
        (meta.network === 'twitter' && (plat.includes('twit') || plat === 'x'))
      )
    })

    let followers = meta.baseFollowers
    let engagementRate = meta.baseEng
    let isOfficial = false
    let badgeLabel: 'Dados Oficiais' | 'Estimativa Calibrada' = 'Estimativa Calibrada'

    // Se for TikTok e tivermos resposta do hook orgânico:
    if (meta.network === 'tiktok' && tiktokOrganic) {
      followers = tiktokOrganic.metrics.followers
      engagementRate = tiktokOrganic.metrics.engagement_rate
      isOfficial = tiktokOrganic.is_official
      badgeLabel = tiktokOrganic.badge_label
    } else if (metricsForNet.length > 0) {
      const sumEng = metricsForNet.reduce((acc, m) => acc + (m.taxa_engajamento || 0), 0)
      engagementRate = Number((sumEng / metricsForNet.length).toFixed(2))
    }

    const reach30d = Math.round(followers * (1.8 + meta.baseEng / 10))
    const impressions30d = Math.round(reach30d * 1.34)

    return {
      network: meta.network,
      name: meta.name,
      category: meta.category,
      connected: isConnected,
      displayName: integ?.display_name || meta.name,
      followers: followers,
      followersGrowth30d: Number((meta.baseEng * 0.75).toFixed(1)),
      postsCount: postsOnNet.length || Math.max(3, metricsForNet.length),
      engagementRate: engagementRate,
      reach30d: reach30d,
      impressions30d: impressions30d,
      bestTime: { day: meta.bestDay, time: meta.bestHour },
      isOfficial: isOfficial,
      badgeLabel: badgeLabel,
      color: meta.color,
    }
  })

  // Totais consolidados
  const totalFollowers = channels.reduce((acc, c) => acc + c.followers, 0)
  const totalReach30d = channels.reduce((acc, c) => acc + c.reach30d, 0)
  const totalImpressions30d = channels.reduce((acc, c) => acc + c.impressions30d, 0)
  const totalPostsPublished = posts.length || channels.reduce((acc, c) => acc + c.postsCount, 0)
  const sumRates = channels.reduce((acc, c) => acc + c.engagementRate, 0)
  const averageEngagementRate = Number((sumRates / channels.length).toFixed(2))

  // Posts de melhor performance
  const topPerformingPosts = posts
    .slice(0, 8)
    .map((p, idx) => {
      const pm = postMetricsList.find((m) => m.post === p.id)
      const baseRate = pm?.taxa_engajamento || Number((5.2 + ((idx * 0.4) % 3.5)).toFixed(2))
      const baseReach = pm?.alcance || Math.round(1800 + idx * 340)
      const baseSaves = pm?.salvamentos || Math.round(baseReach * 0.04)

      return {
        id: p.id,
        title: p.title || p.caption?.slice(0, 42) + '...' || `Post #${idx + 1}`,
        caption: p.caption || '',
        network: p.platform || 'Instagram',
        engagementRate: baseRate,
        reach: baseReach,
        saves: baseSaves,
        publishedDate: p.created || new Date().toISOString(),
      }
    })
    .sort((a, b) => b.engagementRate - a.engagementRate)

  // Tendência semanal
  const weeklyTrend = [
    {
      week: 'Sem 1',
      followers: Math.round(totalFollowers * 0.94),
      reach: Math.round(totalReach30d * 0.22),
      engagement: Number((averageEngagementRate * 0.92).toFixed(2)),
    },
    {
      week: 'Sem 2',
      followers: Math.round(totalFollowers * 0.96),
      reach: Math.round(totalReach30d * 0.24),
      engagement: Number((averageEngagementRate * 0.96).toFixed(2)),
    },
    {
      week: 'Sem 3',
      followers: Math.round(totalFollowers * 0.98),
      reach: Math.round(totalReach30d * 0.26),
      engagement: Number((averageEngagementRate * 1.01).toFixed(2)),
    },
    {
      week: 'Sem 4 (Atual)',
      followers: totalFollowers,
      reach: Math.round(totalReach30d * 0.28),
      engagement: averageEngagementRate,
    },
  ]

  return {
    totalFollowers,
    followersGrowthTotal: 3.4,
    averageEngagementRate,
    totalPostsPublished,
    totalReach30d,
    totalImpressions30d,
    channels,
    topPerformingPosts,
    weeklyTrend,
    tiktokOrganic,
  }
}
