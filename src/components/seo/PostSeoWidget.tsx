import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Search,
  Hash,
  MessageSquare,
  HelpCircle,
  Wand2,
  Loader2,
  Check,
  ChevronRight,
  Layers,
  Shuffle,
  Copy,
} from 'lucide-react'
import { analyzeCaptionSeo, buildBalancedKeywordMix, type SocialNetwork } from '@/services/seo'
import { improveText } from '@/services/ai'
import { toast } from '@/hooks/use-toast'

interface PostSeoWidgetProps {
  caption: string
  network?: string
  niche?: string
  tone?: string
  onApplyImprovement?: (newCaption: string) => void
  className?: string
}

export function PostSeoWidget({
  caption,
  network = 'instagram',
  niche,
  tone = 'Profissional',
  onApplyImprovement,
  className = '',
}: PostSeoWidgetProps) {
  const [improving, setImproving] = useState(false)
  const normNetwork = (
    ['instagram', 'tiktok', 'youtube', 'linkedin', 'facebook', 'twitter'].includes(
      network.toLowerCase(),
    )
      ? network.toLowerCase()
      : 'instagram'
  ) as SocialNetwork

  const analysis = useMemo(() => {
    return analyzeCaptionSeo(caption, normNetwork, niche)
  }, [caption, normNetwork, niche])

  const handleApplyAiRewrite = async () => {
    if (!caption.trim()) {
      toast({ title: 'Escreva um texto primeiro', variant: 'destructive' })
      return
    }

    setImproving(true)
    try {
      const res = await improveText({
        text: caption,
        instruction: `Otimize esta legenda para SEO da rede ${normNetwork} com tom de voz ${tone}. 
Adicione um gancho forte na primeira linha antes de "...mais", melhore a legibilidade com respiro de parágrafos, adicione uma chamada para ação clara (CTA para salvar/comentar) e inclua 3 a 5 hashtags estratégicas para o nicho ${niche || 'conteúdo'}.`,
        tone,
      })

      if (res?.improvedText && onApplyImprovement) {
        onApplyImprovement(res.improvedText)
        toast({
          title: 'Legenda otimizada para SEO!',
          description: `Reescrita com tom ${tone}, gancho de impacto, CTA e hashtags calibradas.`,
        })
      }
    } catch {
      // Fallback inteligente caso a IA externa falhe
      const hookAlt =
        analysis.breakdown.hook.suggestedAlternatives?.[0] || 'Atenção para esta virada de chave:'
      const ctaAlt =
        analysis.breakdown.cta.suggestedCtas?.[0] || '📌 Salve para consultar quando precisar!'
      const tagsAlt = (analysis.breakdown.hashtags.nicheSuggestions || []).slice(0, 4).join(' ')
      const fallbackCaption = `${hookAlt}\n\n${caption}\n\n${ctaAlt}\n\n${tagsAlt}`

      if (onApplyImprovement) {
        onApplyImprovement(fallbackCaption)
        toast({
          title: 'Sugestões de SEO aplicadas!',
          description: 'Gancho inicial, CTA e hashtags inseridos no texto.',
        })
      }
    } finally {
      setImproving(false)
    }
  }

  const handleApplyAlternativeHook = (altHook: string) => {
    if (!onApplyImprovement) return
    const lines = caption.split('\n')
    lines[0] = altHook
    onApplyImprovement(lines.join('\n'))
    toast({ title: 'Gancho atualizado na 1ª linha!' })
  }

  const handleApplyCta = (altCta: string) => {
    if (!onApplyImprovement) return
    const updated = `${caption.trim()}\n\n${altCta}`
    onApplyImprovement(updated)
    toast({ title: 'CTA adicionada à legenda!' })
  }

  const handleApplyRewriteWithTone = handleApplyAiRewrite

  const scoreColor =
    analysis.score >= 80
      ? 'text-emerald-500'
      : analysis.score >= 60
        ? 'text-amber-500'
        : 'text-rose-500'

  const scoreBadgeBg =
    analysis.score >= 80
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : analysis.score >= 60
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'

  return (
    <Card className={`rounded-2xl border-border bg-card p-4 space-y-3.5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground whitespace-nowrap">
                SEO do Post
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono font-bold shrink-0 ${scoreBadgeBg}`}
              >
                {analysis.score}/100
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              Otimização Para Busca no {normNetwork.charAt(0).toUpperCase() + normNetwork.slice(1)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xl font-black ${scoreColor}`}>{analysis.score}</span>
          <span className="text-[10px] text-muted-foreground block font-medium">Score</span>
        </div>
      </div>

      <Progress value={analysis.score} className="h-1.5 rounded-full" />

      {/* Critérios avaliados */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Hook */}
        <div className="p-2 rounded-xl bg-muted/40 border border-border/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-purple-500" /> Gancho (Hook)
            </span>
            <span className="font-mono text-[10px] font-bold">
              {analysis.breakdown.hook.score}%
            </span>
          </div>
          <p className="text-[11px] text-foreground/80 line-clamp-2">
            {analysis.breakdown.hook.feedback}
          </p>
        </div>

        {/* CTA */}
        <div className="p-2 rounded-xl bg-muted/40 border border-border/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <MessageSquare className="w-2.5 h-2.5 text-purple-500" /> Chamada (CTA)
            </span>
            <span className="font-mono text-[10px] font-bold">{analysis.breakdown.cta.score}%</span>
          </div>
          <p className="text-[11px] text-foreground/80 line-clamp-2">
            {analysis.breakdown.cta.feedback}
          </p>
        </div>

        {/* Tamanho */}
        <div className="p-2 rounded-xl bg-muted/40 border border-border/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <HelpCircle className="w-2.5 h-2.5 text-purple-500" /> Tamanho
            </span>
            <span className="font-mono text-[10px] font-bold">
              {analysis.breakdown.length.charCount} carac.
            </span>
          </div>
          <p className="text-[11px] text-foreground/80 line-clamp-2">
            {analysis.breakdown.length.feedback}
          </p>
        </div>

        {/* Hashtags */}
        <div className="p-2 rounded-xl bg-muted/40 border border-border/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Hash className="w-2.5 h-2.5 text-purple-500" /> Hashtags
            </span>
            <span className="font-mono text-[10px] font-bold">
              {analysis.breakdown.hashtags.count} tags
            </span>
          </div>
          <p className="text-[11px] text-foreground/80 line-clamp-2">
            {analysis.breakdown.hashtags.feedback}
          </p>
        </div>
      </div>

      {/* Sugestões Rápidas de Gancho */}
      {analysis.breakdown.hook.suggestedAlternatives &&
        analysis.breakdown.hook.suggestedAlternatives.length > 0 &&
        analysis.score < 85 && (
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" /> Alternativas para a 1ª Linha
              (Gancho):
            </span>
            <div className="space-y-1">
              {analysis.breakdown.hook.suggestedAlternatives.slice(0, 2).map((alt, i) => (
                <div
                  key={i}
                  onClick={() => handleApplyAlternativeHook(alt)}
                  className="p-1.5 rounded-lg bg-card/80 border border-border/60 hover:border-purple-500/50 cursor-pointer flex items-center justify-between gap-1 text-[11px] transition-colors"
                >
                  <span className="truncate text-foreground/90 font-medium">"{alt}"</span>
                  <span className="text-purple-600 font-bold text-[10px] shrink-0 flex items-center">
                    <span>Usar</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* NOVO: Sugestões em Camadas & Mix Equilibrado */}
      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-600" /> Palavras-Chave (Head + Long-tail + Local)
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const mix = buildBalancedKeywordMix(analysis.layeredKeywords || [])
              const mixText = mix.join(', ')
              navigator.clipboard.writeText(mixText)
              toast({
                title: 'Mix de palavras-chave copiado!',
                description: `${mix.length} termos equilibrados copiados para a área de transferência.`,
              })
            }}
            className="h-6 text-[10px] text-purple-700 dark:text-purple-300 font-bold px-2 rounded-lg gap-1"
          >
            <Shuffle className="w-2.5 h-2.5" />
            <span>Copiar Mix</span>
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {(analysis.layeredKeywords || []).slice(0, 6).map((kw, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (onApplyImprovement) {
                  onApplyImprovement(`${caption.trim()} #${kw.keyword.replace(/\s+/g, '')}`)
                  toast({
                    title: 'Tag inserida!',
                    description: `#${kw.keyword.replace(/\s+/g, '')} adicionada à legenda.`,
                  })
                } else {
                  navigator.clipboard.writeText(kw.keyword)
                  toast({ title: 'Copiado!', description: `"${kw.keyword}" copiado.` })
                }
              }}
              title={`${kw.layerLabel} • ${kw.estimatedVolume} • Competição ${kw.competition} • Intenção ${kw.intent}`}
              className="px-2 py-0.5 rounded-md bg-card border border-border/80 text-[10px] font-semibold text-foreground/80 hover:border-purple-500/50 hover:text-purple-600 transition-colors flex items-center gap-1"
            >
              <span>{kw.keyword}</span>
              <span className="text-[9px] text-muted-foreground font-mono">({kw.competition})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Botão de Aplicação com IA no Tom de Voz */}
      {onApplyImprovement && (
        <div className="pt-1">
          <Button
            type="button"
            size="sm"
            onClick={handleApplyRewriteWithTone}
            disabled={improving || !caption.trim()}
            className="w-full h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shadow-xs"
          >
            {improving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            <span>Otimizar Legenda com IA (Tom: {tone})</span>
          </Button>
        </div>
      )}

      {/* Dicas acionáveis se score < 80 */}
      {analysis.recommendations.length > 0 && (
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Recomendações:
          </span>
          <ul className="space-y-0.5 text-[11px] text-foreground/80">
            {analysis.recommendations.slice(0, 2).map((rec, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-purple-600 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
