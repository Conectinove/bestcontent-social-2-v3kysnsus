import { useEffect, useState } from 'react'
import {
  TrendingUp,
  Users,
  Eye,
  Bookmark,
  MousePointerClick,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Layers,
  Pin,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getPinterestOrganicMetrics, type PinterestOrganicData } from '@/services/pinterest-organic'
import { ReachImpressionsBlock } from './ReachImpressionsBlock'

interface PinterestFeedWidgetProps {
  onRefresh?: () => void
}

export function PinterestFeedWidget({ onRefresh }: PinterestFeedWidgetProps) {
  const [data, setData] = useState<PinterestOrganicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPinterestOrganicMetrics()
      setData(res)
    } catch (e) {
      setError('Não foi possível carregar as métricas do Pinterest.')
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
          <p className="text-sm text-destructive">{error || 'Erro ao carregar Pinterest'}</p>
          <Button size="sm" variant="outline" onClick={handleManualRefresh}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { metrics, is_official, badge_label, handle, display_name, top_pins, best_times } = data

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-4 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center font-bold text-lg border border-red-600/20">
                <Pin className="w-5 h-5 fill-red-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  {display_name}
                </CardTitle>
                <span className="text-xs text-muted-foreground">{handle}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pinterest Business · Conteúdo visual, infográficos e tráfego orgânico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5 ${
                is_official
                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10'
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
              <Users className="w-4 h-4 text-red-500" />
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
              <span className="text-xs font-medium">Impressões</span>
              <Eye className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {metrics.impressions_30d.toLocaleString('pt-BR')}
            </div>
            <span className="text-[11px] text-muted-foreground">30 dias acumulado</span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Salvamentos</span>
              <Bookmark className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {metrics.saves_30d.toLocaleString('pt-BR')}
            </div>
            <span className="text-[11px] text-muted-foreground">repins de pastas</span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Cliques de Saída</span>
              <MousePointerClick className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {metrics.outbound_clicks_30d.toLocaleString('pt-BR')}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {metrics.engagement_rate}% engajamento
            </span>
          </div>
        </div>

        {/* Bloco dedicado de Alcance e Impressões com tendência */}
        <ReachImpressionsBlock
          reach={metrics.monthly_views}
          impressions={metrics.impressions_30d}
          trendPct={metrics.followers_growth_30d ?? 14.2}
          official={is_official}
          accent="text-red-500"
        />

        {/* NOVO: Engajamento por Formato de Pin (impressões, salvamentos, cliques p/ fora) */}
        <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-red-500" />
              Engajamento por Formato de Pin
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Pin Padrão', value: metrics.pin_format_engagement?.standard ?? 4.1 },
              { label: 'Pin Vídeo', value: metrics.pin_format_engagement?.video ?? 7.8 },
              { label: 'Carrossel', value: metrics.pin_format_engagement?.carousel ?? 6.2 },
              { label: 'Rich Pin', value: metrics.pin_format_engagement?.rich ?? 5.4 },
            ].map((f) => (
              <div
                key={f.label}
                className="p-2 rounded-lg bg-card border border-border/60 text-center"
              >
                <div className="text-[10px] text-muted-foreground">{f.label}</div>
                <div className="text-sm font-black text-foreground">{f.value}%</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3 text-purple-500" />
              {(metrics.impressions_30d / 1000).toFixed(1)}k impressões
            </span>
            <span className="inline-flex items-center gap-1">
              <Bookmark className="w-3 h-3 text-amber-500" />
              {((metrics.saves_30d / metrics.impressions_30d) * 100).toFixed(1)}% salvam/impressão
            </span>
            <span className="inline-flex items-center gap-1">
              <MousePointerClick className="w-3 h-3 text-blue-500" />
              {((metrics.outbound_clicks_30d / metrics.impressions_30d) * 100).toFixed(1)}% cliques
              p/ fora
            </span>
          </div>
        </div>

        {/* Top Pins */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-500" />
              <span>Pins com Maior Tráfego & Salvamento</span>
            </h4>
            <span className="text-xs text-muted-foreground">
              {metrics.pins_published_30d} pins criados no período
            </span>
          </div>

          <div className="space-y-2.5">
            {top_pins.map((pin) => (
              <div
                key={pin.id}
                className="p-3 rounded-xl bg-card border border-border/70 hover:border-red-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">
                    {pin.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <Bookmark className="w-3 h-3" />
                      {pin.saves.toLocaleString('pt-BR')} salvamentos
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                      <MousePointerClick className="w-3 h-3" />
                      {pin.outbound_clicks.toLocaleString('pt-BR')} cliques
                    </span>
                    <span className="hidden sm:inline text-muted-foreground">
                      {pin.impressions.toLocaleString('pt-BR')} views
                    </span>
                  </div>
                </div>

                <a
                  href={pin.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold shrink-0"
                >
                  <span>Ver Pin</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Melhores Horários Recomendados */}
        {best_times && best_times.length > 0 && (
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                Melhores Horários para Publicar Pins
              </span>
              <span className="text-[11px] text-muted-foreground">Pico de cliques de saída</span>
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
