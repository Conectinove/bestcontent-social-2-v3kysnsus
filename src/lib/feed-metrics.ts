import type { CommunityTopic } from '@/types/community'

export interface FeedItemMetrics {
  topicId: string
  engagement: number
  createdTime: number
}

export interface TrendBadgeInfo {
  direction: 'up' | 'down' | null
  label: string
}

export interface FeedItemInsights {
  metrics: Record<string, FeedItemMetrics>
  averageEngagement: number
  weeklyTopIds: string[]
}

/** Média móvel ponderada (50/50) entre curtidas+comentários e views. */
export function computeEngagement(topic: CommunityTopic): number {
  const interactions = (topic.likes_count || 0) + (topic.replies_count || 0)
  return interactions * 0.5 + (topic.views_count || 0) * 0.5
}

/**
 * Consolida engajamento, média do período e top itens dos últimos 7 dias.
 * Empata por engagement desc, depois pelo mais recente.
 */
export function computeFeedInsights(topics: CommunityTopic[]): FeedItemInsights {
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const metrics: Record<string, FeedItemMetrics> = {}
  let total = 0
  const weekly: FeedItemMetrics[] = []

  topics.forEach((t) => {
    const engagement = computeEngagement(t)
    const createdTime = new Date(t.created).getTime() || 0
    metrics[t.id] = { topicId: t.id, engagement, createdTime }
    total += engagement
    if (createdTime >= sevenDaysAgo) weekly.push(metrics[t.id])
  })

  const count = topics.length || 1
  const averageEngagement = total / count

  const weeklyTopIds = weekly
    .sort((a, b) => {
      if (b.engagement !== a.engagement) return b.engagement - a.engagement
      return b.createdTime - a.createdTime
    })
    .filter((m) => m.engagement > 0)
    .slice(0, 3)
    .map((m) => m.topicId)

  return { metrics, averageEngagement, weeklyTopIds }
}

/** Badge de tendência: ↑ acima da média do período, ↓ abaixo. */
export function getTrendBadge(
  metric: FeedItemMetrics | undefined,
  averageEngagement: number,
): TrendBadgeInfo {
  if (!metric || metric.engagement <= 0) return { direction: null, label: 'Sem engajamento' }

  if (metric.engagement > averageEngagement) {
    const pct = Math.round(((metric.engagement - averageEngagement) / averageEngagement) * 100)
    return { direction: 'up', label: `+${pct}% vs. média` }
  }

  if (metric.engagement < averageEngagement) {
    const pct = Math.round(((averageEngagement - metric.engagement) / averageEngagement) * 100)
    return { direction: 'down', label: `-${pct}% vs. média` }
  }

  return { direction: null, label: 'Na média' }
}
