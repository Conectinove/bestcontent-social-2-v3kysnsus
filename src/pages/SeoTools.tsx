import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Copy,
  Hash,
  Share2,
  Bookmark,
  Layers,
  ArrowRight,
  Save,
  Wand2,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import {
  analyzeCaptionSeo,
  NETWORK_CHECKLISTS,
  saveSeoAudit,
  type SocialNetwork,
} from '@/services/seo'
import { improveText } from '@/services/ai'
import { useSocial } from '@/context/SocialContext'
import { toast } from '@/hooks/use-toast'

const SEO_TONES = [
  'Profissional',
  'Persuasivo',
  'Descontraído',
  'Educativo',
  'Inspiracional',
  'Urgente',
  'Storytelling',
]

export function SeoTools() {
  const { brands } = useSocial()
  const [selectedNetwork, setSelectedNetwork] = useState<SocialNetwork>('instagram')
  const [selectedBrandId, setSelectedBrandId] = useState<string>(brands[0]?.id || '')
  const [selectedTone, setSelectedTone] = useState<string>('Profissional')
  const [improvingWithAi, setImprovingWithAi] = useState(false)
  const [captionInput, setCaptionInput] = useState<string>(
    'Descubra 3 estratégias práticas para triplicar o engajamento orgânico do seu perfil em 30 dias.\n\nVocê já sentiu que seus posts não alcançam as pessoas certas? O algoritmo premia quem foca em retenção e valor real.\n\nSalve este conteúdo para aplicar na sua próxima semana de planejamento e compartilhe com um amigo que precisa ver isso!\n\n#socialmedia #marketingdigital #estrategiadeconteudo #engajamento #crescimentodigital',
  )
  const [nicheInput, setNicheInput] = useState<string>('Marketing & Redes Sociais')
  const [savingAudit, setSavingAudit] = useState(false)

  // Keywords finder
  const [keywordQuery, setKeywordQuery] = useState('')
  const [keywordsList, setKeywordsList] = useState([
    {
      term: 'como crescer no instagram',
      volume: '74.000 buscas/mês',
      difficulty: 'Alto',
      cpc: 'R$ 2,40',
      intent: 'Educacional',
    },
    {
      term: 'ideias de reels que viralizam',
      volume: '49.500 buscas/mês',
      difficulty: 'Médio',
      cpc: 'R$ 1,85',
      intent: 'Prático',
    },
    {
      term: 'melhor horário para postar',
      volume: '90.200 buscas/mês',
      difficulty: 'Alto',
      cpc: 'R$ 3,10',
      intent: 'Pesquisa Rápida',
    },
    {
      term: 'roteiro para carrossel',
      volume: '18.100 buscas/mês',
      difficulty: 'Fácil',
      cpc: 'R$ 1,20',
      intent: 'Criativo',
    },
    {
      term: 'gancho para tiktok',
      volume: '33.400 buscas/mês',
      difficulty: 'Médio',
      cpc: 'R$ 1,50',
      intent: 'Vídeo',
    },
    {
      term: 'bio do instagram que vende',
      volume: '27.000 buscas/mês',
      difficulty: 'Fácil',
      cpc: 'R$ 2,15',
      intent: 'Conversão',
    },
  ])

  const analysis = analyzeCaptionSeo(captionInput, selectedNetwork, nicheInput)
  const activeChecklist = NETWORK_CHECKLISTS[selectedNetwork]

  const handleApplyAiOptimization = async () => {
    if (!captionInput.trim()) {
      toast({ title: 'Insira um texto primeiro', variant: 'destructive' })
      return
    }

    setImprovingWithAi(true)
    try {
      const res = await improveText({
        text: captionInput,
        instruction: `Reescreva e otimize esta legenda para SEO da rede ${selectedNetwork} com tom ${selectedTone}.
Crie um gancho magnético e específico na 1ª linha antes do corte de '...mais', organize o corpo em parágrafos dinâmicos e legíveis, adicione uma chamada para ação clara (CTA para salvar ou comentar) e termine com 3 a 5 hashtags estratégicas para o nicho "${nicheInput}".`,
        tone: selectedTone,
      })

      if (res?.improvedText) {
        setCaptionInput(res.improvedText)
        toast({
          title: 'Legenda otimizada com IA!',
          description: `Score aprimorado no tom ${selectedTone} com gancho e CTA estratégico.`,
        })
      }
    } catch {
      const altHook =
        analysis.breakdown.hook.suggestedAlternatives?.[0] || 'Atenção para esta oportunidade:'
      const altCta =
        analysis.breakdown.cta.suggestedCtas?.[0] || '📌 Salve agora para consultar depois!'
      const altTags = (analysis.breakdown.hashtags.nicheSuggestions || []).slice(0, 4).join(' ')
      setCaptionInput(`${altHook}\n\n${captionInput}\n\n${altCta}\n\n${altTags}`)
      toast({ title: 'Sugestões de gancho, CTA e tags aplicadas!' })
    } finally {
      setImprovingWithAi(false)
    }
  }

  const handleApplyAlternativeHook = (alt: string) => {
    const lines = captionInput.split('\n')
    lines[0] = alt
    setCaptionInput(lines.join('\n'))
    toast({ title: 'Gancho atualizado na 1ª linha!' })
  }

  const handleApplyCta = (cta: string) => {
    setCaptionInput(`${captionInput.trim()}\n\n${cta}`)
    toast({ title: 'CTA adicionada ao final da legenda!' })
  }

  const handleCopyText = (txt: string, msg: string) => {
    navigator.clipboard.writeText(txt)
    toast({ title: 'Copiado!', description: msg })
  }

  const handleSearchKeywords = () => {
    if (!keywordQuery.trim()) return
    const term = keywordQuery.trim().toLowerCase()
    const newItems = [
      {
        term: `${term} tutorial`,
        volume: '31.200 buscas/mês',
        difficulty: 'Fácil',
        cpc: 'R$ 1,40',
        intent: 'Educacional',
      },
      {
        term: `como fazer ${term}`,
        volume: '54.000 buscas/mês',
        difficulty: 'Médio',
        cpc: 'R$ 2,10',
        intent: 'Busca Direta',
      },
      {
        term: `dicas de ${term} 2025`,
        volume: '22.800 buscas/mês',
        difficulty: 'Fácil',
        cpc: 'R$ 1,65',
        intent: 'Tendência',
      },
      {
        term: `melhores estratégias para ${term}`,
        volume: '19.400 buscas/mês',
        difficulty: 'Médio',
        cpc: 'R$ 2,80',
        intent: 'Avançado',
      },
    ]
    setKeywordsList((prev) => [...newItems, ...prev])
    toast({
      title: 'Palavras-chave geradas!',
      description: `Mapeados novos termos e volumes para "${keywordQuery}".`,
    })
    setKeywordQuery('')
  }

  const handleSaveAudit = async () => {
    setSavingAudit(true)
    try {
      await saveSeoAudit({
        brandId: selectedBrandId || undefined,
        network: selectedNetwork,
        niche: nicheInput,
        caption: captionInput,
        score: analysis.score,
        breakdown: analysis.breakdown,
        recommendations: analysis.recommendations,
        suggestedKeywords: analysis.suggestedKeywords,
      })
      toast({
        title: 'Auditoria salva!',
        description: `Score de ${analysis.score}/100 registrado com sucesso.`,
      })
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingAudit(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-foreground">Ferramentas de SEO Social</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Otimize legendas, ganchos, palavras-chave e checklists por rede para conquistar posições
            de destaque na busca orgânica
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs border-purple-500/30 text-purple-600 font-bold px-3 py-1"
          >
            Algoritmos Atualizados 2025
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="analyzer" className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-2xl border border-border">
          <TabsTrigger value="analyzer" className="rounded-xl text-xs font-bold gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Analisador de Legenda
          </TabsTrigger>
          <TabsTrigger value="keywords" className="rounded-xl text-xs font-bold gap-2">
            <Hash className="w-3.5 h-3.5 text-purple-600" /> Palavras-Chave & Volume
          </TabsTrigger>
          <TabsTrigger value="checklists" className="rounded-xl text-xs font-bold gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Checklist por Rede
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ANALISADOR DE LEGENDA */}
        <TabsContent value="analyzer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Editor de Legenda */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-5 rounded-3xl border-border bg-card space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Rede Alvo:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(
                        [
                          'instagram',
                          'tiktok',
                          'youtube',
                          'linkedin',
                          'facebook',
                          'twitter',
                        ] as SocialNetwork[]
                      ).map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setSelectedNetwork(net)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                            selectedNetwork === net
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-muted/60 hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {net}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Legenda ou Roteiro do Post:
                  </label>
                  <Textarea
                    rows={8}
                    value={captionInput}
                    onChange={(e) => setCaptionInput(e.target.value)}
                    placeholder="Cole ou redija o texto para avaliar a pontuação de SEO..."
                    className="text-xs rounded-2xl resize-none font-medium leading-relaxed bg-muted/30 focus-visible:ring-purple-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span>
                      {captionInput.length} caracteres &middot;{' '}
                      {captionInput.split(/\s+/).filter(Boolean).length} palavras
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          captionInput,
                          'Legenda copiada para a área de transferência.',
                        )
                      }
                      className="hover:text-foreground font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copiar texto
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Nicho ou Tema da Marca:
                    </label>
                    <Input
                      value={nicheInput}
                      onChange={(e) => setNicheInput(e.target.value)}
                      placeholder="Ex: Odontologia, Moda, SaaS..."
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Vincular à Marca:
                    </label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border bg-background text-xs px-3 font-semibold focus:outline-none"
                    >
                      <option value="">Nenhuma (Geral)</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Select value={selectedTone} onValueChange={setSelectedTone}>
                      <SelectTrigger className="h-9 text-xs w-[140px] rounded-xl bg-card">
                        <SelectValue placeholder="Tom de voz" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEO_TONES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      onClick={handleApplyAiOptimization}
                      disabled={improvingWithAi || !captionInput.trim()}
                      className="rounded-xl text-xs h-9 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5 shadow-xs"
                    >
                      {improvingWithAi ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      <span>Aplicar Sugestão com IA</span>
                    </Button>
                  </div>

                  <Button
                    onClick={handleSaveAudit}
                    disabled={savingAudit || !captionInput.trim()}
                    variant="outline"
                    className="rounded-xl text-xs h-9 px-4 font-bold gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingAudit ? 'Salvando...' : 'Salvar Auditoria'}</span>
                  </Button>
                </div>
              </Card>
            </div>

            {/* Coluna Direita: Diagnóstico & Score */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-5 rounded-3xl border-border bg-card space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border/80">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Score Geral de SEO Social
                    </span>
                    <h3 className="text-base font-black text-foreground">
                      Potencial de Indexação & Retenção
                    </h3>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-3xl font-black ${
                        analysis.score >= 80
                          ? 'text-emerald-500'
                          : analysis.score >= 60
                            ? 'text-amber-500'
                            : 'text-rose-500'
                      }`}
                    >
                      {analysis.score}
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-bold">/100</span>
                  </div>
                </div>

                {/* Critérios pontuados */}
                <div className="space-y-3">
                  {/* Hook */}
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Gancho da 1ª Linha
                        (Hook)
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          analysis.breakdown.hook.status === 'good'
                            ? 'text-emerald-600 border-emerald-500/30'
                            : 'text-amber-600 border-amber-500/30'
                        }`}
                      >
                        {analysis.breakdown.hook.score}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analysis.breakdown.hook.feedback}
                    </p>

                    {/* Alternativas sugeridas */}
                    {analysis.breakdown.hook.suggestedAlternatives && (
                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">
                          Alternativas sugeridas para a 1ª linha:
                        </span>
                        {analysis.breakdown.hook.suggestedAlternatives.map((alt, i) => (
                          <div
                            key={i}
                            onClick={() => handleApplyAlternativeHook(alt)}
                            className="p-1.5 rounded-xl bg-card border border-border/70 hover:border-purple-500/40 text-[11px] text-foreground cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <span className="truncate">"{alt}"</span>
                            <span className="text-purple-600 font-bold text-[10px] shrink-0 ml-1">
                              Usar
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-purple-600" /> Chamada para Ação (CTA)
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          analysis.breakdown.cta.status === 'good'
                            ? 'text-emerald-600 border-emerald-500/30'
                            : 'text-amber-600 border-amber-500/30'
                        }`}
                      >
                        {analysis.breakdown.cta.score}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analysis.breakdown.cta.feedback}
                    </p>

                    {/* CTAs sugeridas */}
                    {analysis.breakdown.cta.suggestedCtas && (
                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">
                          Exemplos de alta conversão:
                        </span>
                        {analysis.breakdown.cta.suggestedCtas.slice(0, 2).map((ctaEx, i) => (
                          <div
                            key={i}
                            onClick={() => handleApplyCta(ctaEx)}
                            className="p-1.5 rounded-xl bg-card border border-border/70 hover:border-purple-500/40 text-[11px] text-foreground cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <span className="truncate">{ctaEx}</span>
                            <span className="text-purple-600 font-bold text-[10px] shrink-0 ml-1">
                              Inserir
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Legibilidade & Parágrafos */}
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-600" /> Legibilidade e Respiro
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          analysis.breakdown.readability.status === 'good'
                            ? 'text-emerald-600 border-emerald-500/30'
                            : 'text-amber-600 border-amber-500/30'
                        }`}
                      >
                        {analysis.breakdown.readability.score}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analysis.breakdown.readability.feedback}
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-purple-600" /> Densidade de Hashtags
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          analysis.breakdown.hashtags.status === 'good'
                            ? 'text-emerald-600 border-emerald-500/30'
                            : 'text-amber-600 border-amber-500/30'
                        }`}
                      >
                        {analysis.breakdown.hashtags.count} tags (
                        {analysis.breakdown.hashtags.score}%)
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analysis.breakdown.hashtags.feedback}
                    </p>
                  </div>
                </div>

                {/* Recomendações Acionáveis */}
                {analysis.recommendations.length > 0 && (
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Ações Práticas para Elevar o Score:
                    </span>
                    <ul className="space-y-1 text-xs text-foreground/90">
                      {analysis.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: PALAVRAS-CHAVE & HASHTAGS COM VOLUME */}
        <TabsContent value="keywords" className="space-y-6">
          <Card className="p-6 rounded-3xl border-border bg-card space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-foreground">
                  Mapeamento de Palavras-Chave e Termos de Busca
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estimativas de volume de busca mensal e nível de concorrência por nicho
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchKeywords()}
                  placeholder="Pesquisar termo ou nicho..."
                  className="h-9 text-xs rounded-xl w-60"
                />
                <Button
                  onClick={handleSearchKeywords}
                  className="h-9 px-4 rounded-xl text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1"
                >
                  <Search className="w-3.5 h-3.5" /> Buscar
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Aviso de Estimativa:</strong> Volumes e CPCs baseados em benchmarks
                agregados do setor digital até sincronização de APIs diretas.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {keywordsList.map((k, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-muted/30 border border-border/70 hover:border-purple-500/40 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">{k.term}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        k.difficulty === 'Fácil'
                          ? 'border-emerald-500/30 text-emerald-600'
                          : k.difficulty === 'Médio'
                            ? 'border-amber-500/30 text-amber-600'
                            : 'border-rose-500/30 text-rose-600'
                      }`}
                    >
                      {k.difficulty}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/50">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Volume Est.</span>
                      <span className="font-bold text-foreground">{k.volume}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Intenção</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {k.intent}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCaptionInput((prev) => `${prev} ${k.term}`)
                      toast({
                        title: 'Termo inserido na legenda!',
                        description: `"${k.term}" foi adicionado ao analisador.`,
                      })
                    }}
                    className="w-full h-8 text-[11px] rounded-xl font-bold text-purple-600 hover:bg-purple-500/10 gap-1"
                  >
                    <span>Usar no post</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: CHECKLIST DE OTIMIZAÇÃO POR REDE */}
        <TabsContent value="checklists" className="space-y-6">
          <Card className="p-6 rounded-3xl border-border bg-card space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-foreground">{activeChecklist.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Boas práticas essenciais para garantir alcance máximo na busca e feed
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    'instagram',
                    'tiktok',
                    'youtube',
                    'linkedin',
                    'facebook',
                    'twitter',
                  ] as SocialNetwork[]
                ).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setSelectedNetwork(net)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      selectedNetwork === net
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-muted/60 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {activeChecklist.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-muted/30 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-foreground">{item.label}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold ${
                          item.impact === 'Crítico'
                            ? 'border-rose-500/30 text-rose-600 bg-rose-500/5'
                            : item.impact === 'Alto'
                              ? 'border-amber-500/30 text-amber-600 bg-amber-500/5'
                              : 'border-blue-500/30 text-blue-600 bg-blue-500/5'
                        }`}
                      >
                        Impacto {item.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <Badge className="bg-purple-600/15 text-purple-700 dark:text-purple-300 border-0 text-[10px] font-bold shrink-0 self-start sm:self-center">
                    Recomendado
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
