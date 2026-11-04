import { useEffect, useState } from 'react'
import {
  Twitter,
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  Repeat,
  Heart,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  BarChart3,
  RefreshCw,
  Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getXOrganicMetrics, type XOrganicData } from '@/services/x-organic'

interface XFeedWidgetProps {
  onRefresh?: () => void
}

export function XFeedWidget({ onRefresh }: XFeedWidgetProps) {
  const [data, setData] = useState<XOrganicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getXOrganicMetrics()
      setData(res)
    } catch (e) {
      setError('Não foi possível carregar as métricas do X.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleManualRefresh = () => {
    loadData()
    onRefresh?.()
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-36 rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30 bg-card">
        <CardContent className="py-6 text-center space-y-3">
          <p className="text-sm text-destructive">{error || 'Erro ao carregar dados do X'}</p>
          <Button size="sm" variant="outline" onClick={handleManualRefresh}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { metrics, is_official, badge_label, handle, display_name, top_tweets, best_times } = data

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-4 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-zinc-800 text-white flex items-center justify-center font-bold shadow-xs">
              <Twitter className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  {display_name}
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">{handle}</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <span>X / Twitter Orgânico</span>
                <span>•</span>
                <span>Últimos 30 dias</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                is_official
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold gap-1'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold gap-1'
              }
            >
              {is_official ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {badge_label}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  {badge_label}
                </>
              )}
            </Badge>

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleManualRefresh}
              title="Recarregar métricas"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* Grid de Métricas Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Seguidores</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {metrics.followers.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+{metrics.followers_growth_30d}% este mês</span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Impressões</span>
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {metrics.impressions_30d.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {metrics.profile_visits_30d.toLocaleString('pt-BR')} visitas ao perfil
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Taxa Engajamento</span>
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-foreground">{metrics.engagement_rate}%</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {metrics.retweets_30d} retweets totais
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Tweets Publicados</span>
              <Send className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-foreground">{metrics.tweets_published_30d}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {metrics.likes_30d.toLocaleString('pt-BR')} curtidas somadas
            </div>
          </div>
        </div>

        {/* Melhores Horários para Publicar no X */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-muted/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-500" />
              Melhores Horários Recomendados no X
            </span>
            <span className="text-muted-foreground text-[11px]">Score de engajamento</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {best_times.map((bt, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-card border border-border/60 text-center space-y-0.5"
              >
                <div className="text-xs font-bold text-foreground">{bt.day}</div>
                <div className="text-[11px] font-mono text-sky-600 dark:text-sky-400">
                  {bt.hour}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Índice {(bt.score * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tweets Recentes */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tweets com Maior Retenção & Alcance
            </h4>
            <span className="text-[11px] text-muted-foreground">
              {top_tweets.length} tweets selecionados
            </span>
          </div>

          <div className="space-y-2">
            {top_tweets.map((tweet) => (
              <div
                key={tweet.id}
                className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-foreground/20 transition-all space-y-2"
              >
                <p className="text-xs text-foreground/90 leading-relaxed line-clamp-3">
                  {tweet.text}
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" />
                      {tweet.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3 h-3 text-emerald-500" />
                      {tweet.retweets}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-sky-500" />
                      {tweet.replies}
                    </span>
                    {tweet.impressions > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {tweet.impressions.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <a
                    href={tweet.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <span>Abrir no X</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
