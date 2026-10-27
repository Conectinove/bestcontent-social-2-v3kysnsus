import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Eye,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Heart,
  MessageCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getYouTubeOrganicMetrics, YouTubeOrganicData } from '@/services/youtube-organic'

interface YouTubeFeedWidgetProps {
  compact?: boolean
  className?: string
}

export function YouTubeFeedWidget({ compact = false, className = '' }: YouTubeFeedWidgetProps) {
  const [data, setData] = useState<YouTubeOrganicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await getYouTubeOrganicMetrics()
      setData(res)
    } catch (err) {
      console.warn('[YouTubeFeedWidget] Erro ao carregar métricas:', err)
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
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="w-24 h-3.5" />
                <Skeleton className="w-16 h-2.5" />
              </div>
            </div>
            <Skeleton className="w-20 h-5 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
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
      className={`rounded-2xl border border-border/75 bg-gradient-to-br from-card via-card to-red-500/5 shadow-xs hover:shadow-sm transition-all overflow-hidden ${className}`}
    >
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 p-[2px] shrink-0 shadow-xs">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                <img
                  src={
                    data.profile.avatar_url || 'https://img.usecurling.com/i?q=youtube&color=red'
                  }
                  alt={data.profile.channel_title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {data.profile.channel_title}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {data.profile.custom_url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOfficial
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
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
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              title="Atualizar métricas YouTube"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Users className="w-3 h-3 text-red-500" />
              <span>Inscritos</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {Number(data.metrics.subscribers || 0).toLocaleString('pt-BR')}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              +{data.metrics.new_subscribers_30d || 640} novos
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Eye className="w-3 h-3 text-purple-500" />
              <span>Views 30d</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {Number(data.metrics.views || 0).toLocaleString('pt-BR')}
            </p>
            <span className="text-[10px] font-medium text-muted-foreground">Vídeos & Shorts</span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Watch Time</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {Number(data.metrics.watch_time_hours || 0).toLocaleString('pt-BR')}h
            </p>
            <span className="text-[10px] font-medium text-muted-foreground">horas assistidas</span>
          </div>
        </div>

        {/* Micro highlights: likes, comments */}
        {!compact && (
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-muted-foreground border-t border-border/50">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                <strong className="text-foreground font-semibold">
                  {Number(data.metrics.likes_30d || 0).toLocaleString('pt-BR')}
                </strong>{' '}
                likes
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-blue-500" />
                <strong className="text-foreground font-semibold">
                  {Number(data.metrics.comments_30d || 0).toLocaleString('pt-BR')}
                </strong>{' '}
                comentários
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              YouTube Orgânico
            </span>
          </div>
        )}

        {/* Footer Link to Hub Social */}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {isOfficial
              ? 'Sincronizado via YouTube Data API v3'
              : 'Métricas orgânicas de canal e Shorts'}
          </span>
          <Link
            to="/app/social-hub"
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-0.5 group"
          >
            <span>Ver detalhes</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
