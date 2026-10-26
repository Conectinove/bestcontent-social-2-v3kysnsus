import { useState, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  Share2,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Video,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Trophy,
  Filter,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import type { Post, Brand } from '@/types'
import type { ABTest } from '@/services/ab-tests'

interface PerformanceReportProps {
  posts: Post[]
  brands: Brand[]
  abTests: ABTest[]
  userName?: string
}

export function PerformanceReport({
  posts,
  brands,
  abTests,
  userName = 'Ronaldo Barreto',
}: PerformanceReportProps) {
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d')

  // Período real: 7/30/90 dias ou tudo — filtra pela data de criação do post
  const periodDays =
    selectedPeriod === '7d'
      ? 7
      : selectedPeriod === '30d'
        ? 30
        : selectedPeriod === '90d'
          ? 90
          : null
  const periodCutoff = useMemo(() => {
    if (!periodDays) return null
    return Date.now() - periodDays * 24 * 60 * 60 * 1000
  }, [periodDays])

  // Filtro de posts por marca selecionada + período
  const filteredPosts = useMemo(() => {
    let list = posts
    if (selectedBrandId !== 'all') list = list.filter((p) => p.brandId === selectedBrandId)
    if (periodCutoff) {
      list = list.filter((p) => {
        const created = new Date(p._raw?.created || p.scheduledDate || 0).getTime()
        if (!created) return true
        return created >= periodCutoff
      })
    }
    return list
  }, [posts, selectedBrandId, periodCutoff])

  // Desempenho por status geral
  const statusStats = useMemo(() => {
    const published = filteredPosts.filter((p) => p.status === 'published').length
    const scheduled = filteredPosts.filter((p) => p.status === 'scheduled').length
    const draft = filteredPosts.filter((p) => p.status === 'draft').length
    const approved = filteredPosts.filter((p) => p.status === 'approved').length
    const total = filteredPosts.length
    // Taxa de aprovação pelo fluxo de aprovação por nível
    const approvalRate = total > 0 ? Math.round(((published + approved) / total) * 100) : 0

    return { published, scheduled, draft, approved, total, approvalRate }
  }, [filteredPosts])

  // Tempo médio de aprovação: diferença entre created e updated nos posts
  // que chegaram ao estado aprovado/publicado (só quando há amostra suficiente)
  const approvalTiming = useMemo(() => {
    const done = filteredPosts.filter((p) => p.status === 'approved' || p.status === 'published')
    const samples: number[] = []
    done.forEach((p) => {
      const created = new Date(p._raw?.created || 0).getTime()
      const updated = new Date(p._raw?.updated || 0).getTime()
      if (created && updated && updated >= created) {
        samples.push((updated - created) / (1000 * 60 * 60)) // horas
      }
    })
    if (samples.length === 0) return { avgHours: null, sampleSize: 0 }
    const avgHours = samples.reduce((a, b) => a + b, 0) / samples.length
    return { avgHours, sampleSize: samples.length }
  }, [filteredPosts])

  // Top tags e formatos mais usados na biblioteca (dentro do período)
  const topTagsAndFormats = useMemo(() => {
    const tagCount: Record<string, number> = {}
    const formatCount: Record<string, number> = {}

    filteredPosts.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          const tag = String(t).trim().toLowerCase()
          if (tag) tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      }
      // Formato via script_json (FLYER / VÍDEO / POST / CARROSSEL)
      let typeLabel = (p.platform || 'POST').toUpperCase()
      try {
        const meta =
          typeof p._raw?.script_json === 'string'
            ? JSON.parse(p._raw.script_json)
            : p._raw?.script_json
        if (meta?.type) typeLabel = String(meta.type).toUpperCase()
        else if (p._raw?.duration > 0) typeLabel = 'VÍDEO'
      } catch {
        /* ignore */
      }
      formatCount[typeLabel] = (formatCount[typeLabel] || 0) + 1
    })

    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }))
    const topFormats = Object.entries(formatCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([format, count]) => ({ format, count }))

    return { topTags, topFormats }
  }, [filteredPosts])

  // Desempenho por Marca (respeitando o período selecionado)
  const brandMetrics = useMemo(() => {
    return brands
      .map((b) => {
        const bPosts = filteredPosts.filter((p) => p.brandId === b.id)
        const pub = bPosts.filter((p) => p.status === 'published').length
        const sch = bPosts.filter((p) => p.status === 'scheduled').length
        const dft = bPosts.filter((p) => p.status === 'draft').length
        const app = bPosts.filter((p) => p.status === 'approved').length
        const total = bPosts.length
        const approvalRate = total > 0 ? Math.round(((pub + app) / total) * 100) : 0
        return {
          id: b.id,
          name: b.name,
          color: b.color_theme || '#9333EA',
          total,
          published: pub,
          scheduled: sch,
          draft: dft,
          approved: app,
          approvalRate,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [brands, filteredPosts])

  // Desempenho por Rede Social
  const networkMetrics = useMemo(() => {
    const networks: Record<
      string,
      {
        name: string
        count: number
        published: number
        scheduled: number
        draft: number
        approved: number
      }
    > = {
      instagram: { name: 'Instagram', count: 0, published: 0, scheduled: 0, draft: 0, approved: 0 },
      facebook: { name: 'Facebook', count: 0, published: 0, scheduled: 0, draft: 0, approved: 0 },
      linkedin: { name: 'LinkedIn', count: 0, published: 0, scheduled: 0, draft: 0, approved: 0 },
      youtube: { name: 'YouTube', count: 0, published: 0, scheduled: 0, draft: 0, approved: 0 },
      tiktok: { name: 'TikTok', count: 0, published: 0, scheduled: 0, draft: 0, approved: 0 },
      twitter: { name: 'X / Twitter', count: 0, published: 0, scheduled: 0, draft: 0, approved: 0 },
    }

    filteredPosts.forEach((post) => {
      const plat = (post.platform || 'instagram').toLowerCase()
      let key = 'instagram'
      if (plat.includes('face')) key = 'facebook'
      else if (plat.includes('link')) key = 'linkedin'
      else if (plat.includes('you')) key = 'youtube'
      else if (plat.includes('tik')) key = 'tiktok'
      else if (plat.includes('twit') || plat === 'x') key = 'twitter'

      if (networks[key]) {
        networks[key].count++
        if (post.status === 'published') networks[key].published++
        else if (post.status === 'scheduled') networks[key].scheduled++
        else if (post.status === 'draft') networks[key].draft++
        else if (post.status === 'approved') networks[key].approved++
      }
    })

    return Object.values(networks)
  }, [filteredPosts])

  // Evolução nos últimos 30 dias (agrupada por semanas / dias)
  const timelineData = useMemo(() => {
    const buckets: { label: string; count: number; published: number; scheduled: number }[] = [
      { label: 'Semana 1', count: 0, published: 0, scheduled: 0 },
      { label: 'Semana 2', count: 0, published: 0, scheduled: 0 },
      { label: 'Semana 3', count: 0, published: 0, scheduled: 0 },
      { label: 'Semana 4 (Atual)', count: 0, published: 0, scheduled: 0 },
    ]

    const now = Date.now()
    filteredPosts.forEach((p) => {
      const createdDate = new Date(p._raw?.created || p.scheduledDate || now).getTime()
      const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))
      let bucketIdx = 3
      if (diffDays > 21) bucketIdx = 0
      else if (diffDays > 14) bucketIdx = 1
      else if (diffDays > 7) bucketIdx = 2

      buckets[bucketIdx].count++
      if (p.status === 'published') buckets[bucketIdx].published++
      if (p.status === 'scheduled') buckets[bucketIdx].scheduled++
    })

    return buckets
  }, [filteredPosts])

  // Exportação CSV real com UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'Marca',
      'Total Posts',
      'Publicados',
      'Agendados',
      'Rascunhos',
      'Aprovados Nível',
      'Taxa de Aprovação (%)',
    ]

    const rows = brandMetrics.map((b) => [
      `"${b.name.replace(/"/g, '""')}"`,
      b.total,
      b.published,
      b.scheduled,
      b.draft,
      b.approved,
      `${b.approvalRate}%`,
    ])

    const summaryHeader = ['\n--- DESEMPENHO POR REDE SOCIAL ---', '', '', '', '', '', '']
    const networkHeaders = [
      'Rede Social',
      'Total',
      'Publicados',
      'Agendados',
      'Rascunhos',
      'Aprovados',
      '',
    ]
    const networkRows = networkMetrics.map((n) => [
      `"${n.name}"`,
      n.count,
      n.published,
      n.scheduled,
      n.draft,
      n.approved,
      '',
    ])

    const abHeader = ['\n--- TESTES A/B CONSOLIDADOS ---', '', '', '', '', '', '']
    const abHeaders = ['Experimento ID', 'Status', 'Objetivo', 'Vencedor', '', '', '']
    const abRows = abTests.map((t, idx) => [
      `"Teste #${idx + 1}"`,
      t.status === 'running' ? 'Em andamento' : t.status === 'completed' ? 'Concluído' : 'Rascunho',
      t.goal === 'clicks' ? 'Cliques' : 'Conversões',
      t.winner ? 'Vencedor Definido' : 'Pendente',
      '',
      '',
      '',
    ])

    const topTagsHeader = ['\n--- TOP TAGS MAIS USADAS ---', '', '', '', '', '', '']
    const topTagsRows = topTagsAndFormats.topTags.map((t) => [
      `"#${t.tag}"`,
      t.count,
      '',
      '',
      '',
      '',
      '',
    ])

    const csvContent =
      '\uFEFF' + // UTF-8 BOM
      [
        ['RELATÓRIO CONSOLIDADO DE PERFORMANCE - BESTCONTENT SOCIAL 2'],
        [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
        [`Usuário: ${userName}`],
        [`Período Selecionado: ${selectedPeriod}`],
        [`Taxa Média de Aprovação Geral: ${statusStats.approvalRate}%`],
        [
          `Tempo Médio Estimado de Aprovação: ${approvalTiming.avgHours !== null ? `${approvalTiming.avgHours.toFixed(1)}h` : 'N/D'}`,
        ],
        [''],
        headers,
        ...rows,
        summaryHeader,
        networkHeaders,
        ...networkRows,
        topTagsHeader,
        ...topTagsRows,
        abHeader,
        abHeaders,
        ...abRows,
      ]
        .map((e) => e.join(';'))
        .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `relatorio-performance-bestcontent-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'CSV exportado com sucesso!',
      description: 'Arquivo formatado em UTF-8 com BOM pronto para Excel e Google Planilhas.',
    })
  }

  // Exportação PDF via window.print() no mesmo padrão do app
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    const nowFormatted = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const brandRowsHtml = brandMetrics
      .map(
        (b) =>
          `<tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${b.name}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${b.total}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #16a34a; font-weight: 600;">${b.published}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #2563eb;">${b.scheduled}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #d97706;">${b.draft}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #7c3aed; font-weight: 600;">${b.approved}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${b.approvalRate}%</td>
          </tr>`,
      )
      .join('')

    const networkRowsHtml = networkMetrics
      .map(
        (n) =>
          `<tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${n.name}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${n.count}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${n.published}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${n.scheduled}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${n.approved}</td>
          </tr>`,
      )
      .join('')

    const abRowsHtml =
      abTests.length > 0
        ? abTests
            .map(
              (t, i) =>
                `<tr>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">Experimento #${i + 1}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.status === 'running' ? 'Em andamento' : t.status === 'completed' ? 'Concluído' : 'Rascunho'}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.goal === 'clicks' ? 'Cliques' : 'Conversões'}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${t.winner ? 'Vencedor definido' : 'Pendente'}</td>
                </tr>`,
            )
            .join('')
        : '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #64748b; border: 1px solid #e2e8f0;">Nenhum teste A/B no período.</td></tr>'

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relatório Executivo de Performance — BestContent Social 2</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 36px; color: #0f172a; background: #fff; }
    .header { border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { margin: 0 0 6px 0; font-size: 24px; color: #7c3aed; }
    .meta { font-size: 13px; color: #64748b; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 30px; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #faf5ff; }
    .kpi-title { font-size: 11px; text-transform: uppercase; color: #6b21a8; font-weight: bold; }
    .kpi-val { font-size: 26px; font-weight: 900; color: #581c87; margin-top: 4px; }
    h2 { font-size: 16px; margin: 24px 0 10px 0; color: #0f172a; border-left: 4px solid #7c3aed; padding-left: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th { background: #ede9fe; color: #4c1d95; padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold; }
    .footer { margin-top: 45px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>BestContent Social 2 — Relatório Consolidado de Performance</h1>
      <p class="meta">Gerado em ${nowFormatted} · Gestor: ${userName}</p>
    </div>
    <div style="text-align: right; font-size: 12px; font-weight: bold; color: #7c3aed;">
      PLATAFORMA SOCIAL 2 MAX
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Total de Conteúdos</div>
      <div class="kpi-val">${statusStats.total}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Publicados</div>
      <div class="kpi-val">${statusStats.published}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Agendados</div>
      <div class="kpi-val">${statusStats.scheduled}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Taxa de Aprovação</div>
      <div class="kpi-val">${statusStats.approvalRate}%</div>
    </div>
  </div>

  <h2>1. Desempenho por Marca & Fluxo de Aprovação</h2>
  <table>
    <thead>
      <tr>
        <th>Marca</th>
        <th style="text-align: center;">Total</th>
        <th style="text-align: center;">Publicados</th>
        <th style="text-align: center;">Agendados</th>
        <th style="text-align: center;">Rascunhos</th>
        <th style="text-align: center;">Aprovados</th>
        <th style="text-align: center;">Taxa Aprovação</th>
      </tr>
    </thead>
    <tbody>${brandRowsHtml}</tbody>
  </table>

  <h2>2. Desempenho por Rede Social</h2>
  <table>
    <thead>
      <tr>
        <th>Rede Social</th>
        <th style="text-align: center;">Total Posts</th>
        <th style="text-align: center;">Publicados</th>
        <th style="text-align: center;">Agendados</th>
        <th style="text-align: center;">Aprovados</th>
      </tr>
    </thead>
    <tbody>${networkRowsHtml}</tbody>
  </table>

  <h2>3. Resultados dos Testes A/B</h2>
  <table>
    <thead>
      <tr>
        <th>Experimento</th>
        <th>Status</th>
        <th>Objetivo</th>
        <th>Resultado</th>
      </tr>
    </thead>
    <tbody>${abRowsHtml}</tbody>
  </table>

  <div class="footer">
    BestContent Social 2 · Documento de Prestação de Contas & Performance Estratégica
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    }
  </script>
</body>
</html>`

    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
    } else {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    }

    toast({
      title: 'Relatório Executivo PDF aberto!',
      description: 'Use a caixa de diálogo de impressão do navegador para salvar como PDF.',
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Bar de Filtro & Exportação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold text-foreground">Marca:</span>
            <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
              <SelectTrigger className="h-8 text-xs rounded-xl w-44">
                <SelectValue placeholder="Todas as Marcas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Todas as Marcas ({brands.length})
                </SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="h-8 text-xs rounded-xl w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d" className="text-xs">
                  Últimos 7 dias
                </SelectItem>
                <SelectItem value="30d" className="text-xs">
                  Últimos 30 dias
                </SelectItem>
                <SelectItem value="90d" className="text-xs">
                  Últimos 90 dias
                </SelectItem>
                <SelectItem value="all" className="text-xs">
                  Todo o Período Histórico
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs h-8 px-3 gap-1.5 border-border hover:border-purple-500/50"
          >
            <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Exportar CSV (UTF-8)</span>
          </Button>
          <Button
            size="sm"
            onClick={handleExportPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs h-8 px-3 gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </Button>
        </div>
      </div>

      {/* Resumo Executivo / KPIs Consolidados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 bg-gradient-to-br from-purple-500/10 via-card to-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total de Criações</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{statusStats.total}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Posts e mídias no escopo</p>
        </Card>

        <Card className="rounded-2xl border-border/80 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Publicados & Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{statusStats.published}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
            Entregues na ponta final
          </p>
        </Card>

        <Card className="rounded-2xl border-border/80 bg-gradient-to-br from-blue-500/10 via-card to-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Agendados no Calendário
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{statusStats.scheduled}</p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
            Prontos para publicação
          </p>
        </Card>

        <Card className="rounded-2xl border-border/80 bg-gradient-to-br from-amber-500/10 via-card to-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Taxa de Aprovação Média
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{statusStats.approvalRate}%</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {approvalTiming.avgHours !== null
              ? `Tempo médio: ~${approvalTiming.avgHours < 1 ? '< 1h' : `${Math.round(approvalTiming.avgHours)}h`}`
              : 'Fluxo em revisão'}
          </p>
        </Card>
      </div>

      {/* Top Tags & Formatos mais usados na biblioteca */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Top Tags Mais Usadas ({selectedPeriod})
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono">Frequência</span>
          </div>
          {topTagsAndFormats.topTags.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              Nenhuma tag cadastrada nos posts do período.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topTagsAndFormats.topTags.map((item) => (
                <Badge
                  key={item.tag}
                  variant="secondary"
                  className="bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-purple-500/20"
                >
                  #{item.tag}
                  <span className="ml-1.5 bg-purple-600/20 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    {item.count}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Top Formatos na Biblioteca
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono">Criações</span>
          </div>
          {topTagsAndFormats.topFormats.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nenhum formato encontrado.</p>
          ) : (
            <div className="space-y-1.5">
              {topTagsAndFormats.topFormats.map((f) => (
                <div
                  key={f.format}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-muted/40"
                >
                  <span className="font-semibold text-foreground">{f.format}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {f.count} {f.count === 1 ? 'post' : 'posts'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Grid de 2 Colunas: Desempenho por Marca & Evolução Temporal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desempenho por Marca */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-foreground">Desempenho por Marca</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {brandMetrics.length} marcas
            </Badge>
          </div>

          <div className="space-y-3.5">
            {brandMetrics.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl bg-muted/30 border border-border/60 hover:border-purple-500/30 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="text-xs font-bold text-foreground">{b.name}</span>
                  </div>
                  <Badge className="bg-purple-600/15 text-purple-700 dark:text-purple-300 border-0 text-[10px] font-bold">
                    {b.approvalRate}% aprovado
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-1 text-[11px]">
                  <div className="bg-card p-1.5 rounded-lg border border-border/40">
                    <p className="text-muted-foreground text-[10px]">Total</p>
                    <p className="font-bold text-foreground">{b.total}</p>
                  </div>
                  <div className="bg-card p-1.5 rounded-lg border border-border/40">
                    <p className="text-emerald-600 dark:text-emerald-400 text-[10px]">Publicados</p>
                    <p className="font-bold text-foreground">{b.published}</p>
                  </div>
                  <div className="bg-card p-1.5 rounded-lg border border-border/40">
                    <p className="text-blue-600 dark:text-blue-400 text-[10px]">Agendados</p>
                    <p className="font-bold text-foreground">{b.scheduled}</p>
                  </div>
                  <div className="bg-card p-1.5 rounded-lg border border-border/40">
                    <p className="text-amber-600 dark:text-amber-400 text-[10px]">Rascunhos</p>
                    <p className="font-bold text-foreground">{b.draft}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Evolução no Tempo (Últimos 30 dias) */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-foreground">
                  Evolução no Tempo (Últimos 30 dias)
                </h3>
              </div>
              <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-600">
                Semanal
              </Badge>
            </div>

            <div className="space-y-4 pt-1">
              {timelineData.map((bucket, idx) => {
                const maxCount = Math.max(...timelineData.map((d) => d.count), 1)
                const pct = Math.round((bucket.count / maxCount) * 100)
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{bucket.label}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {bucket.count} posts ({bucket.published} publicados, {bucket.scheduled}{' '}
                        agendados)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-muted-foreground mt-4">
            <p className="font-semibold text-foreground text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Ritmo de Publicação Saudável
            </p>
            <p className="text-[11px] mt-0.5">
              A média semanal de conteúdos criados e agendados garante consistência nos algoritmos e
              mantém o engajamento orgânico contínuo.
            </p>
          </div>
        </Card>
      </div>

      {/* Desempenho por Rede Social & Testes A/B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desempenho por Rede Social */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-foreground">Desempenho por Rede Social</h3>
            </div>
            <span className="text-xs text-muted-foreground">Distribuição</span>
          </div>

          <div className="space-y-2.5">
            {networkMetrics.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-foreground">{item.name}</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{item.count}</strong> total
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-emerald-600 dark:text-emerald-400"
                  >
                    {item.published} publicados
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400">
                    {item.scheduled} agendados
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resultados dos Testes A/B */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Resultados dos Testes A/B</h3>
              </div>
              <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600">
                {abTests.length} experimentos
              </Badge>
            </div>

            {abTests.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground space-y-2">
                <p>Nenhum teste A/B cadastrado no momento.</p>
                <p className="text-[11px]">
                  Crie um experimento no Dashboard para comparar variações.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {abTests.map((test, idx) => (
                  <div
                    key={test.id}
                    className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-foreground">Experimento #{idx + 1}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Meta: {test.goal === 'clicks' ? 'Cliques' : 'Conversões'} ·{' '}
                        {test.status === 'running'
                          ? 'Em andamento'
                          : test.status === 'completed'
                            ? 'Concluído'
                            : 'Rascunho'}
                      </p>
                    </div>

                    <div>
                      {test.winner ? (
                        <Badge className="bg-amber-500 text-white text-[10px] gap-1 border-0">
                          <Trophy className="w-3 h-3" /> Vencedor Definido
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Em avaliação
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/80 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Metodologia: Comparação pareada com controle de métricas</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">IA Otimizada</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
