import { useState, useEffect, useMemo } from 'react'
import {
  Users2,
  PieChart,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  TrendingUp,
  Download,
  Filter,
  Check,
  FileSpreadsheet,
  FileText,
  Activity,
  Repeat,
  HeartHandshake,
  BarChart3,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  getAudienceInsights,
  getFallbackAudienceInsight,
  getNetworkAudienceComparisons,
  AudienceInsight,
  WeeklyGrowthItem,
  RetentionMetrics,
} from '@/services/audience-insights'

interface AudienceAnalysisBlockProps {
  brandId?: string
  brandName?: string
  selectedPeriod?: string
  className?: string
}

const NETWORK_BUTTONS: { key: string; label: string }[] = [
  { key: 'all', label: 'Todas as Redes' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'twitter', label: 'Twitter / X' },
]

export function AudienceAnalysisBlock({
  brandId,
  brandName = 'Sua Marca',
  selectedPeriod = '30d',
  className = '',
}: AudienceAnalysisBlockProps) {
  const { toast } = useToast()
  const [insight, setInsight] = useState<AudienceInsight | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  // Configuração personalizável de quais painéis de audiência exibir
  const [visiblePanels, setVisiblePanels] = useState<{
    age: boolean
    gender: boolean
    cities: boolean
    times: boolean
    growth: boolean
    retention: boolean
    networkComparison: boolean
  }>({
    age: true,
    gender: true,
    cities: true,
    times: true,
    growth: true,
    retention: true,
    networkComparison: true,
  })

  useEffect(() => {
    setLoading(true)
    getAudienceInsights(brandId, selectedNetwork)
      .then((data) => {
        if (data) {
          setInsight(data)
        } else {
          setInsight(getFallbackAudienceInsight(selectedNetwork))
        }
      })
      .catch(() => {
        setInsight(getFallbackAudienceInsight(selectedNetwork))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [brandId, selectedNetwork])

  const periodMultiplier = useMemo(() => {
    if (selectedPeriod === '7d') return 0.7
    if (selectedPeriod === '90d') return 1.3
    return 1.0
  }, [selectedPeriod])

  const effectiveTotal = useMemo(() => {
    if (!insight) return 15000
    return Math.round(insight.total_followers_tracked * periodMultiplier)
  }, [insight, periodMultiplier])

  const togglePanel = (
    key: 'age' | 'gender' | 'cities' | 'times' | 'growth' | 'retention' | 'networkComparison',
  ) => {
    setVisiblePanels((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      const anyActive = Object.values(next).some(Boolean)
      if (!anyActive) return prev
      return next
    })
  }

  // Exportar Relatório de Audiência Personalizado isolado em CSV
  const handleExportCSV = () => {
    if (!insight) return

    const lines: string[] = []
    lines.push(`Relatório de Audiência Personalizado - MidiaViva`)
    lines.push(`Marca:;${brandName}`)
    lines.push(`Rede Social:;${selectedNetwork.toUpperCase()}`)
    lines.push(`Período:;${selectedPeriod}`)
    lines.push(`Base Monitorada:;${effectiveTotal}`)
    lines.push(``)

    if (visiblePanels.age) {
      lines.push(`FAIXA ETÁRIA;PORCENTAGEM (%)`)
      insight.age_distribution.forEach((item) => {
        lines.push(`${item.range};${item.percentage}%`)
      })
      lines.push(``)
    }

    if (visiblePanels.gender) {
      lines.push(`DISTRIBUIÇÃO DE GÊNERO;PORCENTAGEM (%)`)
      lines.push(`Feminino;${insight.gender_distribution.female}%`)
      lines.push(`Masculino;${insight.gender_distribution.male}%`)
      lines.push(`Outros/Não especificado;${insight.gender_distribution.other}%`)
      lines.push(``)
    }

    if (visiblePanels.cities) {
      lines.push(`TOP CIDADES & REGIÕES;PORCENTAGEM (%)`)
      insight.top_cities.forEach((c) => {
        lines.push(`${c.city};${c.percentage}%`)
      })
      lines.push(``)
    }

    if (visiblePanels.times) {
      lines.push(`HORÁRIOS NOBRES DE ENGAJAMENTO;PONTUAÇÃO (SCORE)`)
      insight.best_times.forEach((t) => {
        lines.push(`${t.day} às ${t.hour};${t.score} pts`)
      })
      lines.push(``)
      lines.push(`Pico Geral:;${insight.engagement_peak_day} às ${insight.engagement_peak_hour}`)
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-audiencia-${selectedNetwork}-${selectedPeriod}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Relatório CSV exportado!',
      description: `Arquivo com os dados de audiência da rede ${selectedNetwork.toUpperCase()} salvo.`,
    })
  }

  // Exportar Relatório de Audiência Personalizado isolado em PDF (Impressão)
  const handleExportPDF = () => {
    toast({
      title: 'Gerando Relatório de Audiência...',
      description: 'Preparando layout para impressão e salvamento em PDF.',
    })
    window.print()
  }

  if (!insight) return null

  const gender = insight.gender_distribution || { female: 54, male: 43, other: 3 }
  const citiesList = insight.top_cities || []

  return (
    <Card
      className={`rounded-2xl border-border bg-card p-5 sm:p-6 shadow-xs space-y-6 ${className}`}
    >
      {/* Topo do Bloco de Audiência */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Relatório de Audiência Personalizável</span>
              <Badge
                variant="secondary"
                className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold"
              >
                Insights Demográficos
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escolha quais painéis exibir, selecione as redes e exporte o relatório de audiência
              isolado em PDF ou CSV.
            </p>
          </div>
        </div>

        {/* Ações de Exportação e Status da Amostra */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-8 px-2.5 rounded-xl gap-1 border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="text-xs h-8 px-2.5 rounded-xl gap-1 border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </Button>

          <div className="flex items-center gap-2 bg-muted/40 p-1.5 px-3 rounded-xl border border-border/70 text-xs">
            <span className="text-muted-foreground">Base:</span>
            <span className="font-mono font-bold text-foreground">
              {effectiveTotal.toLocaleString('pt-BR')} seguidores
            </span>
            <Badge
              variant="outline"
              className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 py-0"
            >
              Estimativa Baseline
            </Badge>
          </div>
        </div>
      </div>

      {/* Controles de Personalização de Painéis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Filter className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Exibir Painéis de Audiência:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: 'growth' as const, label: 'Evolução Semanal' },
            { key: 'retention' as const, label: 'Retenção & Fidelidade' },
            { key: 'networkComparison' as const, label: 'Comparativo entre Redes' },
            { key: 'age' as const, label: 'Faixa Etária' },
            { key: 'gender' as const, label: 'Gênero' },
            { key: 'cities' as const, label: 'Cidades' },
            { key: 'times' as const, label: 'Horários Nobres' },
          ].map((item) => {
            const active = visiblePanels[item.key]
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => togglePanel(item.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  active
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {active && <Check className="w-3 h-3" />}
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Seletor de Redes Sociais */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {NETWORK_BUTTONS.map((btn) => {
          const active = selectedNetwork === btn.key
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => setSelectedNetwork(btn.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                active
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {btn.label}
            </button>
          )
        })}
      </div>

      {/* NOVO BLOCO 1: Evolução Semanal da Audiência & Retenção Recorrente */}
      {(visiblePanels.growth || visiblePanels.retention) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Evolução Semanal (8 Semanas) */}
          {visiblePanels.growth && (
            <div
              className={`p-5 rounded-2xl bg-muted/30 border border-border/70 space-y-4 ${
                visiblePanels.retention ? 'lg:col-span-7' : 'lg:col-span-12'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Evolução Semanal da Audiência (Últimas 8 semanas)
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Crescimento líquido e taxa média de novos seguidores na rede{' '}
                      {selectedNetwork.toUpperCase()}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-purple-500/30 text-purple-600 bg-purple-500/5"
                >
                  Tendência Positiva
                </Badge>
              </div>

              {/* Mini gráfico em barras da evolução */}
              <div className="space-y-3">
                <div className="grid grid-cols-8 gap-2 items-end h-32 pt-4 px-1">
                  {(insight.weekly_growth || []).map((w, idx) => {
                    const maxFollowers = Math.max(
                      ...(insight.weekly_growth || []).map((item) => item.followers),
                    )
                    const minFollowers = Math.min(
                      ...(insight.weekly_growth || []).map((item) => item.followers),
                    )
                    const range = Math.max(maxFollowers - minFollowers, 100)
                    const heightPercent = Math.max(
                      20,
                      Math.round(((w.followers - minFollowers) / range) * 75 + 25),
                    )
                    const isLast = idx === (insight.weekly_growth || []).length - 1

                    return (
                      <div
                        key={w.week}
                        className="flex flex-col items-center gap-1.5 h-full justify-end"
                      >
                        <span className="text-[9px] font-mono text-muted-foreground">
                          +{w.growthRate}%
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                            isLast
                              ? 'bg-purple-600 shadow-xs'
                              : 'bg-purple-400/40 hover:bg-purple-400/70'
                          }`}
                          title={`${w.week}: ${w.followers.toLocaleString('pt-BR')} seguidores (+${w.netGain})`}
                        />
                        <span
                          className={`text-[9px] font-bold ${
                            isLast
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {w.week}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center">
                  <div className="p-2 rounded-xl bg-card border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">Ganho Líquido</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      +
                      {(insight.weekly_growth || [])
                        .reduce((acc, curr) => acc + curr.netGain, 0)
                        .toLocaleString('pt-BR')}{' '}
                      seg.
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-card border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">
                      Taxa Média/Semana
                    </span>
                    <span className="text-xs font-black text-foreground font-mono">
                      +
                      {(
                        (insight.weekly_growth || []).reduce(
                          (acc, curr) => acc + curr.growthRate,
                          0,
                        ) / Math.max((insight.weekly_growth || []).length, 1)
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-card border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">
                      Base Atual Projetada
                    </span>
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400 font-mono">
                      {(
                        insight.weekly_growth?.[insight.weekly_growth.length - 1]?.followers ||
                        effectiveTotal
                      ).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Retenção & Engajamento Recorrente */}
          {visiblePanels.retention && (
            <div
              className={`p-5 rounded-2xl bg-muted/30 border border-border/70 space-y-4 ${
                visiblePanels.growth ? 'lg:col-span-5' : 'lg:col-span-12'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Retenção & Engajamento Recorrente
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Fidelidade e frequência de retorno
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                >
                  Score {insight.retention_metrics?.retentionScore || 82}/100
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-purple-500" /> Engajadores Recorrentes
                      </span>
                    </div>
                    <p className="text-base font-black text-foreground">
                      {insight.retention_metrics?.returningEngagersRate || 46}%
                    </p>
                    <span className="text-[9px] text-muted-foreground block">
                      Interagem em mais de 1 post por mês
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-blue-500" /> Frequência Média
                      </span>
                    </div>
                    <p className="text-base font-black text-foreground">
                      {insight.retention_metrics?.averageSessionsPerWeek || 3.9}x
                    </p>
                    <span className="text-[9px] text-muted-foreground block">
                      Visualizações semanais por usuário
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-[11px] text-purple-700 dark:text-purple-300">
                    <span>Base Fiel Estimada:</span>
                    <span className="font-mono">
                      {(insight.retention_metrics?.loyalAudienceCount || 7200).toLocaleString(
                        'pt-BR',
                      )}{' '}
                      seguidores
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Taxa Salvar / Compartilhar de{' '}
                    <strong>{insight.retention_metrics?.saveToShareRatio || 1.5}x</strong>,
                    indicando alto valor educativo e propensão de consumo contínuo da marca.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOVO BLOCO 2: Comparativo da Audiência entre Redes da Mesma Marca */}
      {visiblePanels.networkComparison && (
        <div className="p-5 rounded-2xl bg-muted/30 border border-border/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  Comparativo de Audiência entre Redes da Mesma Marca
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Identifique como o perfil de público e o comportamento variam em cada canal
                </p>
              </div>
            </div>

            <Badge
              variant="secondary"
              className="text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
            >
              6 Redes Mapeadas
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {getNetworkAudienceComparisons().map((item) => (
              <div
                key={item.network}
                className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-purple-500/40 transition-all space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      {item.label}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono py-0 font-bold text-purple-600"
                    >
                      Engaj. {item.engagementRate}%
                    </Badge>
                  </div>

                  <div className="space-y-1 text-[11px] pt-1 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Faixa Dominante:</span>
                      <span className="font-semibold text-foreground">{item.primaryAgeGroup}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Gênero Predominante:</span>
                      <span className="font-semibold text-foreground">{item.genderDominance}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground pt-2 mt-2 border-t border-border/40 leading-relaxed">
                    💡 <strong>Insight:</strong> {item.keyInsight}
                  </p>
                </div>

                <div className="p-1.5 rounded-lg bg-muted/60 text-[10px] text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 shrink-0 text-purple-600" />
                  <span className="truncate">Formato ideal: {item.bestContentType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid de Métricas de Audiência Dinâmico conforme Seleção */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Painel 1: Faixa Etária */}
        {visiblePanels.age && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-500" /> Faixa Etária
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Top: 25-34 anos</span>
              </div>

              <div className="space-y-2 pt-1">
                {insight.age_distribution.map((item) => {
                  const isTop = item.range === '25-34'
                  return (
                    <div key={item.range} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={isTop ? 'font-bold text-foreground' : 'text-muted-foreground'}
                        >
                          {item.range} anos
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isTop ? 'bg-purple-600' : 'bg-purple-400/50'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
              66% da sua base está na faixa de alta decisão profissional (25 a 44 anos).
            </p>
          </div>
        )}

        {/* Painel 2: Distribuição por Gênero */}
        {visiblePanels.gender && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-pink-500" /> Distribuição de Gênero
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Consolidado</span>
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex h-3 w-full rounded-full overflow-hidden">
                  <div
                    className="bg-pink-500"
                    style={{ width: `${gender.female}%` }}
                    title={`Feminino: ${gender.female}%`}
                  />
                  <div
                    className="bg-blue-500"
                    style={{ width: `${gender.male}%` }}
                    title={`Masculino: ${gender.male}%`}
                  />
                  <div
                    className="bg-amber-500"
                    style={{ width: `${gender.other}%` }}
                    title={`Outros: ${gender.other}%`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                    <p className="text-[10px] text-pink-600 dark:text-pink-400 font-bold">
                      Feminino
                    </p>
                    <p className="text-sm font-black text-foreground">{gender.female}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      Masculino
                    </p>
                    <p className="text-sm font-black text-foreground">{gender.male}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      Outros
                    </p>
                    <p className="text-sm font-black text-foreground">{gender.other}%</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
              Público equilibrado, ideal para comunicação inclusiva e tom direto.
            </p>
          </div>
        )}

        {/* Painel 3: Principais Cidades / Localizações */}
        {visiblePanels.cities && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Top Cidades & Regiões
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Brasil</span>
              </div>

              <div className="space-y-2 pt-1">
                {citiesList.map((c, idx) => {
                  return (
                    <div key={c.city} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center font-bold text-[9px] text-muted-foreground shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate text-foreground/90 font-medium">{c.city}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {c.percentage}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
              Mais de 60% da audiência concentrada nos grandes pólos econômicos do Sudeste e Sul.
            </p>
          </div>
        )}

        {/* Painel 4: Melhores Dias e Horários */}
        {visiblePanels.times && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Horários de Pico
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 py-0"
                >
                  Score 0-100
                </Badge>
              </div>

              <div className="space-y-2 pt-1">
                {insight.best_times.slice(0, 4).map((t) => {
                  return (
                    <div
                      key={`${t.day}-${t.hour}`}
                      className="p-1.5 px-2 rounded-lg bg-card border border-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium text-foreground">{t.day}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          {t.hour}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">
                          {t.score} pts
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300 font-medium flex items-center justify-between">
              <span>Maior pico semanal:</span>
              <span className="font-bold">
                {insight.engagement_peak_day} às {insight.engagement_peak_hour}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Nota de transparência de dados */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground text-[11px]">
            Transparência: Dados Demográficos e Estimativa Baseline
          </p>
          <p className="text-[11px] leading-relaxed">
            Os dados demográficos e horários nobres refletem a amostragem calibrada de engajamento
            do seu público e padrões de mercado para cada rede, vigentes até a autorização de
            leitura das APIs oficiais.
          </p>
        </div>
      </div>
    </Card>
  )
}
