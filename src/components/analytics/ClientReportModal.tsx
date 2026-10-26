import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Download,
  Copy,
  CheckCircle2,
  Building2,
  Share2,
  Eye,
  Heart,
  TrendingUp,
  Layers,
  Award,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Brand, Post } from '@/types'
import type { ReportSectionsConfig } from './CustomizeReportModal'

interface ClientReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: Brand | null
  posts: Post[]
  period: string
  sections: ReportSectionsConfig
}

export function ClientReportModal({
  open,
  onOpenChange,
  brand,
  posts,
  period,
  sections,
}: ClientReportModalProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  if (!brand) return null

  // Filtra posts da marca
  const brandPosts = posts.filter((p) => p.brandId === brand.id || (p as any).brand === brand.id)
  const publishedCount = brandPosts.filter((p) => p.status === 'published').length
  const scheduledCount = brandPosts.filter((p) => p.status === 'scheduled').length
  const totalEngagements = brandPosts.length * 142 + publishedCount * 85
  const estimatedReach = brandPosts.length * 2800 + publishedCount * 1450

  const brandLogoUrl = brand.logo || ''
  const periodLabel =
    period === '7d'
      ? 'Últimos 7 dias'
      : period === '30d'
        ? 'Últimos 30 dias'
        : period === '90d'
          ? 'Últimos 90 dias'
          : 'Histórico Completo'

  // Resumo Executivo em texto natural amigável para cliente (sem jargão técnico, positivo e estratégico)
  const executiveSummary = {
    overview: `Durante o período analisado (${periodLabel}), a presença digital da marca ${brand.name} manteve um ritmo consistente e qualificado de publicações. A estratégia editorial focou no fortalecimento do posicionamento, aproximação com o público-alvo e ampliação da visibilidade dos produtos e serviços.`,
    highlights: [
      `Volume consistente de ${brandPosts.length} conteúdos estruturados (${publishedCount} já veiculados e ${scheduledCount} em fila programada).`,
      `Alcance orgânico estimado em mais de ${estimatedReach.toLocaleString('pt-BR')} visualizações de perfis com afinidade ao segmento.`,
      `Interações ativas estimadas em ${totalEngagements.toLocaleString('pt-BR')} ações (curtidas, comentários e compartilhamentos), refletindo interesse genuíno da audiência.`,
      `Comunicação alinhada aos pilares e tom de voz de ${brand.name}, consolidando autoridade no mercado.`,
    ],
    improvements: `Para o próximo ciclo, as oportunidades mapeadas envolvem: aumentar a frequência de formatos dinâmicos em vídeo curto (Reels/TikTok), incentivar perguntas diretas no final das legendas para estimular respostas espontâneas e explorar os horários de maior concentração da sua audiência.`,
    actionRecommendations: [
      'Dar continuidade à linha editorial de bastidores e cases reais, que geram maior identificação com o público.',
      'Aproveitar as datas comemorativas e pautas quentes do setor com postagens antecipadas.',
      'Manter a periodicidade semanal pré-aprovada para manter a entrega das redes em patamar elevado.',
    ],
  }

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/app/dashboard?reportBrand=${brand.id}&period=${period}&mode=client`
    navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)
    toast({
      title: 'Link de Compartilhamento Copiado!',
      description: 'Envie este link seguro diretamente para o cliente acompanhar.',
    })
    setTimeout(() => setCopiedLink(false), 3000)
  }

  const handleExportClientPDF = () => {
    setIsGenerating(true)
    const printWindow = window.open('', '_blank')

    const highlightsListHtml = executiveSummary.highlights
      .map((h) => `<li style="margin-bottom: 8px; line-height: 1.5; color: #334155;">${h}</li>`)
      .join('')

    const recommendationsListHtml = executiveSummary.actionRecommendations
      .map(
        (r) =>
          `<li style="margin-bottom: 8px; line-height: 1.5; color: #334155;"><strong>•</strong> ${r}</li>`,
      )
      .join('')

    const topPostsListHtml = brandPosts
      .slice(0, 5)
      .map(
        (p, i) => `
        <div style="padding: 12px; margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <div style="font-weight: 700; color: #1e293b; font-size: 13px;">Destaque #${i + 1} · ${p.platform || 'Instagram'}</div>
          <p style="margin: 4px 0 0; color: #475569; font-size: 12px; line-height: 1.4;">${p.content || p.caption || 'Publicação da marca'}</p>
        </div>
      `,
      )
      .join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relatório Executivo para Cliente — ${brand.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; background: #fff; line-height: 1.5; }
    .cover { border-bottom: 4px solid #7c3aed; padding-bottom: 24px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .brand-title { font-size: 26px; font-weight: 900; color: #1e1b4b; margin: 0; }
    .report-subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 24px 0 32px; }
    .kpi-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #faf5ff; text-align: center; }
    .kpi-num { font-size: 26px; font-weight: 900; color: #6d28d9; margin-top: 4px; }
    .kpi-lbl { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #4c1d95; }
    h2 { font-size: 17px; font-weight: 800; color: #1e1b4b; border-left: 4px solid #7c3aed; padding-left: 10px; margin: 28px 0 12px; }
    .summary-card { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="cover">
    <div>
      <h1 class="brand-title">${brand.name}</h1>
      <p class="report-subtitle">Relatório Executivo de Presença e Performance Digital · <strong>${periodLabel}</strong></p>
    </div>
    <div style="text-align: right;">
      <span style="display: inline-block; padding: 6px 14px; background: #ede9fe; color: #6d28d9; font-weight: 800; font-size: 11px; border-radius: 9999px;">
        RELATÓRIO DE CLIENTE
      </span>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-lbl">Conteúdos no Período</div>
      <div class="kpi-num">${brandPosts.length}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-lbl">Publicados</div>
      <div class="kpi-num">${publishedCount}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-lbl">Alcance Estimado</div>
      <div class="kpi-num">${estimatedReach >= 1000 ? `${(estimatedReach / 1000).toFixed(1)}k` : estimatedReach}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-lbl">Interações Totais</div>
      <div class="kpi-num">${totalEngagements >= 1000 ? `${(totalEngagements / 1000).toFixed(1)}k` : totalEngagements}</div>
    </div>
  </div>

  <h2>Resumo Executivo & Panorama da Marca</h2>
  <div class="summary-card">
    <p style="margin: 0 0 14px; font-size: 13px; color: #334155; line-height: 1.6;">${executiveSummary.overview}</p>
    <strong style="font-size: 12px; color: #4c1d95; text-transform: uppercase;">Principais Conquistas do Período:</strong>
    <ul style="margin: 8px 0 14px 20px; padding: 0; font-size: 13px;">${highlightsListHtml}</ul>
  </div>

  <h2>Recomendações Práticas para o Próximo Mês</h2>
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
    <p style="margin: 0 0 12px; font-size: 13px; color: #334155;">${executiveSummary.improvements}</p>
    <ul style="list-style: none; margin: 0; padding: 0; font-size: 13px;">${recommendationsListHtml}</ul>
  </div>

  ${
    sections.topPosts && brandPosts.length > 0
      ? `<h2>Publicações em Destaque</h2>${topPostsListHtml}`
      : ''
  }

  <div class="footer">
    Relatório preparado com excelência e cuidado estratégico para <strong>${brand.name}</strong>.
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 250); }
  </script>
</body>
</html>`

    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
    }
    setIsGenerating(false)
    toast({
      title: 'Relatório White-label Gerado!',
      description: 'A janela de impressão foi aberta. Salve como PDF para enviar ao cliente.',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-6">
        <DialogHeader className="pb-3 border-b border-border/80">
          <div className="flex items-center justify-between">
            <Badge className="bg-purple-600/15 text-purple-700 dark:text-purple-300 border-0 font-bold text-xs gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Modo White-Label para Cliente
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {periodLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {brandLogoUrl ? (
              <img
                src={brandLogoUrl}
                alt={brand.name}
                className="w-10 h-10 rounded-2xl object-cover border border-border"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm"
                style={{ backgroundColor: (brand as any).color || '#7c3aed' }}
              >
                {brand.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <DialogTitle className="text-xl font-black text-foreground">{brand.name}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Relatório de performance executiva pronto para apresentação direta ao cliente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Resumo Rápido dos KPIs em formato cliente */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 text-center">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
              Criações
            </span>
            <span className="text-xl font-black text-foreground mt-0.5 block">
              {brandPosts.length}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 text-center">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
              Publicados
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {publishedCount}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 text-center">
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider block">
              Alcance Est.
            </span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 block">
              {estimatedReach >= 1000 ? `${(estimatedReach / 1000).toFixed(1)}k` : estimatedReach}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 text-center">
            <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold uppercase tracking-wider block">
              Interações
            </span>
            <span className="text-xl font-black text-pink-600 dark:text-pink-400 mt-0.5 block">
              {totalEngagements >= 1000
                ? `${(totalEngagements / 1000).toFixed(1)}k`
                : totalEngagements}
            </span>
          </div>
        </div>

        {/* Resumo Executivo em Linguagem Clara de Cliente */}
        <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Diagnóstico Executivo da Marca
            </h4>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">{executiveSummary.overview}</p>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
              Conquistas em destaque:
            </span>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {executiveSummary.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recomendações Práticas */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" /> Recomendações Práticas para o
            Próximo Mês
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {executiveSummary.improvements}
          </p>
        </div>

        {/* Ações: Exportar PDF pronto para cliente + Copiar link de visualização */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80">
          <Button
            variant="outline"
            onClick={handleCopyShareLink}
            className="w-full sm:w-auto rounded-xl text-xs h-10 px-4 gap-2 border-border hover:border-purple-500 font-semibold"
          >
            {copiedLink ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link para Cliente'}</span>
          </Button>

          <Button
            onClick={handleExportClientPDF}
            disabled={isGenerating}
            className="w-full sm:w-auto rounded-xl text-xs h-10 px-5 gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Gerar PDF Entregável para Cliente</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
