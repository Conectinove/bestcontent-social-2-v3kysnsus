import { useEffect, useState } from 'react'
import {
  Users,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Repeat2,
  Heart,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getBlueskyOrganicMetrics, type BlueskyOrganicData } from '@/services/bluesky-organic'

interface BlueskyFeedWidgetProps {
  className?: string
}

export function BlueskyFeedWidget({ className = '' }: BlueskyFeedWidgetProps) {
  const [data, setData] = useState<BlueskyOrganicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await getBlueskyOrganicMetrics()
      setData(res)
    } catch (err) {
      console.warn('[BlueskyFeedWidget] Erro ao carregar métricas:', err)
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <Card className={`rounded-2xl border border-border/70 bg-card shadow-xs ${className}`}>
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="w-28 h-3.5" />
                <Skeleton className="w-20 h-2.5" />
              </div>
            </div>
            <Skeleton className="w-24 h-5 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const isOfficial = data.is_official
  const badgeLabel = data.badge_label || (isOfficial ? 'Dados Oficiais' : 'Estimativa Calibrada')

  return (
    <Card
      className={`rounded-2xl border border-border/75 bg-gradient-to-br from-card via-card to-sky-500/5 shadow-xs hover:shadow-sm transition-all overflow-hidden ${className}`}
    >
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#0285FF] shrink-0 shadow-xs flex items-center justify-center text-white font-bold text-sm">
              <span className="text-white text-xs tracking-wider">BS</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {data.profile.display_name}
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  @{data.profile.handle}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                AT Protocol · Rede Descentralizada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOfficial
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
              }`}
            >
              {isOfficial ? (
                <ShieldCheck className="w-2.5 h-2.5 mr-1 inline" />
              ) : (
                <Sparkles className="w-2.5 h-2.5 mr-1 inline" />
              )}
              {badgeLabel}
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Atualizar dados do Bluesky"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Seguidores
              <Users className="w-3.5 h-3.5 text-sky-500" />
            </span>
            <div className="text-base sm:text-lg font-bold text-foreground mt-0.5">
              {data.metrics.followers.toLocaleString('pt-BR')}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +{data.metrics.followers_growth_30d}% 30d
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Alcance Mensal
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            </span>
            <div className="text-base sm:text-lg font-bold text-foreground mt-0.5">
              {data.metrics.reach_30d.toLocaleString('pt-BR')}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {data.metrics.impressions_30d.toLocaleString('pt-BR')} impressões
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Engajamento
              <Heart className="w-3.5 h-3.5 text-rose-500" />
            </span>
            <div className="text-base sm:text-lg font-bold text-foreground mt-0.5">
              {data.metrics.engagement_rate}%
            </div>
            <span className="text-[10px] text-muted-foreground">
              {data.metrics.likes_30d.toLocaleString('pt-BR')} curtidas
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Reposts & Respostas
              <Repeat2 className="w-3.5 h-3.5 text-emerald-500" />
            </span>
            <div className="text-base sm:text-lg font-bold text-foreground mt-0.5">
              {(data.metrics.reposts_30d + data.metrics.replies_30d).toLocaleString('pt-BR')}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {data.metrics.posts_30d} posts enviados
            </span>
          </div>
        </div>

        {/* Top Post Destaque */}
        {data.top_posts && data.top_posts.length > 0 && (
          <div className="p-2.5 rounded-xl bg-muted/15 border border-border/40 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-1 text-foreground">
                <MessageSquare className="w-3 h-3 text-[#0285FF]" /> Post mais engajado recente
              </span>
              <span>{data.top_posts[0].created_at}</span>
            </div>
            <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
              "{data.top_posts[0].text}"
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500" /> {data.top_posts[0].likes}
              </span>
              <span className="flex items-center gap-1">
                <Repeat2 className="w-3 h-3 text-emerald-500" /> {data.top_posts[0].reposts}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-sky-500" /> {data.top_posts[0].replies}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
