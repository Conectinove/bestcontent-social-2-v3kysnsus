import React, { useState } from 'react'
import {
  Sparkles,
  Check,
  Clock,
  Share2,
  TrendingUp,
  Tag,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { applyAiSuggestionToPost, StudioAiEnrichmentData } from '@/services/ai-studio'

interface AiEnrichmentCardProps {
  postId: string
  enrichment: StudioAiEnrichmentData | any
  onApplied?: (field: string, value: any) => void
}

export const AiEnrichmentCard: React.FC<AiEnrichmentCardProps> = ({
  postId,
  enrichment,
  onApplied,
}) => {
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [appliedFields, setAppliedFields] = useState<Record<string, boolean>>({})
  const [applying, setApplying] = useState<string | null>(null)

  if (!enrichment) return null

  const handleApply = async (
    field: 'tags' | 'caption' | 'content' | 'platform',
    value: any,
    label: string,
  ) => {
    try {
      setApplying(field)
      await applyAiSuggestionToPost(postId, field, value)
      setAppliedFields((prev) => ({ ...prev, [field]: true }))
      toast({
        title: 'Sugestão aplicada com sucesso!',
        description: `${label} foi atualizado no post na biblioteca.`,
      })
      if (onApplied) onApplied(field, value)
    } catch (err: any) {
      toast({
        title: 'Erro ao aplicar sugestão',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setApplying(null)
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado para a área de transferência',
      description: label,
    })
  }

  const tags: string[] = Array.isArray(enrichment.suggested_tags) ? enrichment.suggested_tags : []
  const recommendedTimes: string[] = Array.isArray(enrichment.recommended_times)
    ? enrichment.recommended_times
    : ['11:30', '18:45']
  const score = enrichment.engagement_score || 88
  const tier = enrichment.engagement_tier || 'Alto Potencial (🔥 >5%)'
  const network = enrichment.recommended_network || 'Instagram & Reels'
  const justification =
    enrichment.network_justification || 'Otimizado para alcance orgânico e retenção.'
  const suggestedDescription =
    enrichment.suggested_description ||
    enrichment.strategic_summary ||
    'Descrição recomendada pela IA para maximizar conversão.'
  const niche = enrichment.niche_detected || 'Estratégico'

  return (
    <div className="mt-3 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-background to-indigo-950/20 p-3.5 shadow-sm text-xs space-y-3">
      {/* Header do Card com Score e Nicho */}
      <div className="flex items-center justify-between gap-2 border-b border-purple-500/20 pb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1 px-2 py-0.5 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Sugestões da IA
          </Badge>
          <Badge variant="outline" className="border-purple-500/40 text-purple-300 text-[10px]">
            Nicho: {niche}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 text-right">
          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
            <TrendingUp className="w-3.5 h-3.5" />
            Score: {score}/100
          </span>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] hidden sm:inline-flex">
            {tier}
          </Badge>
        </div>
      </div>

      {/* Rede Recomendada + Justificativa + Ação 1 Clique */}
      <div className="rounded-lg bg-muted/40 p-2.5 border border-border/60 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Share2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Rede Recomendada:</span>
            <span className="font-semibold text-indigo-400">{network}</span>
          </div>

          <Button
            size="sm"
            variant={appliedFields['platform'] ? 'secondary' : 'default'}
            disabled={applying === 'platform' || appliedFields['platform']}
            onClick={() => handleApply('platform', network, 'Rede social')}
            className="h-6 px-2 text-[10px] gap-1 font-medium bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
          >
            {appliedFields['platform'] ? (
              <>
                <Check className="w-3 h-3 text-emerald-300" />
                Aplicado
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                Aplicar Rede
              </>
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed pl-5">{justification}</p>
      </div>

      {/* Horários Recomendados */}
      <div className="flex items-center gap-2 flex-wrap text-muted-foreground">
        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-medium text-foreground">Melhores horários para publicar:</span>
        <div className="flex items-center gap-1">
          {recommendedTimes.map((time, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-semibold text-[10px]"
            >
              {time}
            </span>
          ))}
        </div>
      </div>

      {/* Tags de Nicho com Aplicação de 1 Clique */}
      {tags.length > 0 && (
        <div className="rounded-lg bg-muted/40 p-2.5 border border-border/60 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Tag className="w-3.5 h-3.5 text-pink-400" />
              <span>Tags de Nicho da Marca ({tags.length})</span>
            </div>

            <Button
              size="sm"
              variant={appliedFields['tags'] ? 'secondary' : 'default'}
              disabled={applying === 'tags' || appliedFields['tags']}
              onClick={() => handleApply('tags', tags, 'Tags')}
              className="h-6 px-2 text-[10px] gap-1 font-medium bg-pink-600 hover:bg-pink-700 text-white shrink-0"
            >
              {appliedFields['tags'] ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300" />
                  Tags Aplicadas
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" />
                  Aplicar Tags
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20 text-[10px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Descrição Pronta com Aplicação de 1 Clique */}
      <div className="rounded-lg bg-muted/40 p-2.5 border border-border/60 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Descrição Pronta para Uso</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCopy(suggestedDescription, 'Descrição copiada')}
              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              title="Copiar texto"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copiar
            </Button>

            <Button
              size="sm"
              variant={appliedFields['caption'] ? 'secondary' : 'default'}
              disabled={applying === 'caption' || appliedFields['caption']}
              onClick={() => handleApply('caption', suggestedDescription, 'Descrição da legenda')}
              className="h-6 px-2 text-[10px] gap-1 font-medium bg-purple-600 hover:bg-purple-700 text-white shrink-0"
            >
              {appliedFields['caption'] ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300" />
                  Legenda Aplicada
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" />
                  Aplicar no Post
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded bg-background/80 p-2 border border-border/40 text-[11px] text-foreground/90 whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
          {suggestedDescription}
        </div>
      </div>

      {/* Seção Expansível com Ganchos e CTA */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {expanded ? 'Ocultar detalhes avançados' : 'Ver ganchos alternativos e CTA sugerida'}
        </button>

        {expanded && (
          <div className="mt-2 space-y-2 pt-2 border-t border-border/40 animate-in fade-in-50">
            {enrichment.suggested_cta && (
              <div className="rounded bg-background/60 p-2 border border-border/40">
                <span className="font-semibold text-foreground block mb-0.5">CTA Estratégica:</span>
                <p className="text-muted-foreground">{enrichment.suggested_cta}</p>
              </div>
            )}

            {Array.isArray(enrichment.hook_alternatives) &&
              enrichment.hook_alternatives.length > 0 && (
                <div className="rounded bg-background/60 p-2 border border-border/40 space-y-1">
                  <span className="font-semibold text-foreground block">
                    Ganchos para primeiros 3s:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                    {enrichment.hook_alternatives.map((hook: string, idx: number) => (
                      <li key={idx}>{hook}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  )
}
