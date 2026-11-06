import { useState, useEffect, useMemo } from 'react'
import {
  Sparkles,
  Loader2,
  Download,
  Save,
  FileText,
  TrendingUp,
  Lightbulb,
  ListChecks,
  HelpCircle,
  BrainCircuit,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import {
  PostMetric,
  getPostMetricsListByPost,
  getSimulatedMultiNetworkMetrics,
} from '@/services/post-metrics'
import {
  generateIndividualPostReport,
  createPerformanceReport,
  IndividualPostReport,
} from '@/services/performance-reports'

interface IndividualPostReportTriggerProps {
  post: any
  className?: string
  label?: string
}

/**
 * Botão + modal de Relatório Individual do Post com IA generativa de consultoria.
 * Autocontido: gerencia o próprio estado de abertura, busca as métricas do post
 * (reais ou estimativa calibrada) e permite salvar no histórico e exportar.
 */
export function IndividualPostReportTrigger({
  post,
  className = '',
  label = 'Relatório IA do Post',
}: IndividualPostReportTriggerProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<IndividualPostReport | null>(null)
  const [metricsList, setMetricsList] = useState<PostMetric[]>([])
  const [saving, setSaving] = useState(false)

  const isPublished = post?.status === 'published'

  useEffect(() => {
    if (!open || !post?.id) return
    let cancelled = false

    const load = async () => {
      setGenerating(true)
      setReport(null)
      try {
        const list = await getPostMetricsListByPost(post.id)
        if (cancelled) return
        const targetNets =
          Array.isArray(post.targetNetworks) && post.targetNetworks.length > 0
            ? post.targetNetworks
            : [post.platform || 'Instagram']
        const finalList =
          list && list.length > 0
            ? list
            : getSimulatedMultiNetworkMetrics(post.id, targetNets, post.created || post.createdAt)
        setMetricsList(finalList)

        const totalImpressoes = finalList.reduce((acc, m) => acc + m.impressoes, 0)
        const totalEngajamento = finalList.reduce((acc, m) => acc + m.engajamento, 0)
        const taxaMedia =
          totalImpressoes > 0
            ? Number(((totalEngajamento / totalImpressoes) * 100).toFixed(2))
            : finalList[0]?.taxa_engajamento || 0

        const generated = await generateIndividualPostReport({
          postTitle: post.content || post.title || 'Post sem título',
          postCaption: post.caption || '',
          network: targetNets.join(', '),
          format: post.format || 'Feed',
          publishedAt: post.created || post.createdAt,
          metrics: {
            alcance: finalList.reduce((acc, m) => acc + m.alcance, 0),
            impressoes: totalImpressoes,
            engajamento: totalEngajamento,
            cliques: finalList.reduce((acc, m) => acc + (m.cliques || 0), 0),
            salvamentos: finalList.reduce((acc, m) => acc + m.salvamentos, 0),
            compartilhamentos: Math.round(totalEngajamento * 0.08),
            comentarios: Math.round(totalEngajamento * 0.22),
            taxaEngajamento: taxaMedia,
          },
          brandAverageRate: 5.1,
        })
        if (!cancelled) setReport(generated)
      } catch (err) {
        console.warn('[IndividualPostReport] Erro ao gerar relatório:', err)
        if (!cancelled) {
          toast({
            title: 'Erro ao gerar relatório',
            description: 'Tente novamente em instantes.',
            variant: 'destructive',
          })
        }
      } finally {
        if (!cancelled) setGenerating(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id])

  const consolidated = useMemo(() => {
    if (metricsList.length === 0) return null
    const totalAlcance = metricsList.reduce((acc, m) => acc + m.alcance, 0)
    const totalImpressoes = metricsList.reduce((acc, m) => acc + m.impressoes, 0)
    const totalEngajamento = metricsList.reduce((acc, m) => acc + m.engajamento, 0)
    return {
      alcance: totalAlcance,
      impressoes: totalImpressoes,
      engajamento: totalEngajamento,
      salvamentos: metricsList.reduce((acc, m) => acc + m.salvamentos, 0),
      taxa:
        totalImpressoes > 0
          ? Number((totalEngagementRate(totalEngajamento, totalImpressoes) * 100).toFixed(2))
          : 0,
    }
  }, [metricsList])

  const handleSave = async () => {
    if (!report || !user?.id) return
    setSaving(true)
    try {
      await createPerformanceReport({
        user: user.id,
        title: `Relatório Individual do Post — ${(post.content || 'Post').slice(0, 60)}`,
        report_type: 'post',
        frequency: 'avulso',
        period_range: post.created
          ? new Date(post.created).toLocaleDateString('pt-BR')
          : 'Publicação recente',
        channels_included:
          Array.isArray(post.targetNetworks) && post.targetNetworks.length > 0
            ? post.targetNetworks
            : [post.platform || 'Instagram'],
        executive_summary: report.executiveSummary,
        engagement_data_json: {
          isAdvancedAiReport: true,
          consultantNarrative: report.consultantNarrative,
          causalHypotheses: report.causalHypotheses,
          actionPlan: report.actionPlan,
          followUpQuestions: report.followUpQuestions,
          prioritizedRecommendations: {
            high: report.recommendations.next,
            medium: report.recommendations.evergreen,
            low: [],
          },
          individualPost: {
            postId: post.id,
            network: post.platform || 'Instagram',
            captionPreview: (post.caption || '').slice(0, 200),
          },
        },
        kpis_json: {
          totalPosts: 1,
          totalEngagement: consolidated?.engajamento || 0,
          avgEngagementRate: consolidated?.taxa || 0,
          totalReach: consolidated?.alcance || 0,
          bestChannel: post.platform || 'Instagram',
          bestFormat: post.format || 'Feed',
        },
      })
      toast({
        title: 'Relatório salvo no histórico!',
        description: 'Disponível em "Meus Relatórios" na aba de Performance.',
      })
    } catch (err) {
      console.warn('[IndividualPostReport] Erro ao salvar relatório:', err)
      toast({
        title: 'Erro ao salvar relatório',
        description: 'Verifique a conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const buildExportText = () => {
    if (!report) return ''
    const lines = [
      'BESTCONTENT SOCIAL 2 — RELATÓRIO INDIVIDUAL DO POST (IA AVANÇADA)',
      `Post: ${post.content || post.title || 'Post'}`,
      `Rede: ${post.platform || 'Instagram'} | Status: publicado`,
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      '',
      'RESUMO EXECUTIVO',
      report.executiveSummary,
      '',
      'NARRATIVA DO CONSULTOR',
      ...report.consultantNarrative.flatMap((p) => [p, '']),
      'HIPÓTESES CAUSAIS',
      ...report.causalHypotheses.flatMap((h) => [
        `• ${h.metric} (${h.variation})`,
        `  Por quê: ${h.reason}`,
        `  Evidência: ${h.evidence}`,
        `  Ação: ${h.action}`,
        '',
      ]),
      'RECOMENDAÇÕES PARA OS PRÓXIMOS POSTS',
      ...report.recommendations.next.map((r) => `• ${r}`),
      ...report.recommendations.evergreen.map((r) => `• ${r}`),
      '',
      'PLANO DE AÇÃO',
      ...report.actionPlan.map(
        (p) => `• [${p.priority.toUpperCase()}] ${p.dueDate} — ${p.task} (Resp.: ${p.owner})`,
      ),
      '',
      'PERGUNTAS DE FOLLOW-UP',
      ...report.followUpQuestions.map((q) => `• ${q}`),
    ]
    return lines.join('\n')
  }

  const handleExportPdf = () => {
    const blob = new Blob([buildExportText()], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-post-${(post.id || 'individual').slice(0, 8)}-${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({ title: 'Relatório exportado!', description: 'Arquivo gerado e baixado com sucesso.' })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!isPublished}
        onClick={() => setOpen(true)}
        title={
          isPublished
            ? 'Gera relatório avançado com IA desta publicação individual'
            : 'Disponível após a publicação do post'
        }
        className={`text-xs gap-1.5 rounded-xl border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{label}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                IA Generativa · Consultor Sênior
              </span>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-600" />
              <span className="truncate">Relatório Individual do Post</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground truncate">
              {post?.content || post?.title || 'Post'} · {post?.platform || 'Instagram'}
            </DialogDescription>
          </DialogHeader>

          {generating || !report ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analisando métricas e gerando narrativa de consultor…</span>
              </div>
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4 py-1">
              {/* KPIs rápidos do post */}
              {consolidated && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Alcance', value: consolidated.alcance },
                    { label: 'Impressões', value: consolidated.impressoes },
                    { label: 'Interações', value: consolidated.engajamento },
                    { label: 'Salvos', value: consolidated.salvamentos },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center"
                    >
                      <p className="text-[10px] font-semibold text-muted-foreground">{k.label}</p>
                      <p className="text-sm font-black text-foreground">
                        {k.value.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Resumo Executivo */}
              <section className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1.5">
                <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" /> Resumo Executivo
                </h4>
                <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                  {report.executiveSummary}
                </p>
              </section>

              {/* Narrativa do Consultor */}
              <section className="space-y-2">
                <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-600" /> Narrativa do Consultor
                </h4>
                {report.consultantNarrative.map((p, i) => (
                  <p key={i} className="text-xs leading-relaxed text-muted-foreground text-justify">
                    {p}
                  </p>
                ))}
              </section>

              {/* Hipóteses Causais */}
              <section className="space-y-2">
                <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Hipóteses Causais
                </h4>
                {report.causalHypotheses.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-card border border-border/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{h.metric}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 px-1.5 py-0"
                      >
                        {h.variation}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Por quê:</strong> {h.reason}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Evidência:</strong> {h.evidence}
                    </p>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold leading-relaxed">
                      <strong>Ação:</strong> {h.action}
                    </p>
                  </div>
                ))}
              </section>

              {/* Recomendações */}
              <section className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-emerald-600" /> Recomendações
                </h4>
                {report.recommendations.next.map((r, i) => (
                  <p key={`n-${i}`} className="text-[11px] text-foreground/90 leading-relaxed">
                    • {r}
                  </p>
                ))}
                {report.recommendations.evergreen.map((r, i) => (
                  <p key={`e-${i}`} className="text-[11px] text-muted-foreground leading-relaxed">
                    • {r}
                  </p>
                ))}
              </section>

              {/* Plano de Ação */}
              <section className="space-y-1.5">
                <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-purple-600" /> Plano de Ação Datado
                </h4>
                {report.actionPlan.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60 text-[11px]"
                  >
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 shrink-0 ${
                        p.priority === 'alta'
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : p.priority === 'media'
                            ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                      }`}
                    >
                      {p.priority}
                    </Badge>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground leading-snug">{p.task}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.dueDate} · Resp.: {p.owner}
                      </p>
                    </div>
                  </div>
                ))}
              </section>

              {/* Follow-ups */}
              <section className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Follow-up Estratégico
                </h4>
                {report.followUpQuestions.map((q, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">
                    • {q}
                  </p>
                ))}
              </section>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPdf}
                  className="text-xs gap-1.5 rounded-xl"
                >
                  <FileText className="w-3.5 h-3.5" /> Exportar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs gap-1.5 rounded-xl border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Salvar no histórico
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportPdf}
                  className="text-xs gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar relatório
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function totalEngagementRate(engajamento: number, impressoes: number) {
  return impressoes > 0 ? engajamento / impressoes : 0
}
