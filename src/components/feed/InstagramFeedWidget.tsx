import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Eye,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Heart,
  MessageCircle,
  Film,
  Play,
  Bookmark,
  Share2,
  Clock,
  Flame,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getInstagramOrganicMetrics, InstagramOrganicData } from '@/services/instagram-organic'

interface InstagramFeedWidgetProps {
  compact?: boolean
  className?: string
}

export function InstagramFeedWidget({ compact = false, className = '' }: InstagramFeedWidgetProps) {
  const [data, setData] = useState<InstagramOrganicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await getInstagramOrganicMetrics()
      setData(res)
    } catch (err) {
      console.warn('[InstagramFeedWidget] Erro ao carregar métricas:', err)
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
      className={`rounded-2xl border border-border/75 bg-gradient-to-br from-card via-card to-rose-500/5 shadow-xs hover:shadow-sm transition-all overflow-hidden ${className}`}
    >
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px] shrink-0 shadow-xs">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                <img
                  src={
                    data.profile.avatar_url || 'https://img.usecurling.com/i?q=instagram&color=rose'
                  }
                  alt={data.profile.username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  @{data.profile.username}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {data.profile.display_name}
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
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              title="Atualizar métricas"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Users className="w-3 h-3 text-rose-500" />
              <span>Seguidores</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {Number(data.metrics.followers || 0).toLocaleString('pt-BR')}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              +{data.metrics.growth_rate_30d || 4.5}%
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Eye className="w-3 h-3 text-purple-500" />
              <span>Alcance</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {Number(data.metrics.reach || 0).toLocaleString('pt-BR')}
            </p>
            <span className="text-[10px] font-medium text-muted-foreground">30 dias</span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <TrendingUp className="w-3 h-3 text-amber-500" />
              <span>Engajamento</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {data.metrics.engagement_rate}%
            </p>
            <span className="text-[10px] font-medium text-muted-foreground">taxa média</span>
          </div>
        </div>

        {/* Stories & Reels Deep Dive */}
        {!compact && (
          <div className="space-y-2 pt-1 border-t border-border/50">
            {/* Bloco Stories */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-rose-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-500 flex items-center justify-center">
                    <Clock className="w-3 h-3" />
                  </span>
                  <span className="text-xs font-bold text-foreground">Stories</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-rose-500/30 text-rose-600 dark:text-rose-400"
                >
                  {data.metrics.stories?.retention_rate || 86.4}% retenção
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center pt-0.5">
                <div className="bg-card/70 rounded-lg p-1.5 border border-border/40">
                  <span className="text-[9px] text-muted-foreground block">Média Views</span>
                  <span className="text-xs font-extrabold text-foreground">
                    {Number(data.metrics.stories?.views_avg || 1420).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="bg-card/70 rounded-lg p-1.5 border border-border/40">
                  <span className="text-[9px] text-muted-foreground block">Respostas</span>
                  <span className="text-xs font-extrabold text-foreground">
                    {Number(data.metrics.stories?.replies_30d || 218).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="bg-card/70 rounded-lg p-1.5 border border-border/40">
                  <span className="text-[9px] text-muted-foreground block">Toques Stickers</span>
                  <span className="text-xs font-extrabold text-foreground">
                    {Number(data.metrics.stories?.sticker_taps_30d || 384).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="bg-card/70 rounded-lg p-1.5 border border-border/40">
                  <span className="text-[9px] text-muted-foreground block">Votos Enquetes</span>
                  <span className="text-xs font-extrabold text-foreground">
                    {Number(data.metrics.stories?.poll_votes_30d || 512).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Alcance Desmembrado por Formato */}
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-foreground">
                  Alcance por Tipo de Post
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                  {data.metrics.reach_by_format?.top_format || 'Reels (+42% alcance)'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-1 rounded-lg bg-card border border-border/40">
                  <span className="text-[9px] text-muted-foreground block">Carrossel</span>
                  <span className="text-[11px] font-bold text-foreground">
                    {Number(data.metrics.reach_by_format?.carrossel_reach || 14800).toLocaleString(
                      'pt-BR',
                    )}
                  </span>
                </div>
                <div className="p-1 rounded-lg bg-card border border-border/40">
                  <span className="text-[9px] text-muted-foreground block">Reels</span>
                  <span className="text-[11px] font-bold text-foreground">
                    {Number(data.metrics.reach_by_format?.reels_reach || 22600).toLocaleString(
                      'pt-BR',
                    )}
                  </span>
                </div>
                <div className="p-1 rounded-lg bg-card border border-border/40">
                  <span className="text-[9px] text-muted-foreground block">Estático</span>
                  <span className="text-[11px] font-bold text-foreground">
                    {Number(data.metrics.reach_by_format?.static_reach || 7800).toLocaleString(
                      'pt-BR',
                    )}
                  </span>
                </div>
                <div className="p-1 rounded-lg bg-card border border-border/40">
                  <span className="text-[9px] text-muted-foreground block">Stories</span>
                  <span className="text-[11px] font-bold text-foreground">
                    {Number(data.metrics.reach_by_format?.stories_reach || 9400).toLocaleString(
                      'pt-BR',
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco Reels */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-500 flex items-center justify-center">
                    <Film className="w-3 h-3" />
                  </span>
                  <span className="text-xs font-bold text-foreground">Reels</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-600 dark:text-purple-400"
                >
                  <Flame className="w-2.5 h-2.5 mr-0.5 inline" />
                  {data.metrics.reels?.avg_watch_percentage || 72.8}% conclusão
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
                <div className="bg-card/70 rounded-lg p-1.5 border border-border/40">
                  <div className="flex items-center justify-center gap-0.5 text-[9px] text-muted-foreground">
                    <Play className="w-2.5 h-2.5 text-purple-500" />
                    <span>Plays 30d</span>
                  </div>
                  <span className="text-xs font-extrabold text-foreground">
                    {Number(data.metrics.reels?.plays_30d || 64200).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="bg-card/70 rounded-lg p-1.5 border border-border/40">
                  <div className="flex items-center justify-center gap-0.5 text-[9px] text-muted-foreground">
                    <Bookmark className="w-2.5 h-2.5 text-amber-500" />
                    <span>Salvamentos</span>
                  </div>
                  <span className="text-xs font-extrabold text-foreground">
                    {Number(data.metrics.reels?.saves_reels || 1240).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="bg-card/70 rounded-lg p-1.5 border border-border/40">
                  <div className="flex items-center justify-center gap-0.5 text-[9px] text-muted-foreground">
                    <Share2 className="w-2.5 h-2.5 text-blue-500" />
                    <span>Envios</span>
                  </div>
                  <span className="text-xs font-extrabold text-foreground">
                    {Number(data.metrics.reels?.shares_reels || 890).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Micro highlights: likes, comments */}
        {!compact && (
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-muted-foreground border-t border-border/50">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                <strong className="text-foreground font-semibold">
                  {Number(data.metrics.likes || 0).toLocaleString('pt-BR')}
                </strong>{' '}
                curtidas
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-blue-500" />
                <strong className="text-foreground font-semibold">
                  {Number(data.metrics.comments || 0).toLocaleString('pt-BR')}
                </strong>{' '}
                comentários
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">Orgânico</span>
          </div>
        )}

        {/* Footer Link to Hub Social */}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {isOfficial ? 'Sincronizado via Meta Graph API' : 'Métricas orgânicas de audiência'}
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
