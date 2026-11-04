import { useState, useEffect } from 'react'
import {
  Facebook,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Share2,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  ThumbsUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getFacebookOrganicMetrics,
  getFacebookOrganicStatus,
  FacebookOrganicData,
  FacebookOrganicStatusResponse,
} from '@/services/facebook-organic'

export function FacebookFeedWidget() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<FacebookOrganicData | null>(null)
  const [status, setStatus] = useState<FacebookOrganicStatusResponse | null>(null)

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)

    try {
      const [metricsRes, statusRes] = await Promise.all([
        getFacebookOrganicMetrics(),
        getFacebookOrganicStatus(),
      ])
      setData(metricsRes)
      setStatus(statusRes)
    } catch (err) {
      console.error('[FacebookFeedWidget] Erro ao carregar métricas:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <Card className="rounded-2xl border-border/80">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const metrics = data?.metrics

  return (
    <Card className="rounded-2xl border-border/80 bg-card overflow-hidden shadow-xs">
      <CardHeader className="border-b border-border/40 pb-4 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center text-[#1877F2]">
              <Facebook className="w-5 h-5 fill-[#1877F2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-black text-foreground">
                  {data?.page_name || 'Conectinove · Facebook Oficial'}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    data?.is_official
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]'
                      : 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-[10px]'
                  }
                >
                  {data?.is_official ? (
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                  ) : (
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                  )}
                  {data?.badge_label || 'Estimativa Calibrada'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {data?.page_username || '@conectinove'} · Página Comercial & Comunidade
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </Button>
            <a
              href="https://facebook.com/conectinove"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {!data?.is_official && (
          <div className="mt-3 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-start gap-2 text-[11px] text-blue-700 dark:text-blue-300">
            <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Exibindo dados com <strong>Estimativa Calibrada</strong> para o histórico da página.
              Adicione{' '}
              <code className="font-mono text-[10px] bg-blue-500/10 px-1 py-0.5 rounded">
                FACEBOOK_PAGE_ACCESS_TOKEN
              </code>{' '}
              e{' '}
              <code className="font-mono text-[10px] bg-blue-500/10 px-1 py-0.5 rounded">
                FACEBOOK_PAGE_ID
              </code>{' '}
              no painel Skip Cloud para ativar a Meta Graph API oficial em tempo real.
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Grid de KPIs principais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Seguidores / Curtidas</span>
              <ThumbsUp className="w-3.5 h-3.5 text-[#1877F2]" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-foreground">
              {metrics ? metrics.followers.toLocaleString('pt-BR') : '—'}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+{metrics?.followers_growth_30d || 18} últimos 30d</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Alcance 30d</span>
              <Users className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-foreground">
              {metrics ? metrics.reach_30d.toLocaleString('pt-BR') : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pessoas impactadas</p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Impressões 30d</span>
              <Eye className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-foreground">
              {metrics ? metrics.impressions_30d.toLocaleString('pt-BR') : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Visualizações totais</p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Engajamento Médio</span>
              <Heart className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-foreground">
              {metrics ? `${metrics.engagement_rate}%` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {(metrics?.likes || 0) + (metrics?.comments || 0) + (metrics?.shares || 0)}{' '}
              reações/mês
            </p>
          </div>
        </div>

        {/* Evolução Semanal & Melhores Horários */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#1877F2]" />
              <span>Evolução Semanal de Alcance</span>
            </h4>
            <div className="space-y-2">
              {(data?.weekly_evolution || []).map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0"
                >
                  <span className="font-semibold text-foreground">{ev.week}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {ev.reach.toLocaleString('pt-BR')} pessoas
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {ev.engagement} engaj.
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Melhores Horários para Publicar</span>
            </h4>
            <div className="space-y-2">
              {(data?.best_times || []).map((bt, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0"
                >
                  <span className="font-semibold text-foreground">{bt.day}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono">{bt.hour}</span>
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold"
                    >
                      Score {bt.score}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Posts Recentes do Facebook */}
        {data?.recent_posts && data.recent_posts.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
              <span>Publicações Recentes da Página</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.recent_posts.map((post) => (
                <div
                  key={post.id}
                  className="p-3 rounded-xl border border-border/60 bg-background hover:border-[#1877F2]/40 transition-colors flex flex-col justify-between gap-2"
                >
                  <p className="text-xs font-semibold text-foreground line-clamp-2">{post.title}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3 h-3 text-blue-500" />
                        {post.shares}
                      </span>
                    </div>
                    <span>{post.published_at}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
