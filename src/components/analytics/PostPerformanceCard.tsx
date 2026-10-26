import {
  TrendingUp,
  Eye,
  Heart,
  Bookmark,
  MousePointer,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PostMetric } from '@/services/post-metrics'

interface PostPerformanceBadgeProps {
  metrics: PostMetric | null
  platform?: string
  status?: string
}

export function PostPerformanceBadge({
  metrics,
  platform = 'Instagram',
  status = 'published',
}: PostPerformanceBadgeProps) {
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

interface PostPerformanceCardProps {
  metrics: PostMetric | null
  brandAverageRate?: number
  className?: string
}

export function PostPerformanceCard({
  metrics,
  brandAverageRate = 4.8,
  className = '',
}: PostPerformanceCardProps) {
  if (!metrics) {
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

  const rateDiff = Number((metrics.taxa_engajamento - brandAverageRate).toFixed(2))
  const isAboveAverage = rateDiff >= 0

  // Mini gráfico de barras comparativo relativo
  const maxBarValue = Math.max(metrics.impressoes, metrics.alcance, 100)
  const bars = [
    { label: 'Alcance', value: metrics.alcance, color: 'bg-purple-600' },
    { label: 'Impressões', value: metrics.impressoes, color: 'bg-indigo-500' },
    { label: 'Engajamento', value: metrics.engajamento, color: 'bg-emerald-500' },
    { label: 'Cliques', value: metrics.cliques, color: 'bg-blue-500' },
    { label: 'Salvos', value: metrics.salvamentos, color: 'bg-pink-500' },
  ]

  return (
    <div
      className={`rounded-xl border border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/20 p-4 space-y-4 ${className}`}
    >
      {/* Topo do Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Performance do Post</span>
              {metrics.is_simulated && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  Estimativa Baseline
                </Badge>
              )}
            </h4>
            <p className="text-[10px] text-muted-foreground capitalize">Rede: {metrics.rede}</p>
          </div>
        </div>

        {/* Comparativo com a média */}
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

      {/* Grid de 4 Indicadores-chave */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 rounded-lg bg-card border border-border/60">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Eye className="w-3 h-3 text-purple-500" /> Alcance
          </span>
          <p className="text-sm font-black text-foreground mt-0.5">
            {metrics.alcance.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="p-2 rounded-lg bg-card border border-border/60">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-500" /> Impressões
          </span>
          <p className="text-sm font-black text-foreground mt-0.5">
            {metrics.impressoes.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="p-2 rounded-lg bg-card border border-border/60">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Heart className="w-3 h-3 text-emerald-500" /> Engajamento
          </span>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {metrics.engajamento.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="p-2 rounded-lg bg-card border border-border/60">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-pink-500" /> Salvos
          </span>
          <p className="text-sm font-black text-foreground mt-0.5">
            {metrics.salvamentos.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Mini Gráfico de Barras Horizontal */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-bold text-muted-foreground block">
          Distribuição de Interações
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
      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-muted/40 text-[10px] text-muted-foreground">
        <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p>
          {metrics.is_simulated
            ? 'Estimativa baseline calculada pelo algoritmo. Conecte sua rede social oficial em Configurações para puxar os números oficiais do servidor.'
            : 'Métricas sincronizadas diretamente via API oficial.'}
        </p>
      </div>
    </div>
  )
}
