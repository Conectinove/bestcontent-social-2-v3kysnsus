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
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Target, Megaphone } from 'lucide-react'
import {
  getWhatToPostToday,
  type TodayPostIdea,
  type FunnelObjective,
} from '@/services/post-templates'
import { SmartWeeklyPlanModal } from '@/components/analytics/SmartWeeklyPlanModal'

interface WhatToPostTodayModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  brandName = 'Sua Marca',
  brandNiche = 'Geral',
  brandTone = 'Profissional e dinâmico',
  network = 'Instagram',
  preferredFormats,
  visualStyle,
  initialFormat,
  initialObjective,
  onApplyIdea,
}: WhatToPostTodayModalProps) {
  const { toast } = useToast()
  const [ideas, setIdeas] = useState<TodayPostIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>(initialFormat || 'all')
  const [selectedObjectiveFilter, setSelectedObjectiveFilter] = useState<FunnelObjective | 'all'>(
    initialObjective || 'all',
  )
  const [weeklyPlanModalOpen, setWeeklyPlanModalOpen] = useState(false)

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
                  </div>
                  {/* Legenda sugerida */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Legenda Completa Sugerida
                    </span>
                    <div className="p-3 rounded-lg bg-card border border-border text-xs text-foreground/90 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                      {idea.caption}
                    </div>
                  </div>

                  {/* Hashtags e Horário Recomendado */}
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
