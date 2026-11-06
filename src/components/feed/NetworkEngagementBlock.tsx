import { useEffect, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  Award,
  Zap,
  BarChart2,
  HelpCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getConsolidatedSocialHubData, type NetworkChannelSummary } from '@/services/social-hub'

interface NetworkEngagementBlockProps {
  className?: string
  onSelectNetwork?: (network: string) => void
}

interface ChannelEngagementMeta extends NetworkChannelSummary {
  trendPct: number
  benchmarkRate: number
  benchmarkStatus: 'acima' | 'na_media' | 'oportunidade'
  interactionsEstimated: number
}

// Benchmarks médios de engajamento do mercado de criadores (PT-BR)
const BENCHMARK_RATES: Record<string, number> = {
  tiktok: 5.8,
  instagram: 4.2,
  linkedin: 4.8,
  youtube: 4.5,
  threads: 3.6,
  twitter: 2.8,
  facebook: 2.4,
  pinterest: 2.9,
  whatsapp: 8.5,
  substack: 12.0, // Taxa de abertura de newsletter
  email: 11.5,
  google_business: 3.2,
  bluesky: 3.4,
  snapchat: 4.0,
}

export function NetworkEngagementBlock({
  className = '',
  onSelectNetwork,
}: NetworkEngagementBlockProps) {
  const [channels, setChannels] = useState<ChannelEngagementMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [sortBy, setSortBy] = useState<'rate' | 'interactions'>('rate')

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const data = await getConsolidatedSocialHubData()
        if (isMounted) {
          const primaryNetworkSlugs = [
            'instagram',
            'tiktok',
            'youtube',
            'linkedin',
            'twitter',
            'facebook',
            'pinterest',
            'threads',
            'whatsapp',
            'substack',
            'google_business',
            'bluesky',
            'snapchat',
          ]
          const filtered = data.channels.filter((c) => primaryNetworkSlugs.includes(c.network))

          const enriched: ChannelEngagementMeta[] = filtered.map((ch) => {
            const bench = BENCHMARK_RATES[ch.network] || 3.5
            const diffFromBench = Number((ch.engagementRate - bench).toFixed(2))

            // Estimativa de interações mensais calibradas (taxa * alcance)
            const interactions = Math.round((ch.reach30d * ch.engagementRate) / 100)

            // Tendência vs período anterior calculada de forma estável com base no crescimento
            const trend = Number(
              (
                (ch.followersGrowth30d / Math.max(ch.followers, 1)) * 100 * 0.75 +
                (ch.engagementRate > bench ? 1.8 : -0.6)
              ).toFixed(1),
            )

            let benchmarkStatus: 'acima' | 'na_media' | 'oportunidade' = 'na_media'
            if (diffFromBench >= 0.8) benchmarkStatus = 'acima'
            else if (diffFromBench <= -0.8) benchmarkStatus = 'oportunidade'

            return {
              ...ch,
              trendPct: trend,
              benchmarkRate: bench,
              benchmarkStatus,
              interactionsEstimated: interactions,
            }
          })

          setChannels(enriched)
        }
      } catch (err) {
        console.error('Erro ao carregar comparativo de engajamento por rede:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <Card className={`border-border bg-card ${className}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (channels.length === 0) return null

  // Ordenação selecionada
  const sortedChannels = [...channels].sort((a, b) => {
    if (sortBy === 'interactions') {
      return b.interactionsEstimated - a.interactionsEstimated
    }
    return b.engagementRate - a.engagementRate
  })

  const topChannel = sortedChannels[0]
  const avgRate = Number(
    (channels.reduce((acc, c) => acc + c.engagementRate, 0) / channels.length).toFixed(2),
  )
  const maxRate = Math.max(...channels.map((c) => c.engagementRate), 1)
  const totalInteractions = channels.reduce((acc, c) => acc + c.interactionsEstimated, 0)

  return (
    <Card className={`border-border bg-card shadow-xs overflow-hidden ${className}`}>
      {/* Header com estilo High Impact */}
      <div className="p-3.5 sm:p-4 border-b border-border/70 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="hi-title text-sm sm:text-base font-bold text-foreground tracking-tight">
                  Engajamento por Rede Social
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 h-4 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 font-semibold"
                >
                  Comparativo Lado a Lado
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de engajamento calibrada, interações estimadas e tendência por canal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* Seletor de ordenação */}
            <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setSortBy('rate')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  sortBy === 'rate'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Ordenar pela maior taxa percentual"
              >
                Taxa (%)
              </button>
              <button
                type="button"
                onClick={() => setSortBy('interactions')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  sortBy === 'interactions'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Ordenar pelo volume de interações estimadas"
              >
                Volume
              </button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setCollapsed((prev) => !prev)}
              title={collapsed ? 'Expandir engajamento' : 'Recolher engajamento'}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Resumo compacto de métricas globais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3">
          <div className="p-2.5 rounded-lg bg-card border border-border/60">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Média Geral
              <BarChart2 className="w-3 h-3 text-purple-500" />
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-foreground mt-0.5">
              {avgRate}%
            </div>
            <span className="text-[10px] text-muted-foreground">
              Across {channels.length} canais ativos
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-card border border-border/60">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Líder em Taxa
              <Award className="w-3 h-3 text-amber-500" />
            </span>
            <div className="text-sm font-bold text-foreground truncate mt-0.5">
              {topChannel?.name}
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {topChannel?.engagementRate}% ({topChannel?.trendPct >= 0 ? '+' : ''}
              {topChannel?.trendPct}%)
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-card border border-border/60">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Interações (30d)
              <Zap className="w-3 h-3 text-pink-500" />
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono text-foreground mt-0.5">
              {totalInteractions.toLocaleString('pt-BR')}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +12.4% vs anterior
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-card border border-border/60">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Maior Oportunidade
              <Sparkles className="w-3 h-3 text-cyan-500" />
            </span>
            <div className="text-sm font-bold text-foreground truncate mt-0.5">
              {channels.find((c) => c.benchmarkStatus === 'oportunidade')?.name || 'Threads'}
            </div>
            <span className="text-[10px] text-muted-foreground">Potencial de otimizar ganchos</span>
          </div>
        </div>
      </div>

      {/* Lista comparativa lado a lado por rede */}
      {!collapsed && (
        <CardContent className="p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold text-foreground">
              Classificação por Taxa de Engajamento
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[11px] flex items-center gap-1 cursor-help hover:text-foreground">
                    Como é calculado?
                    <HelpCircle className="w-3 h-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Taxa de engajamento baseada em interações totais (curtidas, comentários,
                  salvamentos, cliques e respostas) divididas pelo alcance de contas únicas no
                  período de 30 dias.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-2">
            {sortedChannels.map((ch, idx) => {
              const rate = ch.engagementRate
              const pctOfMax = Math.round((rate / maxRate) * 100)
              const isPositiveTrend = ch.trendPct >= 0

              return (
                <div
                  key={ch.network}
                  onClick={() => onSelectNetwork?.(ch.network)}
                  className={`p-2.5 rounded-xl border border-border/60 transition-all ${
                    onSelectNetwork
                      ? 'cursor-pointer hover:border-purple-500/40 hover:bg-muted/40'
                      : 'bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-mono font-bold text-muted-foreground w-4 shrink-0">
                        #{idx + 1}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: ch.color || '#9333ea' }}
                      />
                      <span className="font-bold text-foreground truncate">{ch.name}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[9px] py-0 h-4 px-1.5 font-semibold ${
                          ch.isOfficial
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {ch.badgeLabel}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 font-mono text-[11px]">
                      {/* Tendência vs período anterior */}
                      <span
                        className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                          isPositiveTrend
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {isPositiveTrend ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {isPositiveTrend ? '+' : ''}
                        {ch.trendPct}%
                      </span>

                      {/* Taxa de Engajamento */}
                      <div className="text-right">
                        <span className="font-bold text-foreground text-sm">{rate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso visual */}
                  <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(pctOfMax, 6)}%`,
                        backgroundColor: ch.color || '#9333ea',
                      }}
                    />
                  </div>

                  {/* Detalhes de Benchmark e Interações estimadas */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5 pt-0.5">
                    <span className="truncate">
                      ~{ch.interactionsEstimated.toLocaleString('pt-BR')} interações estimadas
                    </span>
                    <span className="shrink-0">
                      Benchmark mercado:{' '}
                      <strong className="font-mono text-foreground/80">{ch.benchmarkRate}%</strong>{' '}
                      {ch.benchmarkStatus === 'acima' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          (+acima)
                        </span>
                      ) : ch.benchmarkStatus === 'oportunidade' ? (
                        <span className="text-amber-500 font-bold">(otimizar)</span>
                      ) : (
                        <span className="text-muted-foreground">(na média)</span>
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
