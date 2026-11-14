import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { TrendBadgeInfo } from '@/lib/feed-metrics'

interface FeedTrendBadgeProps {
  trend: TrendBadgeInfo
}

/** Badge de tendência de engajamento (↑ verde acima da média, ↓ vermelho abaixo). */
export function FeedTrendBadge({ trend }: FeedTrendBadgeProps) {
  if (!trend.direction) return null

  const isUp = trend.direction === 'up'
  return (
    <Badge
      variant="outline"
      title={trend.label}
      className={`gap-0.5 text-[10px] font-bold px-1.5 py-0 rounded shrink-0 ${
        isUp
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
      }`}
    >
      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {trend.direction === 'up' ? '↑' : '↓'}
    </Badge>
  )
}
