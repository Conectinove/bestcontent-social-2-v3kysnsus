import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Search,
  Hash,
  MessageSquare,
  HelpCircle,
  Wand2,
  Loader2,
  ChevronRight,
  Layers,
  Shuffle,
  Smile,
  FileText,
  Scissors,
  Plus,
} from 'lucide-react'
import { analyzeCaptionSeo, buildBalancedKeywordMix, type SocialNetwork } from '@/services/seo'
import { improveText } from '@/services/ai'
import { toast } from '@/hooks/use-toast'

interface PostSeoWidgetProps {
  caption: string
  title?: string
  network?: string
  niche?: string
  tone?: string
  onApplyImprovement?: (newCaption: string) => void
  className?: string
}

interface SeoCheckItem {
  id: string
  label: string
  passed: boolean
  impact: 'Alto' | 'Médio' | 'Baixo'
  detail: string
  actionLabel?: string
  onAction?: () => void
}

export function PostSeoWidget({
  caption,
  title = '',
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

  // Checagens adicionais detalhadas solicitadas no item 3
  const text = (caption || '').trim()
  const firstLine = text.split('\n')[0] || ''
  const hasHook =
    firstLine.split(/\s+/).filter(Boolean).length >= 4 &&
    /como|por que|o segredo|3 dicas|5 passos|você sabia|pare de|atenção|guia|erro|segredo|\?|!/i.test(
      firstLine,
    )

  const hashtagMatches = text.match(/#[a-zA-Z0-9_\u00C0-\u017F]+/g) || []
  const hashtagCount = hashtagMatches.length

  // Densidade ideal por rede
  const isHashtagsOptimal = useMemo(() => {
    if (normNetwork === 'twitter') return hashtagCount >= 1 && hashtagCount <= 2
    if (normNetwork === 'linkedin') return hashtagCount >= 3 && hashtagCount <= 5
    if (normNetwork === 'tiktok') return hashtagCount >= 3 && hashtagCount <= 6
    return hashtagCount >= 3 && hashtagCount <= 15
  }, [normNetwork, hashtagCount])

  const hasCta =
    /comente|salve|compartilhe|clique no link|link na bio|me conta|qual sua opinião|deixe seu|salva esse|marca|envie|comenta|cadastre-se|garanta sua/i.test(
      text,
    )

  // Presença de palavra-chave do título
  const titleKeywords = useMemo(() => {
    if (!title?.trim()) return []
    return title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['para', 'com', 'esse', 'essa', 'como', 'mais'].includes(w))
  }, [title])

  const hasTitleKeywordInCaption = useMemo(() => {
    if (titleKeywords.length === 0) return true
    const capLower = text.toLowerCase()
    return titleKeywords.some((kw) => capLower.includes(kw))
  }, [titleKeywords, text])

  // Emojis e escaneabilidade (quebras de linha)
  const hasEmojis = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)
  const lineBreaks = (text.match(/\n/g) || []).length
  const isScannable = text.length < 150 ? true : lineBreaks >= 2

  // Ações de 1 clique
  const handleApplyAlternativeHook = (altHook: string) => {
    if (!onApplyImprovement) return
    const lines = caption.split('\n')
    lines[0] = altHook
    onApplyImprovement(lines.join('\n'))
    toast({ title: 'Gancho atualizado na 1ª linha!' })
  }

  const handleApplyCta = (altCta?: string) => {
    if (!onApplyImprovement) return
    const ctaText =
      altCta ||
      analysis.breakdown.cta.suggestedCtas?.[0] ||
      '📌 Salve este post para consultar depois e compartilhe com sua equipe!'
    const updated = `${caption.trim()}\n\n${ctaText}`
    onApplyImprovement(updated)
    toast({ title: 'CTA inserida com sucesso!' })
  }

  const handleReduceHashtags = () => {
    if (!onApplyImprovement) return
    const max =
      normNetwork === 'twitter'
        ? 2
        : normNetwork === 'linkedin'
          ? 4
          : normNetwork === 'tiktok'
            ? 5
            : 8
    const kept = hashtagMatches.slice(0, max)
    const textWithoutHashtags = caption.replace(/#[a-zA-Z0-9_\u00C0-\u017F]+/g, '').trim()
    const updated = `${textWithoutHashtags}\n\n${kept.join(' ')}`
    onApplyImprovement(updated)
    toast({ title: `Hashtags reduzidas para o ideal (${kept.length} tags)!` })
  }

  const handleAddHashtags = () => {
    if (!onApplyImprovement) return
    const cleanNiche = (niche || 'conteudo').toLowerCase().replace(/[^a-z0-9]/g, '')
    const tags = [`#${cleanNiche}`, '#dicas', '#estrategia', '#marketing'].slice(
      0,
      normNetwork === 'twitter' ? 2 : 4,
    )
    const updated = `${caption.trim()}\n\n${tags.join(' ')}`
    onApplyImprovement(updated)
    toast({ title: 'Hashtags recomendadas adicionadas!' })
  }

  const handleAddScannability = () => {
    if (!onApplyImprovement) return
    const sentences = caption.split(/(\. |! |\? )/g).filter(Boolean)
    if (sentences.length <= 2) {
      onApplyImprovement(`${caption.trim()}\n\n💡 Destaque chave: aplique hoje mesmo.`)
    } else {
      let result = ''
      for (let i = 0; i < sentences.length; i += 2) {
        result += (sentences[i] || '') + (sentences[i + 1] || '') + '\n\n'
      }
      onApplyImprovement(result.trim())
    }
    toast({ title: 'Quebras de linha e respiro adicionados!' })
  }

  const handleAddTitleKeyword = () => {
    if (!onApplyImprovement || titleKeywords.length === 0) return
    const topWord = titleKeywords[0]
    const updated = `Sobre ${topWord}: ${caption.trim()}`
    onApplyImprovement(updated)
    toast({ title: `Palavra-chave "${topWord}" integrada ao texto!` })
  }

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
Adicione um gancho forte na primeira linha antes de "...mais", melhore a legibilidade com respiro de parágrafos e emojis pontuais, adicione uma chamada para ação clara (CTA para salvar/comentar) e inclua as hashtags mais estratégicas para ${niche || 'conteúdo'}.`,
        tone,
      })

      if (res?.improvedText && onApplyImprovement) {
        onApplyImprovement(res.improvedText)
        toast({
          title: 'Legenda otimizada para SEO!',
          description: `Score aprimorado com gancho, CTA, escaneabilidade e tags recomendadas.`,
        })
      }
    } catch {
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

  // Checklist estruturado
  const checklist: SeoCheckItem[] = [
    {
      id: 'hook',
      label: 'Gancho de impacto na 1ª linha',
      passed: hasHook,
      impact: 'Alto',
      detail: hasHook
        ? 'A 1ª linha captura atenção antes do corte (...mais).'
        : 'Inicie com pergunta instigante ou promessa direta.',
      actionLabel: !hasHook ? 'Aplicar Gancho' : undefined,
      onAction: !hasHook
        ? () =>
            handleApplyAlternativeHook(
              analysis.breakdown.hook.suggestedAlternatives?.[0] ||
                'Pare de perder tempo: o método definitivo revelado 👇',
            )
        : undefined,
    },
    {
      id: 'length',
      label: `Extensão ideal para ${normNetwork}`,
      passed: analysis.breakdown.length.status === 'good',
      impact: 'Médio',
      detail: `${analysis.breakdown.length.charCount} caracteres (${analysis.breakdown.length.recommendedRange}).`,
    },
    {
      id: 'hashtags',
      label: 'Densidade de hashtags calibrada',
      passed: isHashtagsOptimal,
      impact: 'Médio',
      detail: `${hashtagCount} tags detectadas. Ideal: ${
        normNetwork === 'twitter'
          ? '1-2'
          : normNetwork === 'linkedin'
            ? '3-5'
            : normNetwork === 'tiktok'
              ? '3-6'
              : '3-15'
      } tags.`,
      actionLabel:
        hashtagCount === 0
          ? 'Adicionar Tags'
          : !isHashtagsOptimal && hashtagCount > 6
            ? 'Reduzir Excesso'
            : undefined,
      onAction:
        hashtagCount === 0
          ? handleAddHashtags
          : !isHashtagsOptimal && hashtagCount > 6
            ? handleReduceHashtags
            : undefined,
    },
    {
      id: 'cta',
      label: 'Chamada para Ação (CTA) clara',
      passed: hasCta,
      impact: 'Alto',
      detail: hasCta
        ? 'CTA presente para estimular salvamento e comentários.'
        : 'Falta CTA final direcionando o leitor a interagir.',
      actionLabel: !hasCta ? 'Adicionar CTA' : undefined,
      onAction: !hasCta ? () => handleApplyCta() : undefined,
    },
    {
      id: 'keyword',
      label: 'Palavra-chave do título na legenda',
      passed: hasTitleKeywordInCaption,
      impact: 'Médio',
      detail: hasTitleKeywordInCaption
        ? 'Alinhamento semântico entre título e legenda confirmado.'
        : `Inclua o tema "${titleKeywords[0] || 'principal'}" no corpo do texto.`,
      actionLabel:
        !hasTitleKeywordInCaption && titleKeywords.length > 0 ? 'Integrar Palavra' : undefined,
      onAction: !hasTitleKeywordInCaption ? handleAddTitleKeyword : undefined,
    },
    {
      id: 'scannability',
      label: 'Escaneabilidade e quebra de parágrafos',
      passed: isScannable,
      impact: 'Médio',
      detail: isScannable
        ? 'Boa distribuição de respiros visuais para leitura no celular.'
        : 'Texto muito denso em bloco único. Quebre em parágrafos curtos.',
      actionLabel: !isScannable ? 'Adicionar Respiros' : undefined,
      onAction: !isScannable ? handleAddScannability : undefined,
    },
    {
      id: 'emojis',
      label: 'Uso de emojis moderados',
      passed: hasEmojis,
      impact: 'Baixo',
      detail: hasEmojis
        ? 'Emojis pontuais auxiliam na leitura dinâmica.'
        : 'Emojis podem guiar os pontos de leitura.',
    },
  ]

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
      {/* Header com Score 0-100 */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground whitespace-nowrap">
                Análise de SEO da Legenda
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono font-bold shrink-0 ${scoreBadgeBg}`}
              >
                {analysis.score}/100
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              Otimização de Descoberta Orgânica • {normNetwork.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xl font-black ${scoreColor}`}>{analysis.score}</span>
          <span className="text-[10px] text-muted-foreground block font-medium">Score</span>
        </div>
      </div>

      <Progress value={analysis.score} className="h-1.5 rounded-full" />

      {/* Checklist com itens verdes/vermelhos e DICA APLICÁVEL em 1 clique */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Checklist de Otimização:
        </span>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`p-2 rounded-xl border flex items-start justify-between gap-2 text-xs transition-colors ${
                item.passed
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-foreground'
                  : 'bg-rose-500/5 border-rose-500/20 text-foreground'
              }`}
            >
              <div className="flex items-start gap-1.5 min-w-0 flex-1">
                {item.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-[11px] text-foreground leading-tight">
                      {item.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 h-4 border-none font-mono ${
                        item.passed
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.impact}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{item.detail}</p>
                </div>
              </div>

              {item.actionLabel && item.onAction && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={item.onAction}
                  className="h-6 px-2 text-[10px] font-bold shrink-0 rounded-lg border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                >
                  <Plus className="w-2.5 h-2.5 mr-0.5" />
                  {item.actionLabel}
                </Button>
              )}
            </div>
          ))}
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

      {/* Sugestões em Camadas & Mix Equilibrado */}
      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-600" /> Palavras-Chave para Descoberta
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
            onClick={handleApplyAiRewrite}
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
    </Card>
  )
}
