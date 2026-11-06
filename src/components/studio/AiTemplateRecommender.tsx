import React, { useState, useEffect } from 'react'
import { Sparkles, Check, ArrowRight, Wand2, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getAiRecommendedTemplates,
  type RecommendedTemplate,
} from '@/services/ai-template-recommendations'
import type { StudioMediaType } from '@/services/ai-studio'

interface AiTemplateRecommenderProps {
  prompt: string
  activeTab: StudioMediaType
  onApplyTemplate: (templateText: string, modelId?: string) => void
}

export const AiTemplateRecommender: React.FC<AiTemplateRecommenderProps> = ({
  prompt,
  activeTab,
  onApplyTemplate,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedTemplate[]>([])
  const [isOfficial, setIsOfficial] = useState(false)
  const [loading, setLoading] = useState(false)
  const [appliedId, setAppliedId] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    const fetchRecommendations = async () => {
      setLoading(true)
      try {
        const res = await getAiRecommendedTemplates({
          prompt,
          mediaType: activeTab,
        })
        if (!isCancelled) {
          setRecommendations(res.recommendations)
          setIsOfficial(res.isOfficial)
        }
      } catch (err) {
        console.warn('Erro ao obter recomendações de templates:', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    // Debounce na digitação do prompt
    const timeout = setTimeout(fetchRecommendations, 300)
    return () => {
      isCancelled = true
      clearTimeout(timeout)
    }
  }, [prompt, activeTab])

  const handleApply = (rec: RecommendedTemplate) => {
    setAppliedId(rec.id)
    onApplyTemplate(rec.templateText, rec.defaultModelId)
    setTimeout(() => setAppliedId(null), 2500)
  }

  if (recommendations.length === 0) return null

  return (
    <div className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 via-purple-500/5 to-primary/5 p-3.5 sm:p-4 shadow-sm transition-all space-y-3">
      {/* Header com High Impact Title e Selo Oficial vs Calibrado */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Wand2 className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight font-heading text-foreground flex items-center gap-1.5">
              <span>IA Recomenda Templates</span>
              <span className="text-[10px] font-normal text-muted-foreground lowercase">
                (compatíveis com o conteúdo)
              </span>
            </h4>
          </div>
        </div>

        {/* Selo oficial vs estimativa calibrada */}
        <Badge
          variant="outline"
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isOfficial
              ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-purple-500/40 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
          }`}
        >
          {isOfficial ? (
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Dados Oficiais</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-600" />
              <span>Estimativa Calibrada</span>
            </span>
          )}
        </Badge>
      </div>

      {/* Grid de Cards de Recomendação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {recommendations.slice(0, 3).map((rec) => {
          const isApplied = appliedId === rec.id
          return (
            <div
              key={rec.id}
              className="group relative flex flex-col justify-between p-3 rounded-xl border border-border/80 bg-background/80 hover:bg-background hover:border-primary/50 hover:shadow-md transition-all text-left"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {rec.title}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[9px] font-bold px-1.5 py-0 h-4 shrink-0 bg-muted text-muted-foreground"
                  >
                    {rec.tag}
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2">{rec.description}</p>

                {/* Justificativa curta da IA */}
                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium bg-purple-500/5 p-1.5 rounded-md border border-purple-500/10">
                  <span className="font-bold">Por que usar:</span> {rec.matchReason}
                </div>
              </div>

              <div className="pt-2.5 mt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Match: <strong className="text-primary">{rec.confidenceScore}%</strong>
                </span>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleApply(rec)}
                  disabled={isApplied}
                  className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all ${
                    isApplied
                      ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      <span>Aplicado</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      <span>Aplicar 1-Clique</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
