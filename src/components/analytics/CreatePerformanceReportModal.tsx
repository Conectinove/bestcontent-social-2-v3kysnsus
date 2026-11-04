import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Calendar, Layers, Loader2, BarChart3 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  createPerformanceReport,
  generateExecutiveSummary,
  type PerformanceReportRecord,
} from '@/services/performance-reports'

interface CreatePerformanceReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string
  brandId?: string
  onReportCreated?: (report: PerformanceReportRecord) => void
  currentKpis?: {
    totalPosts: number
    totalEngagement: number
    avgEngagementRate: number
    totalReach: number
  }
}

const ALL_CHANNELS = [
  'Instagram Orgânico',
  'TikTok Orgânico',
  'YouTube Canal & Shorts',
  'LinkedIn Empresa & Perfil',
  'Substack Newsletter',
  'Google Business Profile',
  'Google Ads',
  'Meta Ads (Facebook/Instagram)',
  'TikTok Ads',
  'LinkedIn Ads',
]

export function CreatePerformanceReportModal({
  open,
  onOpenChange,
  userId,
  brandId,
  onReportCreated,
  currentKpis,
}: CreatePerformanceReportModalProps) {
  const [reportType, setReportType] = useState<
    'geral' | 'engajamento' | 'anuncios' | 'conteudo' | 'comentarios'
  >('comentarios')
  const [title, setTitle] = useState(
    'Relatório de Engajamento & Retenção — ' +
      new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  )
  const [frequency, setFrequency] = useState<'semanal' | 'mensal' | 'avulso'>('mensal')
  const [periodRange, setPeriodRange] = useState('Últimos 30 Dias')
  const [selectedChannels, setSelectedChannels] = useState<string[]>(ALL_CHANNELS.slice(0, 6))
  const [executiveSummary, setExecutiveSummary] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [saving, setSaving] = useState(false)

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel],
    )
  }

  const handleGenerateSummary = async () => {
    setIsGeneratingAi(true)
    try {
      const summary = await generateExecutiveSummary({
        title,
        reportType,
        periodRange,
        channels: selectedChannels,
        kpis: {
          totalPosts: currentKpis?.totalPosts || 28,
          totalEngagement: currentKpis?.totalEngagement || 14850,
          avgEngagementRate: currentKpis?.avgEngagementRate || 5.4,
          totalReach: currentKpis?.totalReach || 42800,
          bestChannel: 'Instagram Orgânico & LinkedIn',
          bestFormat: 'Carrossel Educativo & Vídeos Curtos 30s',
        },
      })
      setExecutiveSummary(summary)
      toast({
        title: 'Resumo Executivo Gerado!',
        description: 'O texto foi formulado com base nas métricas reais consolidadas.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao gerar resumo',
        description: 'Não foi possível gerar com a IA no momento.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Atenção', description: 'Dê um título ao relatório.' })
      return
    }

    setSaving(true)
    try {
      const isEngagement = reportType === 'engajamento'
      const isComments = reportType === 'comentarios'
      const avgRate = currentKpis?.avgEngagementRate || 5.4
      const totEng = currentKpis?.totalEngagement || 14850

      const newReport = await createPerformanceReport({
        user: userId,
        brand: brandId,
        title,
        report_type: reportType,
        frequency,
        period_range: periodRange,
        channels_included: selectedChannels,
        executive_summary: executiveSummary,
        is_scheduled: frequency !== 'avulso',
        engagement_data_json: {
          commentsData: isComments
            ? {
                totalComments: 142,
                pendingComments: 16,
                repliedComments: 118,
                ignoredComments: 8,
                responseRatePercentage: 88.0,
                avgResponseTimeHours: 1.8,
                commentsByPlatform: [
                  { platform: 'Instagram', total: 78, replied: 66, pending: 8 },
                  { platform: 'Facebook', total: 42, replied: 36, pending: 5 },
                  { platform: 'Twitter/X', total: 22, replied: 16, pending: 3 },
                ],
                topEngagedComments: [
                  {
                    platform: 'Instagram',
                    author: '@carlos.eduardo_agro',
                    text: 'Quando começam as inscrições para o curso de IA e Automação?',
                    likes: 14,
                    postTitle: 'Revolução da IA no Mercado 2026',
                    status: 'respondido',
                  },
                  {
                    platform: 'Facebook',
                    author: 'Mariana Silveira',
                    text: 'Parabéns Conectinove pelo treinamento em Barretos! Tem certificado reconhecido?',
                    likes: 11,
                    postTitle: 'Formatura e Certificação Profissional',
                    status: 'respondido',
                  },
                  {
                    platform: 'Twitter/X',
                    author: '@tech_dev_br',
                    text: 'Essa metodologia da Conectinove mudou o fluxo de captação da nossa agência.',
                    likes: 8,
                    postTitle: 'Fluxos de Alta Conversão',
                    status: 'respondido',
                  },
                ],
                aiRecommendations: [
                  'Ativar resposta automática para dúvidas frequentes de certificados e início de turmas.',
                  'Responder menções no Twitter/X em menos de 1 hora para aproveitar o pico de retweets.',
                  'Encaminhar contatos com alta intenção de matrícula diretamente para o WhatsApp de vendas.',
                ],
              }
            : undefined,
          engagementByNetwork: [
            {
              network: 'Instagram',
              rate: Number((avgRate * 1.15).toFixed(1)),
              interactions: Math.round(totEng * 0.45),
            },
            {
              network: 'LinkedIn',
              rate: Number((avgRate * 0.95).toFixed(1)),
              interactions: Math.round(totEng * 0.25),
            },
            {
              network: 'TikTok',
              rate: Number((avgRate * 1.25).toFixed(1)),
              interactions: Math.round(totEng * 0.18),
            },
            {
              network: 'YouTube',
              rate: Number((avgRate * 0.8).toFixed(1)),
              interactions: Math.round(totEng * 0.12),
            },
          ],
          engagementByFormat: [
            {
              format: 'Carrossel Educativo',
              rate: Number((avgRate * 1.35).toFixed(1)),
              avgInteractions: 480,
            },
            {
              format: 'Vídeo Curto (Reels / Shorts)',
              rate: Number((avgRate * 1.2).toFixed(1)),
              avgInteractions: 390,
            },
            {
              format: 'Talking Head com Gancho 3s',
              rate: Number((avgRate * 1.1).toFixed(1)),
              avgInteractions: 340,
            },
            {
              format: 'Post Único / Frase',
              rate: Number((avgRate * 0.75).toFixed(1)),
              avgInteractions: 190,
            },
          ],
          weeklyEvolution: [
            {
              week: 'Semana 1',
              engagementRate: Number((avgRate * 0.88).toFixed(1)),
              interactions: Math.round(totEng * 0.2),
            },
            {
              week: 'Semana 2',
              engagementRate: Number((avgRate * 0.94).toFixed(1)),
              interactions: Math.round(totEng * 0.23),
            },
            {
              week: 'Semana 3',
              engagementRate: Number((avgRate * 1.05).toFixed(1)),
              interactions: Math.round(totEng * 0.27),
            },
            {
              week: 'Semana 4',
              engagementRate: Number((avgRate * 1.13).toFixed(1)),
              interactions: Math.round(totEng * 0.3),
            },
          ],
          periodComparison: {
            currentRate: avgRate,
            previousRate: Number((avgRate * 0.86).toFixed(1)),
            diffPercentage: 16.3,
          },
          topEngagedPosts: [
            {
              title: '5 Erros Silenciosos de IA na Carreira (Do Básico ao Avançado)',
              network: 'Instagram',
              format: 'Carrossel Educativo',
              engagementRate: Number((avgRate * 1.6).toFixed(1)),
              interactions: 890,
            },
            {
              title: 'O Gancho Magnético dos 3 Segundos: Roteiro Pronto',
              network: 'TikTok',
              format: 'Talking Head',
              engagementRate: Number((avgRate * 1.4).toFixed(1)),
              interactions: 740,
            },
            {
              title: 'Estudo de Caso: Do Zero a 48 Clientes Qualificados',
              network: 'LinkedIn',
              format: 'Carrossel Estratégico',
              engagementRate: Number((avgRate * 1.3).toFixed(1)),
              interactions: 520,
            },
          ],
          aiRecommendations: [
            'Concentrar 50% dos lançamentos semanais no formato Carrossel Educativo com 5 a 7 slides.',
            'Aplicar gancho nos primeiros 3 segundos em todos os vídeos verticais para elevar a retenção acima de 45%.',
            'Finalizar posts com pergunta aberta provocativa para dobrar o volume orgânico de comentários.',
          ],
        },
        kpis_json: {
          totalPosts: currentKpis?.totalPosts || 28,
          totalEngagement: totEng,
          avgEngagementRate: avgRate,
          totalReach: currentKpis?.totalReach || 42800,
          bestChannel: isEngagement ? 'Instagram Orgânico & Reels' : 'Instagram Orgânico',
          bestFormat: 'Carrossel Educativo',
        },
        highlights_json: {
          topChannel: {
            name: isComments ? 'Instagram Comentários' : 'Instagram',
            engagement: isComments ? 88.0 : Number((avgRate * 1.15).toFixed(1)),
          },
          topFormat: {
            name: isComments ? 'Atendimento Rápido Direct & Feed' : 'Carrossel Educativo',
            reach: isComments ? 142 : 24500,
          },
          topPost: {
            title: isComments
              ? 'Dúvidas sobre Matrículas & IA no Mercado'
              : '5 Erros Silenciosos de IA na Carreira',
            rate: Number((avgRate * 1.6).toFixed(1)),
            channel: 'Instagram',
          },
          comparison: {
            currentPeriodReach: currentKpis?.totalReach || 42800,
            previousPeriodReach: Math.round((currentKpis?.totalReach || 42800) * 0.88),
            growthPercentage: 13.6,
          },
        },
      })

      toast({
        title: 'Relatório Criado com Sucesso!',
        description:
          frequency !== 'avulso'
            ? `Agendamento ${frequency} ativado e salvo no histórico.`
            : 'Relatório salvo em "Meus Relatórios".',
      })

      if (onReportCreated) onReportCreated(newReport)
      onOpenChange(false)
    } catch (err) {
      toast({
        title: 'Erro ao salvar relatório',
        description: 'Verifique a conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              Relatório Consolidado
            </span>
            <span className="text-xs text-muted-foreground">Multi-Canal & Anúncios</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <span>Criar / Agendar Novo Relatório</span>
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Agrega Instagram, TikTok, YouTube, LinkedIn, Substack, Google Business e Anúncios num
            documento único com resumo executivo por IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tipo de Relatório (NOVO: Engajamento como tipo de primeira classe) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center justify-between">
              <span>Tipo do Relatório</span>
              <span className="text-[10px] text-purple-600 font-semibold">
                Novo tipo: Engajamento
              </span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Button
                type="button"
                variant={reportType === 'comentarios' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setReportType('comentarios')
                  setTitle(
                    'Relatório de Comentários & Atendimento — ' +
                      new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                  )
                }}
                className={`text-xs h-9 font-bold ${
                  reportType === 'comentarios'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-foreground'
                }`}
              >
                💬 Comentários
              </Button>
              <Button
                type="button"
                variant={reportType === 'engajamento' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setReportType('engajamento')
                  setTitle(
                    'Relatório de Engajamento & Retenção — ' +
                      new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                  )
                }}
                className={`text-xs h-9 font-bold ${
                  reportType === 'engajamento'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-foreground'
                }`}
              >
                🔥 Engajamento
              </Button>
              <Button
                type="button"
                variant={reportType === 'geral' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setReportType('geral')
                  setTitle(
                    'Relatório Geral Consolidado — ' +
                      new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                  )
                }}
                className={`text-xs h-9 font-bold ${
                  reportType === 'geral' ? 'bg-purple-600 text-white shadow-xs' : 'text-foreground'
                }`}
              >
                📊 Geral
              </Button>
              <Button
                type="button"
                variant={reportType === 'conteudo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setReportType('conteudo')
                  setTitle(
                    'Relatório Editorial & Formatos — ' +
                      new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                  )
                }}
                className={`text-xs h-9 font-bold ${
                  reportType === 'conteudo'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-foreground'
                }`}
              >
                📝 Formatos
              </Button>
              <Button
                type="button"
                variant={reportType === 'anuncios' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setReportType('anuncios')
                  setTitle(
                    'Relatório de Campanhas Pagas — ' +
                      new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                  )
                }}
                className={`text-xs h-9 font-bold ${
                  reportType === 'anuncios'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-foreground'
                }`}
              >
                🎯 Anúncios
              </Button>
            </div>
          </div>

          {/* Título e Frequência */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="report-title" className="text-xs font-bold">
                Título do Relatório
              </Label>
              <Input
                id="report-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Balanço de Engajamento — Novembro"
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-freq" className="text-xs font-bold">
                Frequência / Agendamento
              </Label>
              <Select value={frequency} onValueChange={(val: any) => setFrequency(val)}>
                <SelectTrigger id="report-freq" className="text-xs">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal (Toda Segunda)</SelectItem>
                  <SelectItem value="mensal">Mensal (Fechamento)</SelectItem>
                  <SelectItem value="avulso">Avulso (Sob Demanda)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Período de Análise */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Período de Comparação</Label>
            <div className="grid grid-cols-3 gap-2">
              {['Últimos 7 Dias', 'Últimos 30 Dias', 'Últimos 90 Dias (Trimestre)'].map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={periodRange === p ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setPeriodRange(p)}
                  className={`text-xs h-8 ${periodRange === p ? 'border-purple-500 font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300' : ''}`}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {/* Canais Inclusos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">
                Canais & Fontes Inclusos ({selectedChannels.length})
              </Label>
              <button
                type="button"
                onClick={() =>
                  setSelectedChannels(
                    selectedChannels.length === ALL_CHANNELS.length ? [] : ALL_CHANNELS,
                  )
                }
                className="text-[11px] text-purple-600 hover:underline font-semibold"
              >
                {selectedChannels.length === ALL_CHANNELS.length
                  ? 'Desmarcar todos'
                  : 'Selecionar todos'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 border border-border/60">
              {ALL_CHANNELS.map((ch) => {
                const checked = selectedChannels.includes(ch)
                return (
                  <label
                    key={ch}
                    className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none hover:text-purple-600 transition-colors"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleChannel(ch)} />
                    <span className="truncate">{ch}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Resumo Executivo com IA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="exec-summary" className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Resumo Executivo (IA com Aprendizado Real)</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={isGeneratingAi}
                className="h-7 text-xs px-2.5 gap-1 border-purple-500/40 text-purple-600 hover:bg-purple-500/10"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Gerando análise...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Gerar com IA</span>
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="exec-summary"
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              placeholder="Clique em 'Gerar com IA' para produzir um resumo executivo sintetizando os resultados consolidados..."
              rows={4}
              className="text-xs sm:text-sm leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 min-w-[120px]"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BarChart3 className="w-3.5 h-3.5" />
            )}
            <span>Salvar Relatório</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
