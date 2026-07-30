import pb from '@/lib/pocketbase/client'
import type { SocialMetricRecord } from '@/types'

export const getSocialMetrics = (userId: string, platform?: string) => {
  let filter = `user = "${userId}"`
  if (platform && platform !== 'all' && platform !== 'Todas as redes') {
    filter += ` && platform = "${platform}"`
  }
  return pb.collection<SocialMetricRecord>('social_metrics').getFullList({
    filter,
    sort: 'date',
  })
}
