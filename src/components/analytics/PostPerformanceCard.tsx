import { useState, useMemo } from 'react'
import {
  TrendingUp,
  Eye,
  Heart,
  Bookmark,
  Info,
  Layers,
  Sparkles,
  ExternalLink,
  Users2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PostMetric } from '@/services/post-metrics'
import { useNavigate } from 'react-router-dom'

interface PostPerformanceBadgeProps {
  metrics: PostMetric | null
  platform?: string
  status?: string
}

export function PostPerformanceBadge({ metrics, status = 'published' }: PostPerformanceBadgeProps) {
  if (status !== 'published') {
    return (
      <Badge
        variant="outline"
        className="text-[10px] bg-muted/60 text-muted-foreground border-dashed"
      >
        Métricas disponíveis após publicação
      </Badge>
    )
  }

  if (!metrics) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 gap-1"
      >
        <Sparkles className="w-3 h-3" />
        <span>Conecte a rede para métricas reais</span>
      </Badge>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-bold">
      <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
      <span>{metrics.taxa_engajamento}% engaj.</span>
      <span className="text-muted-foreground font-normal">
        · {metrics.alcance >= 1000 ? `${(metrics.alcance / 1000).toFixed(1)}k` : metrics.alcance}{' '}
        alc.
      </span>
      {metrics.is_simulated && (
        <span className="text-[9px] font-normal uppercase text-muted-foreground ml-0.5 bg-muted/60 px-1.5 py-0.2 rounded">
          Estimado
        </span>
      )}
    </div>
  )
}

const NETWORK_LABELS: Record<string, { label: string; badgeClass: string }> = {
  all: {
    label: 'Consolidado',
    badgeClass: 'bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  },
  instagram: {
    label: 'Instagram',
    badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  },
  facebook: {
    label: 'Facebook',
    badgeClass: 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20',
  },
  linkedin: {
    label: 'LinkedIn',
    badgeClass: 'bg-[#0077b5]/10 text-[#0077b5] dark:text-[#0077b5] border-[#0077b5]/20',
  },
  whatsapp: {
    label: 'WhatsApp',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  tiktok: {
    label: 'TikTok',
    badgeClass: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-300 border-cyan-500/20',
  },
  youtube: {
    label: 'YouTube',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
  twitter: {
    label: 'Twitter / X',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  },
}

interface PostPerformanceCardProps {
  metrics: PostMetric | null
  networkMetricsList?: PostMetric[]
  brandAverageRate?: number
  className?: string
  brandId?: string
  showAudienceLink?: boolean
}

export function PostPerformanceCard({
  metrics,
  networkMetricsList = [],
  brandAverageRate = 4.8,
  className = '',
  brandId,
  showAudienceLink = true,
}: PostPerformanceCardProps) {
  const navigate = useNavigate()

  // Lista de métricas disponíveis: se houver lista por rede, usa-a; senão usa a métrica única
  const allList = useMemo(() => {
    if (networkMetricsList && networkMetricsList.length > 0) {
      return networkMetricsList
    }
    return metrics ? [metrics] : []
  }, [networkMetricsList, metrics])

  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')

  // Métrica consolidada de todas as redes da lista
  const consolidatedMetric = useMemo<PostMetric | null>(() => {
    if (allList.length === 0) return metrics
    if (allList.length === 1) return allList[0]

    const totalAlcance = allList.reduce((acc, m) => acc + m.alcance, 0)
    const totalImpressoes = allList.reduce((acc, m) => acc + m.impressoes, 0)
    const totalEngajamento = allList.reduce((acc, m) => acc + m.engajamento, 0)
    const totalCliques = allList.reduce((acc, m) => acc + m.cliques, 0)
    const totalSalvamentos = allList.reduce((acc, m) => acc + m.salvamentos, 0)
    const taxaMedia =
      totalImpressoes > 0 ? Number(((totalEngajamento / totalImpressoes) * 100).toFixed(2)) : 0

    return {
      id: 'consolidated',
      post: allList[0].post,
      rede: 'all',
      alcance: totalAlcance,
      impressoes: totalImpressoes,
      engajamento: totalEngajamento,
      cliques: totalCliques,
      salvamentos: totalSalvamentos,
      taxa_engajamento: taxaMedia,
      is_simulated: allList.some((m) => m.is_simulated),
    }
  }, [allList, metrics])

  // Métrica ativa com base na aba selecionada
  const activeMetric = useMemo(() => {
    if (selectedNetwork === 'all') return consolidatedMetric
    return allList.find((m) => m.rede === selectedNetwork) || consolidatedMetric
  }, [selectedNetwork, allList, consolidatedMetric])

  if (!activeMetric) {
    return (
      <div
        className={`p-4 rounded-xl border border-dashed border-border text-center space-y-1.5 bg-muted/20 ${className}`}
      >
        <p className="text-xs font-bold text-foreground">Aguardando dados da publicação</p>
        <p className="text-[11px] text-muted-foreground">
          Conecte a conta oficial nas Configurações para sincronizar métricas reais em tempo real.
        </p>
      </div>
    )
  }

  const rateDiff = Number((activeMetric.taxa_engajamento - brandAverageRate).toFixed(2))
  const isAboveAverage = rateDiff >= 0

  const maxBarValue = Math.max(activeMetric.impressoes, activeMetric.alcance, 100)
  const bars = [
    { label: 'Alcance', value: activeMetric.alcance, color: 'bg-purple-600' },
    { label: 'Impressões', value: activeMetric.impressoes, color: 'bg-indigo-500' },
    { label: 'Engajamento', value: activeMetric.engajamento, color: 'bg-emerald-500' },
    { label: 'Cliques', value: activeMetric.cliques, color: 'bg-blue-500' },
    { label: 'Salvos', value: activeMetric.salvamentos, color: 'bg-pink-500' },
  ]

  const netCfg = NETWORK_LABELS[activeMetric.rede] || {
    label: activeMetric.rede,
    badgeClass: 'bg-purple-500/10 text-purple-600',
  }

  return (
    <div
      className={`rounded-2xl border border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/20 p-4 sm:p-5 space-y-4 ${className}`}
    >
      {/* Topo do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Performance por Rede</span>
              {activeMetric.is_simulated && (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 px-1.5 py-0"
                >
                  Estimativa Baseline
                </Badge>
              )}
            </h4>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>Visualizando:</span>
              <span className="font-semibold text-foreground">{netCfg.label}</span>
              {allList.length > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  ({allList.length} redes de destino)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Comparativo vs Média + Atalho para Audiência */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {showAudienceLink && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate(`/app/dashboard?tab=audience${brandId ? `&brandId=${brandId}` : ''}`)
              }}
              className="text-xs h-7 px-2.5 gap-1.5 rounded-xl border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
              title="Explorar análise demográfica da audiência"
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Ver Audiência</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Button>
          )}

          <div className="text-right">
            <span
              className={`text-xs font-black inline-flex items-center gap-0.5 ${
                isAboveAverage
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {isAboveAverage ? '▲ +' : '▼ '}
              {Math.abs(rateDiff)}%
            </span>
            <p className="text-[9px] text-muted-foreground">vs. média ({brandAverageRate}%)</p>
          </div>
        </div>
      </div>

      {/* Abas seletoras por rede de destino (Multi-Rede) */}
      {allList.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 pt-1 border-y border-purple-500/20">
          <button
            type="button"
            onClick={() => setSelectedNetwork('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
              selectedNetwork === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-card/70 text-muted-foreground hover:text-foreground hover:bg-card border border-border/60'
            }`}
          >
            📊 Consolidado ({allList.length})
          </button>

          {allList.map((m) => {
            const isSelected = selectedNetwork === m.rede
            const netItem = NETWORK_LABELS[m.rede] || { label: m.rede }
            return (
              <button
                key={m.id || m.rede}
                type="button"
                onClick={() => setSelectedNetwork(m.rede)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-card/70 text-muted-foreground hover:text-foreground hover:bg-card border border-border/60'
                }`}
              >
                <span>{netItem.label}</span>
                <span className="text-[9px] opacity-80 font-mono">{m.taxa_engajamento}%</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Grid de 4 Indicadores-chave */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
            <Eye className="w-3 h-3 text-purple-500" /> Alcance
          </span>
          <p className="text-sm font-black text-foreground mt-1">
            {activeMetric.alcance.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
            <Layers className="w-3 h-3 text-indigo-500" /> Impressões
          </span>
          <p className="text-sm font-black text-foreground mt-1">
            {activeMetric.impressoes.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
            <Heart className="w-3 h-3 text-emerald-500" /> Engajamento
          </span>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {activeMetric.engajamento.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
            <Bookmark className="w-3 h-3 text-pink-500" /> Salvos
          </span>
          <p className="text-sm font-black text-foreground mt-1">
            {activeMetric.salvamentos.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Tabela rápida de comparação entre redes (quando há mais de uma) */}
      {allList.length > 1 && (
        <div className="p-3 rounded-xl bg-card/60 border border-border/60 space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Comparativo Direto por Rede de Destino
          </span>
          <div className="space-y-1.5">
            {allList.map((m) => {
              const netInfo = NETWORK_LABELS[m.rede] || { label: m.rede }
              return (
                <div
                  key={m.id || m.rede}
                  onClick={() => setSelectedNetwork(m.rede)}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    selectedNetwork === m.rede
                      ? 'bg-purple-500/15 border border-purple-500/30'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{netInfo.label}</span>
                    {m.is_simulated && (
                      <span className="text-[9px] text-muted-foreground bg-muted/60 px-1 py-0.2 rounded">
                        Estimado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-muted-foreground">
                      Alc:{' '}
                      <strong className="text-foreground">
                        {m.alcance.toLocaleString('pt-BR')}
                      </strong>
                    </span>
                    <span className="text-muted-foreground">
                      Interações: <strong className="text-foreground">{m.engajamento}</strong>
                    </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {m.taxa_engajamento}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mini Gráfico de Barras Horizontal */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-bold text-muted-foreground block">
          Distribuição de Interações ({netCfg.label})
        </span>
        <div className="space-y-1.5">
          {bars.map((bar) => {
            const pct = Math.max(8, Math.min(100, Math.round((bar.value / maxBarValue) * 100)))
            return (
              <div key={bar.label} className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">{bar.label}</span>
                  <span className="font-mono font-bold text-foreground">
                    {bar.value.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${bar.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Nota de transparência honesta */}
      <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-muted/40 text-[10px] text-muted-foreground border border-border/50">
        <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {activeMetric.is_simulated
            ? 'Aviso de Transparência: estes valores são estimativas baseline calibradas por inteligência artificial até a conexão real e autorizada das credenciais de API das redes sociais em Configurações.'
            : 'Métricas sincronizadas diretamente via API oficial da plataforma conectada.'}
        </p>
      </div>
    </div>
  )
}
