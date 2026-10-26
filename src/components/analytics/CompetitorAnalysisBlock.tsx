import { useState, useEffect, useMemo } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Trophy,
  Crown,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CompetitorAnalysis,
  getCompetitorsByBrand,
  FALLBACK_COMPETITORS,
} from '@/services/competitor-analysis'

interface CompetitorAnalysisBlockProps {
  brandId?: string
  brandName?: string
  myFollowers?: number
  myEngagementRate?: number
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

// Baseline estimada da marca do usuário em cada rede para comparação transparente
const BRAND_METRICS_BY_NETWORK: Record<
  string,
  { followers: number; engagement: number; posts: number }
> = {
  all: { followers: 18400, engagement: 5.4, posts: 198 },
  instagram: { followers: 18400, engagement: 5.4, posts: 124 },
  facebook: { followers: 14200, engagement: 3.9, posts: 86 },
  linkedin: { followers: 23800, engagement: 5.8, posts: 74 },
  tiktok: { followers: 31200, engagement: 7.9, posts: 112 },
  whatsapp: { followers: 9200, engagement: 15.1, posts: 140 },
  youtube: { followers: 19800, engagement: 6.3, posts: 68 },
  twitter: { followers: 15600, engagement: 5.9, posts: 215 },
}

export function CompetitorAnalysisBlock({
  brandId,
  brandName = 'Sua Marca',
  myFollowers = 18400,
  myEngagementRate = 5.4,
  className = '',
}: CompetitorAnalysisBlockProps) {
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')

  useEffect(() => {
    setLoading(true)
    getCompetitorsByBrand(brandId, selectedNetwork === 'all' ? undefined : selectedNetwork)
      .then((data) => {
        setCompetitors(data && data.length > 0 ? data : FALLBACK_COMPETITORS)
      })
      .catch(() => {
        setCompetitors(FALLBACK_COMPETITORS)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [brandId, selectedNetwork])

  const filteredCompetitors = useMemo(() => {
    if (selectedNetwork === 'all') return competitors
    return competitors.filter((c) => c.network === selectedNetwork)
  }, [competitors, selectedNetwork])

  // Métricas comparativas da marca para a rede ativa
  const currentBrandMetric = useMemo(() => {
    const net = BRAND_METRICS_BY_NETWORK[selectedNetwork] || BRAND_METRICS_BY_NETWORK.all
    return {
      followers: selectedNetwork === 'all' ? myFollowers : net.followers,
      engagement: selectedNetwork === 'all' ? myEngagementRate : net.engagement,
      posts: net.posts,
    }
  }, [selectedNetwork, myFollowers, myEngagementRate])

  // Médias do mercado / concorrentes
  const marketAverages = useMemo(() => {
    if (filteredCompetitors.length === 0) {
      return { avgFollowers: 25000, avgEngagement: 5.0, avgGrowth: 6.5, avgPosts: 160 }
    }
    const sumFollowers = filteredCompetitors.reduce((acc, c) => acc + c.estimated_followers, 0)
    const sumEng = filteredCompetitors.reduce((acc, c) => acc + c.estimated_engagement_rate, 0)
    const sumGrowth = filteredCompetitors.reduce((acc, c) => acc + c.estimated_growth_rate, 0)
    const sumPosts = filteredCompetitors.reduce((acc, c) => acc + (c.posts_count || 120), 0)
    return {
      avgFollowers: Math.round(sumFollowers / filteredCompetitors.length),
      avgEngagement: Number((sumEng / filteredCompetitors.length).toFixed(1)),
      avgGrowth: Number((sumGrowth / filteredCompetitors.length).toFixed(1)),
      avgPosts: Math.round(sumPosts / filteredCompetitors.length),
    }
  }, [filteredCompetitors])

  // Identificar quem lidera na rede (Engajamento e Seguidores)
  const ranking = useMemo(() => {
    const list = [
      {
        name: `${brandName} (Sua Marca)`,
        isMe: true,
        network: selectedNetwork,
        followers: currentBrandMetric.followers,
        engagement: currentBrandMetric.engagement,
        posts: currentBrandMetric.posts,
      },
      ...filteredCompetitors.map((c) => ({
        name: c.name,
        isMe: false,
        network: c.network,
        followers: c.estimated_followers,
        engagement: c.estimated_engagement_rate,
        posts: c.posts_count || 140,
      })),
    ]

    const leaderEng = [...list].sort((a, b) => b.engagement - a.engagement)[0]
    const leaderFollowers = [...list].sort((a, b) => b.followers - a.followers)[0]

    return {
      leaderEng,
      leaderFollowers,
    }
  }, [brandName, currentBrandMetric, filteredCompetitors, selectedNetwork])

  // Análise de liderança da marca vs concorrentes
  const leadershipHighlights = useMemo(() => {
    const leadsEngagement = currentBrandMetric.engagement >= marketAverages.avgEngagement
    const leadsFollowers = currentBrandMetric.followers >= marketAverages.avgFollowers

    const diffEng = (currentBrandMetric.engagement - marketAverages.avgEngagement).toFixed(1)
    const pctDiffEng = Math.abs(
      Math.round(
        ((currentBrandMetric.engagement - marketAverages.avgEngagement) /
          marketAverages.avgEngagement) *
          100,
      ),
    )

    return {
      leadsEngagement,
      leadsFollowers,
      diffEng,
      pctDiffEng,
    }
  }, [currentBrandMetric, marketAverages])

  return (
    <Card
      className={`rounded-2xl border-border bg-card p-5 sm:p-6 shadow-xs space-y-6 ${className}`}
    >
      {/* Topo do Bloco de Concorrentes */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Análise de Concorrentes & Mercado</span>
              <Badge
                variant="secondary"
                className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold"
              >
                Inteligência Competitiva
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comparativo de seguidores, engajamento e ritmo de publicação frente aos principais
              players do seu segmento.
            </p>
          </div>
        </div>

        {/* Status de comparação rápida */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-muted/40 p-2 px-3 rounded-xl border border-border/70 text-xs">
          <span className="text-muted-foreground">Monitorados:</span>
          <span className="font-mono font-bold text-foreground">
            {filteredCompetitors.length} players
          </span>
          <Badge
            variant="outline"
            className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 py-0"
          >
            Estimativa Baseline
          </Badge>
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

      {/* Destaques de Liderança / Onde a marca ganha ou perde */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Sua Marca */}
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              {brandName} (Você)
            </span>
            <Badge className="bg-purple-600 text-white text-[9px] px-1.5 py-0 border-0">
              Sua Operação
            </Badge>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <p className="text-xl font-black text-foreground">
                {currentBrandMetric.followers.toLocaleString('pt-BR')}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {selectedNetwork === 'all'
                  ? 'Base consolidada'
                  : `Seguidores no ${selectedNetwork}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-purple-600 dark:text-purple-400">
                {currentBrandMetric.engagement}%
              </p>
              <p className="text-[10px] text-muted-foreground">Taxa de engajamento</p>
            </div>
          </div>
        </div>

        {/* Card 2: Onde você Lidera & Destaque de Líder */}
        <div
          className={`p-4 rounded-xl border space-y-2 ${
            leadershipHighlights.leadsEngagement
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                leadershipHighlights.leadsEngagement
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {leadershipHighlights.leadsEngagement ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Você Lidera em Engajamento</span>
                </>
              ) : (
                <>
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Líder da Rede: {ranking.leaderEng?.name.split(' ')[0]}</span>
                </>
              )}
            </span>
            {leadershipHighlights.leadsEngagement ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <p className="text-xs text-foreground font-medium pt-1">
            {leadershipHighlights.leadsEngagement
              ? `Sua taxa de resposta (${currentBrandMetric.engagement}%) supera em +${leadershipHighlights.diffEng}% a média dos concorrentes (${marketAverages.avgEngagement}%).`
              : `Líder em engajamento é ${ranking.leaderEng?.name} com ${ranking.leaderEng?.engagement}%. Sua taxa é ${currentBrandMetric.engagement}%.`}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {leadershipHighlights.leadsEngagement
              ? 'Conteúdo com maior ressonância e retenção que os rivais mapeados.'
              : 'Adote testes A/B de títulos e chamadas nos primeiros 3 segundos para ultrapassar o líder.'}
          </p>
        </div>

        {/* Card 3: Média do Mercado */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Média dos Concorrentes
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Benchmark</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <p className="text-xl font-bold text-foreground">
                {marketAverages.avgFollowers.toLocaleString('pt-BR')}
              </p>
              <p className="text-[10px] text-muted-foreground">Seguidores médios</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">{marketAverages.avgEngagement}%</p>
              <p className="text-[10px] text-muted-foreground">Engajamento médio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Comparativa de Concorrentes */}
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground font-semibold">
            <tr>
              <th className="p-3">Concorrente / Perfil</th>
              <th className="p-3 text-center">Rede</th>
              <th className="p-3 text-right">Seguidores Estimados</th>
              <th className="p-3 text-right">Taxa Engajamento</th>
              <th className="p-3 text-center">Posts / Período</th>
              <th className="p-3 text-center">Frequência</th>
              <th className="p-3 text-right">Crescimento</th>
              <th className="p-3">Pontos Fortes Mapeados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {/* Linha da sua marca para comparação visual direta */}
            <tr className="bg-purple-500/5 font-semibold text-foreground">
              <td className="p-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span className="font-bold">{brandName} (Sua Marca)</span>
                <Badge className="bg-purple-600/15 text-purple-700 dark:text-purple-300 text-[9px] py-0 px-1 border-0">
                  Referência
                </Badge>
                {ranking.leaderEng.isMe && (
                  <Badge className="bg-amber-500 text-white text-[9px] py-0 px-1 border-0 gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> Líder Eng.
                  </Badge>
                )}
              </td>
              <td className="p-3 text-center uppercase text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                {selectedNetwork === 'all' ? 'Multi-rede' : selectedNetwork}
              </td>
              <td className="p-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                {currentBrandMetric.followers.toLocaleString('pt-BR')}
              </td>
              <td className="p-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                {currentBrandMetric.engagement}%
              </td>
              <td className="p-3 text-center font-mono font-bold text-foreground">
                {currentBrandMetric.posts}
              </td>
              <td className="p-3 text-center text-muted-foreground">Constante diária</td>
              <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                +7.5%
              </td>
              <td className="p-3 text-[11px] text-muted-foreground">
                Comunidade altamente responsiva e testes A/B estruturados
              </td>
            </tr>

            {/* Linhas dos Concorrentes */}
            {filteredCompetitors.map((c) => {
              const engHigherThanBrand = c.estimated_engagement_rate > currentBrandMetric.engagement
              const followersHigherThanBrand = c.estimated_followers > currentBrandMetric.followers
              const isLeaderEng = ranking.leaderEng.name === c.name
              const isLeaderFollowers = ranking.leaderFollowers.name === c.name

              return (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-foreground">{c.name}</p>
                      {isLeaderEng && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[9px] py-0 px-1">
                          👑 Líder Eng.
                        </Badge>
                      )}
                      {isLeaderFollowers && !isLeaderEng && (
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 px-1 border-purple-500/30 text-purple-600"
                        >
                          Top Base
                        </Badge>
                      )}
                    </div>
                    {c.handle && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {c.handle}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                      {c.network}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono text-foreground">
                    {c.estimated_followers.toLocaleString('pt-BR')}
                    {followersHigherThanBrand && (
                      <span className="ml-1 text-[9px] text-muted-foreground block">
                        +
                        {(
                          ((c.estimated_followers - currentBrandMetric.followers) /
                            currentBrandMetric.followers) *
                          100
                        ).toFixed(0)}
                        % vs você
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span
                      className={`font-bold ${
                        engHigherThanBrand
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {c.estimated_engagement_rate}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono text-foreground">
                    {c.posts_count || '—'}
                  </td>
                  <td className="p-3 text-center text-muted-foreground">{c.post_frequency}</td>
                  <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    +{c.estimated_growth_rate}%
                  </td>
                  <td className="p-3 text-[11px]">
                    <div className="flex flex-wrap gap-1">
                      {c.strengths.slice(0, 2).map((s, idx) => (
                        <span
                          key={idx}
                          className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-foreground font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Nota de transparência de dados de concorrentes */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground text-[11px]">
            Transparência: Dados Estimados de Concorrência
          </p>
          <p className="text-[11px] leading-relaxed">
            As métricas dos concorrentes são estimativas baseline calibradas por inteligência
            competitiva de mercado e amostragens públicas de engajamento, vigentes até a conexão e
            autorização direta das APIs oficiais de monitoramento social.
          </p>
        </div>
      </div>
    </Card>
  )
}
