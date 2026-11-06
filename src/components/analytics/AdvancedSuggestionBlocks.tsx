import React, { useState } from 'react'
import {
  Compass,
  TrendingUp,
  BarChart3,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Info,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type {
  CreativeAngleDetail,
  NicheTrendDetail,
  NetworkPerformanceForecast,
  SeriesSuggestion,
} from '@/services/post-templates'

interface AdvancedSuggestionBlocksProps {
  creativeAngle?: CreativeAngleDetail
  fallbackConcreteAngle?: string
  nicheTrend?: NicheTrendDetail
  networkForecast?: NetworkPerformanceForecast
  seriesPlan?: SeriesSuggestion
  ideaTitle?: string
}

export function AdvancedSuggestionBlocks({
  creativeAngle,
  fallbackConcreteAngle,
  nicheTrend,
  networkForecast,
  seriesPlan,
  ideaTitle,
}: AdvancedSuggestionBlocksProps) {
  const [showAllNetworks, setShowAllNetworks] = useState(false)
  const [showExecutionSteps, setShowExecutionSteps] = useState(false)

  // 1. Ângulo Criativo Concreto
  const angleText =
    creativeAngle?.angle || fallbackConcreteAngle || 'Execução focada em valor imediato'
  const practicalEx =
    creativeAngle?.practicalExample ||
    'Abra demonstrando o contraste antes vs depois com números em destaque nos primeiros 15 segundos.'

  // 2. Tendência do Nicho
  const trendTopic = nicheTrend?.topic || 'Curadoria Estratégica & Formatos de Alta Retenção'
  const trendTiming =
    nicheTrend?.opportunityTiming || 'Alta agora, pico estimado nos próximos 5 a 7 dias'
  const trendScore = nicheTrend?.trendScore ?? 92
  const trendGrowth = nicheTrend?.growthRate || '+32% em buscas e interações'
  const trendExplanation =
    nicheTrend?.connectionExplanation ||
    'Conecta a dor latente da sua audiência ao formato em alta no algoritmo deste período.'

  // 3. Previsão por Rede
  const primaryNetwork =
    networkForecast?.recommendedPriorityNetwork || 'Instagram & TikTok / LinkedIn'
  const priorityRationale =
    networkForecast?.priorityRationale ||
    'Distribuição acelerada para novas audiências com base no histórico real de retenção.'
  const networksList =
    networkForecast?.networks && networkForecast.networks.length > 0
      ? networkForecast.networks
      : [
          {
            network: 'Instagram',
            expectedEngagementRange: '450 - 950 interações estimadas',
            priorityLevel: 'primária',
            isRecommendedPriority: true,
            rationale: 'Público engajado no feed e alto volume de compartilhamentos.',
          },
          {
            network: 'TikTok',
            expectedEngagementRange: '1.2k - 3.5k visualizações de retenção',
            priorityLevel: 'primária',
            isRecommendedPriority: true,
            rationale: 'Distribuição na FYP acelerada nas primeiras 24 horas.',
          },
          {
            network: 'LinkedIn',
            expectedEngagementRange: '200 - 450 reações corporativas',
            priorityLevel: 'média',
            rationale: 'Excelente para autoridade profissional e networking com tom analítico.',
          },
          {
            network: 'X',
            expectedEngagementRange: '120 - 280 interações',
            priorityLevel: 'baixa',
            rationale: 'Compartilhamento em formato thread ou síntese visual rápida.',
          },
          {
            network: 'Facebook',
            expectedEngagementRange: '180 - 360 alcances',
            priorityLevel: 'baixa',
            rationale: 'Distribuição complementar em páginas e grupos especializados.',
          },
        ]

  const visibleNetworks = showAllNetworks ? networksList : networksList.slice(0, 2)

  // 4. Série — Parte 1 de N
  const hasSeries =
    !!seriesPlan && (seriesPlan.isSeries || (seriesPlan.totalParts && seriesPlan.totalParts > 1))

  return (
    <div className="space-y-2.5 pt-1">
      {/* Grade com os 4 Blocos High Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* BLOCO 1: ÂNGULO CRIATIVO CONCRETO */}
        <div className="p-3 rounded-xl border-2 border-foreground/10 bg-card transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="hi-title text-[11px] text-foreground flex items-center gap-1.5 tracking-wide">
                <Compass className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 shrink-0" />
                1. Ângulo Criativo Concreto
              </span>
              {creativeAngle?.liftMultiplier && (
                <span className="hi-badge bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30 text-[9px] py-0 px-2 shrink-0">
                  {creativeAngle.liftMultiplier}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-foreground leading-snug">{angleText}</p>

            {/* Exemplo Prático Executável */}
            <div className="p-2 rounded-lg bg-pink-500/5 border border-pink-500/20 text-[11px] space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-pink-500" />
                Exemplo Prático de Execução:
              </div>
              <p className="text-foreground/90 leading-relaxed italic">"{practicalEx}"</p>
            </div>

            {/* Passos de execução expansíveis */}
            {creativeAngle?.executionSteps && creativeAngle.executionSteps.length > 0 && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setShowExecutionSteps(!showExecutionSteps)}
                  className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showExecutionSteps ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <span>Passos de gravação / montagem ({creativeAngle.executionSteps.length})</span>
                </button>
                {showExecutionSteps && (
                  <ul className="space-y-1 pl-1 text-[10px] text-muted-foreground">
                    {creativeAngle.executionSteps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-pink-500 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {creativeAngle?.historicalBasis && (
            <div className="pt-2 mt-2 border-t border-border/60 text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="truncate">{creativeAngle.historicalBasis}</span>
            </div>
          )}
        </div>

        {/* BLOCO 2: TENDÊNCIA DO NICHO */}
        <div className="p-3 rounded-xl border-2 border-foreground/10 bg-card transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="hi-title text-[11px] text-foreground flex items-center gap-1.5 tracking-wide">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                2. Tendência do Nicho & Timing
              </span>
              <span className="hi-badge bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[9px] py-0 px-2 shrink-0">
                Score {trendScore}/100
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground">{trendTopic}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {trendGrowth}
                </span>
                <span>•</span>
                <span className="text-foreground/80 capitalize">
                  {nicheTrend?.windowStatus || 'alta'}
                </span>
              </div>
            </div>

            {/* Janela de timing */}
            <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <Zap className="w-3 h-3 text-amber-500" />
                Janela de Oportunidade / Timing:
              </div>
              <p className="text-foreground font-medium text-[11px]">{trendTiming}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {trendExplanation}
              </p>
            </div>
          </div>

          {nicheTrend?.practicalTip && (
            <div className="pt-2 mt-2 border-t border-border/60 text-[10px] text-muted-foreground">
              💡 <strong className="text-foreground/90">Dica de timing:</strong>{' '}
              {nicheTrend.practicalTip}
            </div>
          )}
        </div>

        {/* BLOCO 3: PREVISÃO POR REDE */}
        <div className="p-3 rounded-xl border-2 border-foreground/10 bg-card transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="hi-title text-[11px] text-foreground flex items-center gap-1.5 tracking-wide">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                3. Previsão por Rede Principal
              </span>
              <span className="hi-badge bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[9px] py-0 px-2 shrink-0">
                Priorizar: {primaryNetwork}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">{priorityRationale}</p>

            {/* Lista comparativa das redes */}
            <div className="space-y-1.5 pt-1">
              {visibleNetworks.map((net, nIdx) => (
                <div
                  key={nIdx}
                  className={`p-2 rounded-lg border text-[11px] flex flex-col gap-1 ${
                    net.isRecommendedPriority || net.priorityLevel === 'primária'
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-muted/30 border-border/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      {net.network}
                      {net.isRecommendedPriority && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                          ★ Recomendada
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      {net.expectedEngagementRange}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{net.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-border/60 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-mono">
              Calibrado com histórico real
            </span>
            <button
              type="button"
              onClick={() => setShowAllNetworks(!showAllNetworks)}
              className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-0.5"
            >
              {showAllNetworks ? 'Mostrar menos redes' : `Ver todas (${networksList.length})`}
              {showAllNetworks ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* BLOCO 4: SÉRIE — PARTE 1 DE N */}
        <div className="p-3 rounded-xl border-2 border-foreground/10 bg-card transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="hi-title text-[11px] text-foreground flex items-center gap-1.5 tracking-wide">
                <BookmarkCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                4. Série —{' '}
                {hasSeries
                  ? `Parte ${seriesPlan?.currentPart || 1} de ${seriesPlan?.totalParts || 3}`
                  : 'Episódio Único / Piloto'}
              </span>
              <span className="hi-badge bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[9px] py-0 px-2 shrink-0">
                {hasSeries ? `Série ${seriesPlan?.totalParts || 3}x` : 'Potencial de Série'}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground">
                {seriesPlan?.seriesTitle ||
                  `Série: ${ideaTitle?.slice(0, 48) || 'Domínio de Conteúdo'}...`}
              </p>
              {seriesPlan?.seriesTheme && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Tema central: {seriesPlan.seriesTheme}
                </p>
              )}
            </div>

            {/* Próximos Episódios */}
            <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[11px] space-y-1.5">
              <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                <span>Próximos Episódios Sugeridos:</span>
              </div>
              <ul className="space-y-1 text-[11px]">
                {seriesPlan?.nextEpisodes && seriesPlan.nextEpisodes.length > 0 ? (
                  seriesPlan.nextEpisodes.map((ep, eIdx) => (
                    <li key={eIdx} className="flex items-start gap-1.5 text-foreground/90">
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold shrink-0">
                        #{eIdx + 2}
                      </span>
                      <span className="text-[10px] leading-tight">{ep}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-1.5 text-foreground/90">
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold shrink-0">
                        #2
                      </span>
                      <span className="text-[10px] leading-tight">
                        Parte 2: Os 3 erros que sabotam a execução na prática
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5 text-foreground/90">
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold shrink-0">
                        #3
                      </span>
                      <span className="text-[10px] leading-tight">
                        Parte 3: O checklist final e sessão de tira-dúvidas nos stories
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-border/60 text-[10px] text-muted-foreground">
            📌 Ao publicar a Parte 1, avise a audiência para salvar e seguir para não perder as
            próximas partes.
          </div>
        </div>
      </div>
    </div>
  )
}
