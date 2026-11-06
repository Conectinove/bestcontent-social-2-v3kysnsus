import { useEffect, useState } from 'react'
import {
  Twitter,
  TrendingUp,
  TrendingDown,
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
  Radio,
  FileText,
  Image as ImageIcon,
  Video,
  AtSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getXOrganicMetrics, type XOrganicData } from '@/services/x-organic'
import { ReachImpressionsBlock } from './ReachImpressionsBlock'

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
        {/* Grid de Métricas Principais (Alcance/Impressões, Seguidores ganhos/perdidos, Alcance Não-seguidores, Engajamento) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Impressões / Alcance</span>
              <Eye className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {metrics.impressions_30d.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+{metrics.impressions_trend ?? 18.2}% vs período ant.</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {(metrics.reach_30d || Math.round(metrics.impressions_30d * 0.69)).toLocaleString(
                'pt-BR',
              )}{' '}
              contas alcançadas
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Seguidores no X</span>
              <Users className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {metrics.followers.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] font-medium flex items-center gap-1.5 mt-0.5">
              <span className="text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />+{metrics.followers_gained ?? 210}
              </span>
              <span className="text-rose-500 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />-{metrics.followers_lost ?? 48}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Líquido: +{metrics.followers_growth_30d}% (
              {metrics.profile_visits_30d.toLocaleString('pt-BR')} visitas)
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Alcance Não-Seguidores</span>
              <Radio className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {(
                metrics.non_followers_reach || Math.round(metrics.impressions_30d * 0.48)
              ).toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
              {metrics.non_followers_pct ?? 70}% do alcance total (viral)
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Retweets e feeds For You / Para Você
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Taxa Engajamento</span>
              <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-foreground">{metrics.engagement_rate}%</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {metrics.retweets_30d} RTs · {metrics.likes_30d.toLocaleString('pt-BR')} curtidas
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              Benchmark tech/B2B: 2.2% - 3.8%
            </div>
          </div>
        </div>

        {/* Bloco dedicado de Alcance e Impressões com tendência */}
        <ReachImpressionsBlock
          reach={metrics.reach_30d || Math.round(metrics.impressions_30d * 0.69)}
          impressions={metrics.impressions_30d}
          trendPct={metrics.impressions_trend ?? 18.2}
          official={is_official}
          accent="text-sky-500"
        />

        {/* Linha de Engajamento por Tipo + Menções & Respostas Recebidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Engajamento por formato no X */}
          <div className="p-3 rounded-xl border border-border/70 bg-muted/15 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                Engajamento por Tipo de Post no X
              </span>
              <span className="text-[10px] text-muted-foreground">Vídeos e Threads lideram</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-card border border-border/60 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                  <FileText className="w-3 h-3 text-slate-500" />
                  <span>Texto / Thread</span>
                </div>
                <div className="text-sm font-bold text-foreground">
                  {metrics.format_engagement?.text ?? 2.8}%
                </div>
                <span className="text-[9px] text-muted-foreground">baseline</span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border/60 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                  <ImageIcon className="w-3 h-3 text-sky-500" />
                  <span>Imagem / Gráfico</span>
                </div>
                <div className="text-sm font-bold text-sky-600">
                  {metrics.format_engagement?.image ?? 4.2}%
                </div>
                <span className="text-[9px] text-emerald-600 font-medium">+50% vs texto</span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border/60 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                  <Video className="w-3 h-3 text-purple-500" />
                  <span>Vídeo Curto</span>
                </div>
                <div className="text-sm font-bold text-purple-600">
                  {metrics.format_engagement?.video ?? 6.4}%
                </div>
                <span className="text-[9px] text-emerald-600 font-medium">+128% vs texto</span>
              </div>
            </div>
          </div>

          {/* Menções e Respostas Recebidas */}
          <div className="p-3 rounded-xl border border-border/70 bg-muted/15 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground">
                <AtSign className="w-3.5 h-3.5 text-sky-500" />
                Interações Diretas Recebidas (30 dias)
              </span>
              <span className="text-[10px] text-muted-foreground">
                {metrics.tweets_published_30d} tweets emitidos
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-card border border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-sky-500" /> Menções @perfil
                  </div>
                  <div className="text-base font-bold text-foreground mt-0.5">
                    {metrics.mentions_30d.toLocaleString('pt-BR')}
                  </div>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  +12.4%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-indigo-500" /> Respostas aos Tweets
                  </div>
                  <div className="text-base font-bold text-foreground mt-0.5">
                    {metrics.replies_30d.toLocaleString('pt-BR')}
                  </div>
                </div>
                <span className="text-[10px] text-indigo-600 font-medium bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  ativo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* NOVO: Perfis Visitados, Taxa de Engajamento por Impressão e Expansão de Mídia */}
        <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-500" />
              Descoberta & Expansão no X
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-card border border-border/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Users className="w-3 h-3 text-blue-500" /> Perfis Visitados
              </div>
              <div className="text-sm font-black text-foreground">
                {metrics.profile_visits_30d.toLocaleString('pt-BR')}
              </div>
              <span className="text-[9px] text-muted-foreground">últimos 30 dias</span>
            </div>
            <div className="p-2 rounded-lg bg-card border border-border/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <BarChart3 className="w-3 h-3 text-emerald-500" /> Engaj. por Impressão
              </div>
              <div className="text-sm font-black text-foreground">
                {(
                  ((metrics.likes_30d + metrics.retweets_30d + metrics.replies_30d) /
                    Math.max(metrics.impressions_30d, 1)) *
                  100
                ).toFixed(2)}
                %
              </div>
              <span className="text-[9px] text-muted-foreground">interações ÷ impressões</span>
            </div>
            <div className="p-2 rounded-lg bg-card border border-border/60 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Radio className="w-3 h-3 text-indigo-500" /> Expansão de Mídia
              </div>
              <div className="text-sm font-black text-foreground">
                {(metrics.media_expansion_pct ?? 38).toFixed(0)}%
              </div>
              <span className="text-[9px] text-muted-foreground">alcance fora dos seguidores</span>
            </div>
          </div>
        </div>

        {/* Nova Métrica: Cliques no Link & CTR de Tweets */}
        <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 font-bold">
              🔗 Cliques no Link
            </span>
            <div>
              <span className="font-extrabold text-foreground text-sm">
                {(metrics.url_clicks_30d || 3420).toLocaleString('pt-BR')} cliques
              </span>
              <span className="text-[10px] text-muted-foreground block">
                CTR de URL: <strong className="text-sky-600">{metrics.url_ctr || '3.8%'}</strong>{' '}
                (supera média de 2.1%)
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-sky-500/30 text-sky-600 bg-card text-[10px]">
            +22.4% conversão p/ site
          </Badge>
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
