import React, { useState } from 'react'
import {
  Sparkles,
  Calendar,
  Clock,
  Hash,
  Layers,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Flame,
  FileText,
  Video,
  Twitter,
  Mail,
  SlidersHorizontal,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Target, Megaphone, Zap } from 'lucide-react'
import {
  getWhatToPostToday,
  type TodayPostIdea,
  type FunnelObjective,
} from '@/services/post-templates'
import { SmartWeeklyPlanModal } from '@/components/analytics/SmartWeeklyPlanModal'
import { AdvancedSuggestionBlocks } from '@/components/analytics/AdvancedSuggestionBlocks'

interface WhatToPostTodayModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand?: {
    name?: string
    niche?: string
    tone?: string
    logo?: string
    [key: string]: any
  }
  brandName?: string
  brandNiche?: string
  brandTone?: string
  network?: string
  preferredFormats?: string[]
  visualStyle?: string
  initialFormat?: string
  initialObjective?: FunnelObjective | 'all'
  onApplyIdea?: (idea: TodayPostIdea) => void
}

export function WhatToPostTodayModal({
  open,
  onOpenChange,
  brand,
  brandName: brandNameProp,
  brandNiche: brandNicheProp,
  brandTone: brandToneProp,
  network = 'Instagram',
  preferredFormats,
  visualStyle,
  initialFormat,
  initialObjective,
  onApplyIdea,
}: WhatToPostTodayModalProps) {
  const brandName = brandNameProp || brand?.name || 'Sua Marca'
  const brandNiche = brandNicheProp || brand?.niche || 'Geral'
  const brandTone = brandToneProp || brand?.tone || 'Profissional e dinâmico'
  const { toast } = useToast()
  const [ideas, setIdeas] = useState<TodayPostIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>(initialFormat || 'all')
  const [selectedObjectiveFilter, setSelectedObjectiveFilter] = useState<FunnelObjective | 'all'>(
    initialObjective || 'all',
  )
  const [weeklyPlanModalOpen, setWeeklyPlanModalOpen] = useState(false)
  const [expandedVideoGuidelineId, setExpandedVideoGuidelineId] = useState<string | null>('idea-2')

  React.useEffect(() => {
    if (initialFormat && initialFormat !== 'all') {
      setSelectedFormatFilter(initialFormat)
    }
    if (initialObjective) {
      setSelectedObjectiveFilter(initialObjective)
    }
  }, [initialFormat, initialObjective])

  const fetchIdeas = async () => {
    setLoading(true)
    try {
      const result = await getWhatToPostToday({
        brandName,
        brandNiche,
        brandTone,
        network,
        preferredFormats,
        visualStyle,
        requestedFormat: selectedFormatFilter !== 'all' ? selectedFormatFilter : undefined,
        funnelObjective: selectedObjectiveFilter !== 'all' ? selectedObjectiveFilter : undefined,
      })
      setIdeas(result)
    } catch {
      toast({
        title: 'Erro ao gerar ideias',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar ideias ao abrir se ainda não tiver
  React.useEffect(() => {
    if (open) {
      fetchIdeas()
    }
  }, [open, selectedObjectiveFilter, selectedFormatFilter])

  const handleCopyCaption = (idea: TodayPostIdea) => {
    const textToCopy = `${idea.caption}\n\n${idea.hashtags.join(' ')}`
    navigator.clipboard.writeText(textToCopy)
    setCopiedId(idea.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: 'Legenda copiada!',
      description: 'Texto e hashtags copiados para a área de transferência.',
    })
  }

  const handleUseIdea = (idea: TodayPostIdea) => {
    onApplyIdea?.(idea)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-purple-500/20 bg-card shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                  O que postar hoje?
                  <Badge className="bg-purple-600 text-white text-[10px] py-0">
                    BestContent IA
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sugestões contextualizadas cruzando top posts, retenção por formato, horários e
                  objetivos de funil da marca{' '}
                  <span className="font-semibold text-foreground">{brandName}</span> ({network}).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeeklyPlanModalOpen(true)}
                className="text-xs gap-1.5 rounded-xl border-purple-500/40 text-purple-700 dark:text-purple-300 font-bold bg-purple-500/10 hover:bg-purple-500/20"
              >
                <Calendar className="w-3.5 h-3.5 text-pink-500" />
                <span>Plano Semanal IA</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchIdeas}
                disabled={loading}
                className="text-xs gap-1.5 rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Novas Ideias
              </Button>
            </div>
          </div>

          {/* Controles: Filtros por Formato & Objetivo de Funil */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[11px] font-bold text-muted-foreground uppercase mr-1 shrink-0">
                Formato:
              </span>
              {[
                { key: 'all', label: 'Todos os Formatos', icon: Layers },
                { key: 'Carrossel', label: 'Carrossel (Slides)', icon: Layers },
                { key: 'Vídeo Curto / Reels', label: 'Roteiro de Vídeo (Beats)', icon: Video },
                { key: 'Thread X / Twitter', label: 'Threads (X)', icon: Twitter },
                { key: 'Newsletter / Artigo', label: 'Newsletter & LinkedIn', icon: Mail },
              ].map((f) => {
                const Icon = f.icon
                const active = selectedFormatFilter === f.key
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setSelectedFormatFilter(f.key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      active
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{f.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase mr-1 shrink-0 flex items-center gap-1">
                <Target className="w-3 h-3 text-purple-500" /> Objetivo de Funil:
              </span>
              {(['all', 'Atração', 'Autoridade', 'Conversão', 'Comunidade'] as const).map((obj) => (
                <button
                  key={obj}
                  type="button"
                  onClick={() => setSelectedObjectiveFilter(obj)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                    selectedObjectiveFilter === obj
                      ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 font-bold'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  {obj === 'all' ? 'Todos os Objetivos' : obj}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              Analisando posts anteriores, hashtags e horários de pico...
            </p>
            <p className="text-xs text-muted-foreground">
              A IA está calibrando 3 formatos com maior probabilidade de retenção.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {ideas
              .filter((idea) => {
                if (selectedFormatFilter === 'all') return true
                return idea.format.toLowerCase().includes(selectedFormatFilter.toLowerCase())
              })
              .map((idea, idx) => (
                <div
                  key={idea.id || idx}
                  className="p-5 rounded-xl border border-border/80 bg-muted/20 hover:border-purple-500/40 transition-all space-y-3 relative group"
                >
                  {/* Header da Ideia */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-600/15 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <h3 className="font-bold text-sm text-foreground">{idea.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-card border-purple-500/30 text-purple-600 dark:text-purple-400"
                      >
                        <Layers className="w-3 h-3 mr-1" />
                        {idea.suggestedModel}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {idea.format}
                      </Badge>
                      {idea.recommendedNetwork && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30 font-semibold"
                        >
                          📱 {idea.recommendedNetwork}
                        </Badge>
                      )}
                      {idea.funnelObjective && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 font-bold"
                        >
                          🎯 {idea.funnelObjective}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Justificativa de IA com dados reais & Ângulo Concreto */}
                  <div className="p-2.5 rounded-lg bg-purple-50/5 border border-purple-500/15 text-[11px] text-purple-700 dark:text-purple-300 font-medium space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{idea.reason}</span>
                    </div>

                    {idea.hook3s && (
                      <div className="text-[11px] text-foreground/90 flex items-start gap-1.5 pl-5 pt-0.5 bg-amber-500/10 p-1.5 rounded-md border border-amber-500/30">
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-amber-600 dark:text-amber-400">
                            Gancho de Abertura (3s / Capa):
                          </strong>{' '}
                          {idea.hook3s}
                        </span>
                      </div>
                    )}

                    {idea.concreteAngle && (
                      <div className="text-[11px] text-foreground/90 flex items-start gap-1.5 pl-5 pt-0.5 bg-card/60 p-1.5 rounded-md border border-purple-500/20">
                        <Target className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-purple-600 dark:text-purple-400">
                            Ângulo Concreto:
                          </strong>{' '}
                          {idea.concreteAngle}
                        </span>
                      </div>
                    )}

                    {idea.seasonalityContext && (
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pl-5">
                        <Calendar className="w-3 h-3 text-pink-500 shrink-0" />
                        <span>
                          <strong>Sazonalidade:</strong> {idea.seasonalityContext}
                        </span>
                      </div>
                    )}

                    {idea.suggestedCta && (
                      <div className="text-[10px] text-foreground/80 flex items-center gap-1.5 pl-5 pt-0.5 font-semibold">
                        <Megaphone className="w-3 h-3 text-pink-500 shrink-0" />
                        <span>CTA sugerido: "{idea.suggestedCta}"</span>
                      </div>
                    )}

                    {/* Diretrizes Concretas de Vídeo (se aplicável ao formato de vídeo) */}
                    {(idea.videoGuidelines ||
                      idea.format.toLowerCase().includes('vídeo') ||
                      idea.format.toLowerCase().includes('video') ||
                      idea.format.toLowerCase().includes('reels') ||
                      idea.format.toLowerCase().includes('tiktok') ||
                      idea.format.toLowerCase().includes('shorts')) && (
                      <div className="mt-2 pt-2 border-t border-purple-500/20">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedVideoGuidelineId(
                              expandedVideoGuidelineId === idea.id ? null : idea.id,
                            )
                          }
                          className="w-full flex items-center justify-between text-left text-xs font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 transition-colors py-1"
                        >
                          <div className="flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>
                              🎬 Diretrizes Estratégicas de Vídeo (Gancho 3s, Ritmo e Duração)
                            </span>
                          </div>
                          {expandedVideoGuidelineId === idea.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>

                        {expandedVideoGuidelineId === idea.id && (
                          <div className="mt-2 p-2.5 rounded-lg bg-card/90 border border-purple-500/25 space-y-2 text-xs text-foreground/90">
                            {/* Gancho dos 3s */}
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Gancho dos 3 Primeiros Segundos (Exemplo
                                Prático)
                              </span>
                              <p className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs italic font-medium text-amber-900 dark:text-amber-200">
                                {idea.videoGuidelines?.hookExample ||
                                  idea.hook3s ||
                                  '"Pare de cometer este erro comum agora mesmo se você busca resultados reais."'}
                              </p>
                            </div>

                            {/* Ritmo de corte e energia */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                              <div className="p-2 rounded bg-muted/60 border border-border/60">
                                <span className="font-semibold text-purple-600 dark:text-purple-400 block mb-0.5">
                                  ✂️ Ritmo de Corte Sugerido:
                                </span>
                                <span className="text-muted-foreground">
                                  {idea.videoGuidelines?.cutPacing ||
                                    'Cortes dinâmicos a cada 1.8s a 2.5s com micro-zooms nas palavras-chave'}
                                </span>
                              </div>
                              <div className="p-2 rounded bg-muted/60 border border-border/60">
                                <span className="font-semibold text-pink-600 dark:text-pink-400 block mb-0.5">
                                  🎵 Estilo de Trilha & Energia:
                                </span>
                                <span className="text-muted-foreground">
                                  {idea.videoGuidelines?.trackEnergy ||
                                    idea.trackEnergy ||
                                    'Batida ritmada lo-fi moderna com punch nos cortes (120 BPM)'}
                                </span>
                              </div>
                            </div>

                            {/* Duração Ideal por Rede */}
                            <div className="p-2 rounded bg-muted/60 border border-border/60 text-[11px] space-y-1">
                              <span className="font-semibold text-foreground block">
                                ⏱️ Duração Ideal Calibrada por Rede:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                                <div className="p-1.5 rounded bg-card border border-border/50 text-center">
                                  <strong className="block text-pink-600 dark:text-pink-400">
                                    Reels
                                  </strong>
                                  <span className="text-muted-foreground font-mono">
                                    {idea.videoGuidelines?.idealDurationByNetwork?.reels ||
                                      '15-30s'}
                                  </span>
                                </div>
                                <div className="p-1.5 rounded bg-card border border-border/50 text-center">
                                  <strong className="block text-sky-600 dark:text-sky-400">
                                    TikTok
                                  </strong>
                                  <span className="text-muted-foreground font-mono">
                                    {idea.videoGuidelines?.idealDurationByNetwork?.tiktok ||
                                      '21-34s'}
                                  </span>
                                </div>
                                <div className="p-1.5 rounded bg-card border border-border/50 text-center">
                                  <strong className="block text-red-600 dark:text-red-400">
                                    Shorts
                                  </strong>
                                  <span className="text-muted-foreground font-mono">
                                    {idea.videoGuidelines?.idealDurationByNetwork?.shorts ||
                                      '20-40s'}
                                  </span>
                                </div>
                                <div className="p-1.5 rounded bg-card border border-border/50 text-center">
                                  <strong className="block text-amber-600 dark:text-amber-400">
                                    YouTube Longo
                                  </strong>
                                  <span className="text-muted-foreground font-mono">
                                    {idea.videoGuidelines?.idealDurationByNetwork?.youtubeLong ||
                                      '6-9 min'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Rede recomendada por dados reais */}
                            <div className="text-[11px] p-2 rounded bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between flex-wrap gap-1">
                              <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                                📊 <strong>Rede Recomendada por Desempenho Real:</strong>{' '}
                                {idea.videoGuidelines?.recommendedNetworkByPerformance ||
                                  idea.recommendedNetwork ||
                                  'TikTok & Instagram Reels (maior taxa de retenção algorítmica)'}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] bg-card text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              >
                                Alta Conversão
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Os 4 Blocos Avançados de IA (High Impact) */}
                  <AdvancedSuggestionBlocks
                    creativeAngle={idea.creativeAngleDetail}
                    fallbackConcreteAngle={idea.concreteAngle}
                    nicheTrend={idea.nicheTrendDetail}
                    networkForecast={idea.networkPerformanceForecast}
                    seriesPlan={idea.seriesPlan}
                    ideaTitle={idea.title}
                  />

                  {/* Legenda sugerida */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Legenda Completa Sugerida
                    </span>
                    <div className="p-3 rounded-lg bg-card border border-border text-xs text-foreground/90 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                      {idea.caption}
                    </div>
                  </div>

                  {/* Teste A/B de Ganchos com IA Avançada */}
                  {idea.hookAB && (
                    <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          Teste A/B de Ganchos (IA Calibrada)
                        </span>
                        <Badge className="bg-purple-600 text-white text-[9px] uppercase font-bold">
                          Recomendado: Gancho {idea.hookAB.recommendedHook}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div
                          className={`p-2 rounded-lg border text-[11px] ${
                            idea.hookAB.recommendedHook === 'A'
                              ? 'bg-purple-500/10 border-purple-500/40 text-foreground'
                              : 'bg-muted/40 border-border text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-purple-600 dark:text-purple-400">
                              Opção A:
                            </strong>
                            {idea.hookAB.recommendedHook === 'A' && (
                              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-500/10 px-1 rounded">
                                Testar 1º
                              </span>
                            )}
                          </div>
                          <p>{idea.hookAB.hookA}</p>
                        </div>
                        <div
                          className={`p-2 rounded-lg border text-[11px] ${
                            idea.hookAB.recommendedHook === 'B'
                              ? 'bg-purple-500/10 border-purple-500/40 text-foreground'
                              : 'bg-muted/40 border-border text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-purple-600 dark:text-purple-400">
                              Opção B:
                            </strong>
                            {idea.hookAB.recommendedHook === 'B' && (
                              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-500/10 px-1 rounded">
                                Testar 1º
                              </span>
                            )}
                          </div>
                          <p>{idea.hookAB.hookB}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground italic pl-1">
                        💡 <strong>Justificativa da IA:</strong> {idea.hookAB.rationale}
                        {idea.hookAB.testTip && ` — ${idea.hookAB.testTip}`}
                      </p>
                    </div>
                  )}

                  {/* Janela de Tendência do Nicho & Sequência Estratégica Sugerida */}
                  {(idea.nicheTrend || idea.suggestedSequence) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {idea.nicheTrend && (
                        <div className="p-2.5 rounded-lg bg-card/80 border border-border/80 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-pink-500" />
                              Tendência do Nicho
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] border-pink-500/40 text-pink-600"
                            >
                              Score {idea.nicheTrend.trendScore}/100
                            </Badge>
                          </div>
                          <p className="text-[11px] font-semibold text-foreground">
                            {idea.nicheTrend.topic}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Crescimento:{' '}
                            <strong className="text-emerald-600">
                              {idea.nicheTrend.growthRate}
                            </strong>{' '}
                            · Status: {idea.nicheTrend.windowStatus}
                          </p>
                        </div>
                      )}

                      {idea.suggestedSequence && (
                        <div className="p-2.5 rounded-lg bg-card/80 border border-border/80 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-blue-500" />
                              Sequência Sugerida (3 Dias)
                            </span>
                          </div>
                          <div className="space-y-1 text-[10px] text-muted-foreground">
                            <p>
                              <strong className="text-foreground">Hoje:</strong>{' '}
                              {idea.suggestedSequence.today.format} (
                              {idea.suggestedSequence.today.objective})
                            </p>
                            <p>
                              <strong className="text-foreground">Amanhã:</strong>{' '}
                              {idea.suggestedSequence.tomorrow.format} (
                              {idea.suggestedSequence.tomorrow.objective})
                            </p>
                            <p>
                              <strong className="text-foreground">Depois:</strong>{' '}
                              {idea.suggestedSequence.dayAfter.format} (
                              {idea.suggestedSequence.dayAfter.objective})
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Previsão de Engajamento Esperado & Melhor Horário por Rede */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2.5 rounded-lg bg-card/70 border border-border/70 text-xs">
                    {/* Previsão de Engajamento */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Previsão de Engajamento Esperado</span>
                      </div>
                      {idea.expectedEngagement ? (
                        <div className="text-[11px] text-muted-foreground pl-5 space-y-0.5">
                          <p className="font-medium text-foreground">
                            <strong className="text-emerald-600 dark:text-emerald-400 text-xs">
                              {idea.expectedEngagement.min.toLocaleString('pt-BR')} -{' '}
                              {idea.expectedEngagement.max.toLocaleString('pt-BR')}
                            </strong>{' '}
                            {idea.expectedEngagement.unit}
                          </p>
                          <p className="text-[10px] text-muted-foreground/80">
                            Confiança algorítmica: {idea.expectedEngagement.confidenceScore}% •
                            Base: {idea.expectedEngagement.benchmarkFormat}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground pl-5">
                          Estimativa calibrada: +28% a +45% de engajamento acima da média histórica
                        </p>
                      )}
                    </div>

                    {/* Horários por Rede */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Melhor Horário por Rede</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-5 pt-0.5">
                        {idea.networkBestTimes && idea.networkBestTimes.length > 0 ? (
                          idea.networkBestTimes.map((slot, sIdx) => (
                            <span
                              key={sIdx}
                              title={slot.reason}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium border border-border/60"
                            >
                              <strong className="text-foreground">{slot.network}:</strong>
                              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                                {slot.time}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {idea.bestTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hashtags e Horário Geral */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/60">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      {idea.hashtags.map((h, hIdx) => (
                        <span
                          key={hIdx}
                          className="text-[11px] font-mono text-purple-600 dark:text-purple-400"
                        >
                          {h}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{idea.bestTime}</span>
                    </div>
                  </div>

                  {/* Ações da Ideia */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCaption(idea)}
                      className="text-xs h-8 px-3 rounded-xl gap-1.5"
                    >
                      {copiedId === idea.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Texto
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleUseIdea(idea)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-8 px-3 rounded-xl gap-1.5 shadow-xs"
                    >
                      Usar esta Ideia no Post <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </DialogContent>

      <SmartWeeklyPlanModal
        open={weeklyPlanModalOpen}
        onOpenChange={setWeeklyPlanModalOpen}
        onSuccessPlanApplied={() => {
          onOpenChange(false)
        }}
      />
    </Dialog>
  )
}
