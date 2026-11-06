import { useEffect, useState } from 'react'
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Repeat,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Quote,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getThreadsOrganicMetrics, type ThreadsOrganicData } from '@/services/threads-organic'

interface ThreadsFeedWidgetProps {
  onRefresh?: () => void
}

export function ThreadsFeedWidget({ onRefresh }: ThreadsFeedWidgetProps) {
  const [data, setData] = useState<ThreadsOrganicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getThreadsOrganicMetrics()
      setData(res)
    } catch (e) {
      setError('Não foi possível carregar as métricas do Threads.')
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
          <Skeleton className="h-32 rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30 bg-card">
        <CardContent className="py-6 text-center space-y-3">
          <p className="text-sm text-destructive">{error || 'Erro ao carregar Threads'}</p>
          <Button size="sm" variant="outline" onClick={handleManualRefresh}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { metrics, is_official, badge_label, handle, display_name, bio, top_threads, best_times } =
    data

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-4 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center font-black text-xl border border-border">
                @
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  {display_name}
                </CardTitle>
                <span className="text-xs text-muted-foreground">{handle}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {bio || 'Threads Orgânico · Conversas, conexões e alcance em tempo real'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5 ${
                is_official
                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'border-muted-foreground/40 text-foreground bg-muted/30'
              }`}
            >
              {is_official ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Dados Oficiais</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{badge_label}</span>
                </>
              )}
            </Badge>

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleManualRefresh}
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* KPI Grid (4 colunas) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Seguidores</span>
              <Users className="w-4 h-4 text-foreground" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {metrics.followers.toLocaleString('pt-BR')}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              +{metrics.followers_growth_30d}% em 30d
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Visualizações</span>
              <Eye className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {metrics.views_30d.toLocaleString('pt-BR')}
            </div>
            <span className="text-[11px] text-muted-foreground">30 dias acumulado</span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Interações</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {(metrics.likes_30d + metrics.replies_30d + metrics.reposts_30d).toLocaleString(
                'pt-BR',
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              curtidas + respostas + reposts
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Taxa de Engajamento</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-foreground">{metrics.engagement_rate}%</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              acima da média
            </span>
          </div>
        </div>

        {/* Micro highlights: likes, replies, reposts */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <strong className="text-foreground font-semibold">
                {metrics.likes_30d.toLocaleString('pt-BR')}
              </strong>{' '}
              curtidas
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
              <strong className="text-foreground font-semibold">
                {metrics.replies_30d.toLocaleString('pt-BR')}
              </strong>{' '}
              respostas
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-emerald-500" />
              <strong className="text-foreground font-semibold">
                {metrics.reposts_30d.toLocaleString('pt-BR')}
              </strong>{' '}
              reposts
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {metrics.threads_published_30d} threads no mês
          </span>
        </div>

        {/* NOVO: Respostas, Republicações, Citações e Alcance por Formato */}
        <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-foreground" />
              Conversa & Alcance por Formato
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-semibold ${
                is_official
                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : 'border-muted-foreground/40 text-muted-foreground'
              }`}
            >
              {is_official ? 'Dados Oficiais' : 'Estimativa Calibrada'}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-card border border-border/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <MessageCircle className="w-3 h-3 text-blue-500" /> Respostas
              </div>
              <div className="text-sm font-black text-foreground">
                {metrics.replies_30d.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-card border border-border/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Repeat className="w-3 h-3 text-emerald-500" /> Republicações
              </div>
              <div className="text-sm font-black text-foreground">
                {metrics.reposts_30d.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-card border border-border/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Quote className="w-3 h-3 text-purple-500" /> Citações
              </div>
              <div className="text-sm font-black text-foreground">
                {metrics.quotes_30d.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Texto', value: metrics.reach_by_format?.text ?? 21400 },
              { label: 'Foto', value: metrics.reach_by_format?.photo ?? 11800 },
              { label: 'Vídeo', value: metrics.reach_by_format?.video ?? 14600 },
              { label: 'Link', value: metrics.reach_by_format?.link ?? 7100 },
            ].map((f) => (
              <div
                key={f.label}
                className="p-2 rounded-lg bg-card border border-border/60 text-center"
              >
                <div className="text-[10px] text-muted-foreground">Alcance · {f.label}</div>
                <div className="text-sm font-black text-foreground">
                  {(f.value / 1000).toFixed(1)}k
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Threads */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-foreground" />
              <span>Threads de Maior Repercussão</span>
            </h4>
          </div>

          <div className="space-y-2.5">
            {top_threads.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-foreground/30 transition-colors space-y-2"
              >
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">{item.text}</p>
                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" />
                      {item.likes}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-blue-500" />
                      {item.replies}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Repeat className="w-3 h-3 text-emerald-500" />
                      {item.reposts}
                    </span>
                    <span className="hidden sm:inline text-muted-foreground">
                      {item.views.toLocaleString('pt-BR')} visualizações
                    </span>
                  </div>

                  <a
                    href={item.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-foreground font-semibold hover:underline"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Melhores Horários Recomendados */}
        {best_times && best_times.length > 0 && (
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-foreground" />
                Melhores Janelas de Discussão no Threads
              </span>
              <span className="text-[11px] text-muted-foreground">Pico de respostas</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {best_times.map((bt, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-card/80 border border-border/60 text-center"
                >
                  <div className="text-xs font-bold text-foreground">
                    {bt.day} · {bt.hour}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Índice {Math.round(bt.score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
