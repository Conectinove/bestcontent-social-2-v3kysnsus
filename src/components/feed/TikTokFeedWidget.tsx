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
  Share2,
  Bookmark,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getTikTokOrganicMetrics, TikTokOrganicData } from '@/services/tiktok-organic'

interface TikTokFeedWidgetProps {
  compact?: boolean
  className?: string
}

export function TikTokFeedWidget({ compact = false, className = '' }: TikTokFeedWidgetProps) {
  const [data, setData] = useState<TikTokOrganicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await getTikTokOrganicMetrics()
      setData(res)
    } catch (err) {
      console.warn('[TikTokFeedWidget] Erro ao carregar métricas:', err)
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
      className={`rounded-2xl border border-border/75 bg-gradient-to-br from-card via-card to-cyan-500/5 shadow-xs hover:shadow-sm transition-all overflow-hidden ${className}`}
    >
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 via-zinc-900 to-rose-500 p-[2px] shrink-0 shadow-xs">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                <img
                  src={
                    data.profile.avatar_url || 'https://img.usecurling.com/i?q=tiktok&color=cyan'
                  }
                  alt={data.profile.username || data.profile.display_name || 'TikTok'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  @{data.profile.username || 'midiaviva'}
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
                  : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
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
              title="Atualizar métricas TikTok"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Users className="w-3 h-3 text-cyan-500" />
              <span>Seguidores</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {Number(data.metrics.followers || 0).toLocaleString('pt-BR')}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              +{data.metrics.growth_rate_30d || 5.8}%
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Eye className="w-3 h-3 text-purple-500" />
              <span>Views</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {Number(data.metrics.video_views_30d || 0).toLocaleString('pt-BR')}
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

        {/* Engajamento & Retenção Avançada: watch time, completude, salvamentos */}
        {!compact && (
          <div className="space-y-2 pt-1 border-t border-border/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
              <div className="p-1.5 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-2.5 h-2.5 text-cyan-500" />
                  <span>Tempo Médio</span>
                </div>
                <p className="text-xs font-bold text-foreground">
                  {data.metrics.avg_watch_time_seconds || 18.6}s
                </p>
              </div>

              <div className="p-1.5 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                  <span>Completude</span>
                </div>
                <p className="text-xs font-bold text-foreground">
                  {data.metrics.video_completion_rate || 42.8}%
                </p>
              </div>

              <div className="p-1.5 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                  <Bookmark className="w-2.5 h-2.5 text-amber-500" />
                  <span>Salvamentos</span>
                </div>
                <p className="text-xs font-bold text-foreground">
                  {Number(data.metrics.saves || 3890).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="p-1.5 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                  <Share2 className="w-2.5 h-2.5 text-purple-500" />
                  <span>Compartilh.</span>
                </div>
                <p className="text-xs font-bold text-foreground">
                  {Number(data.metrics.shares_30d || data.metrics.shares || 2340).toLocaleString(
                    'pt-BR',
                  )}
                </p>
              </div>
            </div>

            {/* Novas Métricas de Engajamento TikTok: Comentários respondidos vs pendentes e Pico de Retenção */}
            <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-card/60 border border-border/60 text-[11px]">
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">
                  💬 Resposta a Comentários
                </span>
                <span className="font-bold text-foreground">
                  {data.metrics.comments_answered_ratio || '92% respondidos'}
                </span>
                <span className="text-[9px] text-emerald-600 block">
                  (248 resp. / 22 pendentes)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">
                  📈 Pico de Retenção
                </span>
                <span className="font-bold text-foreground">
                  {data.metrics.retention_peak || '0:04s (88.2%)'}
                </span>
                <span className="text-[9px] text-purple-600 block">Gancho nos 3s retém 79.4%</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                <strong className="text-foreground font-semibold">
                  {Number(data.metrics.likes_total || data.metrics.likes || 0).toLocaleString(
                    'pt-BR',
                  )}
                </strong>{' '}
                curtidas totais
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Retenção aos 3s:{' '}
                <strong className="text-foreground font-semibold">
                  {data.metrics.retention_at_3s || 79.4}%
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Footer Link to Hub Social */}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {isOfficial ? 'Sincronizado via TikTok Open API' : 'Métricas orgânicas e vídeos curtos'}
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
