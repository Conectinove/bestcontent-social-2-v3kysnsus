import { useState } from 'react'
import {
  Eye,
  MousePointerClick,
  CalendarDays,
  Activity,
  Download,
  Loader2,
  FileText,
  Filter,
  Play,
  Video,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import {
  fetchVisitsExport,
  buildVisitsCsv,
  downloadVisitsCsv,
  printVisitsReport,
  type PortalMetrics,
} from '@/services/portal-visits'

export interface PortalPageOption {
  id: string
  title: string
}

interface PortalVisitsMetricsProps {
  metrics: PortalMetrics | null
  loading: boolean
  /** Id do portal — quando presente, mostra os botões "Exportar relatório". */
  portalId?: string
  brandName?: string
  /** Páginas do portal para o filtro de analytics (pedido "filtrar analytics por pagina"). */
  pageOptions?: PortalPageOption[]
  /** Página ativa no filtro ('' = todas). Controlado pelo painel pai. */
  pageFilter?: string
  onPageFilterChange?: (pageId: string) => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR').format(n)
}

function fmtDate(iso: string) {
  try {
    return new Date(String(iso).replace(' ', 'T')).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function MetricChip({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Eye
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex-1 min-w-[110px] p-3 rounded-lg border border-border/70 bg-muted/40 space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${accent}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-xl font-extrabold text-foreground">{value}</p>
    </div>
  )
}

/**
 * Analytics de visitas do portal: filtro por página, totais, gráfico de 30
 * dias, métricas de vídeo (plays) e exportação em CSV e PDF.
 */
export function PortalVisitsMetrics({
  metrics,
  loading,
  portalId,
  brandName,
  pageOptions = [],
  pageFilter = '',
  onPageFilterChange,
}: PortalVisitsMetricsProps) {
  const [exporting, setExporting] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const activePageTitle = pageOptions.find((p) => p.id === pageFilter)?.title || 'Todas as páginas'

  const loadExport = async () => {
    if (!portalId) throw new Error('Portal não carregado')
    const exportData = await fetchVisitsExport(portalId, pageFilter)
    if (!metrics) throw new Error('Métricas ainda não carregadas')
    return { exportData }
  }

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const { exportData } = await loadExport()
      const csv = buildVisitsCsv(metrics!, exportData.visits, brandName || 'Portal')
      downloadVisitsCsv(csv, brandName || 'portal')
      toast({
        title: 'Relatório exportado',
        description: `${exportData.count} visita${exportData.count === 1 ? '' : 's'} no arquivo CSV.`,
      })
    } catch (err) {
      toast({
        title: 'Erro ao exportar relatório',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  /** PDF via janela de impressão formatada ("Salvar como PDF" do navegador). */
  const handleExportPdf = async () => {
    setPdfBusy(true)
    try {
      const { exportData } = await loadExport()
      printVisitsReport(metrics!, exportData.visits, brandName || 'Portal', activePageTitle)
      toast({ title: 'Janela de impressão aberta', description: 'Escolha "Salvar como PDF".' })
    } catch (err) {
      toast({
        title: 'Erro ao gerar PDF',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setPdfBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex gap-3">
        <Skeleton className="h-20 flex-1 rounded-lg" />
        <Skeleton className="h-20 flex-1 rounded-lg" />
        <Skeleton className="h-20 flex-1 rounded-lg" />
        <Skeleton className="h-20 flex-1 rounded-lg" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Sem dados de visitas ainda. Compartilhe o link do portal para começar a coletar.
          </p>
        </CardContent>
      </Card>
    )
  }

  const series = metrics.daily_series || []
  const videoRanking = metrics.video_ranking || []

  return (
    <div className="space-y-3">
      {/* ===== Filtro por página + exportações ===== */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 min-w-[220px]">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select
            value={pageFilter || 'all'}
            onValueChange={(v) => onPageFilterChange?.(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 text-xs w-[210px]">
              <SelectValue placeholder="Todas as páginas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Todas as páginas
              </SelectItem>
              {pageOptions.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {portalId && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => void handleExportPdf()}
              disabled={pdfBusy || exporting}
            >
              {pdfBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              Exportar PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => void handleExportCsv()}
              disabled={exporting || pdfBusy}
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Exportar CSV
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <MetricChip
          icon={Eye}
          label="Total de visitas"
          value={fmt(metrics.total)}
          accent="text-violet-600 dark:text-violet-400"
        />
        <MetricChip
          icon={Activity}
          label="Últimas 24h"
          value={fmt(metrics.last_24h)}
          accent="text-blue-600 dark:text-blue-400"
        />
        <MetricChip
          icon={CalendarDays}
          label="Últimos 7 dias"
          value={fmt(metrics.last_7d)}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <MetricChip
          icon={MousePointerClick}
          label="Últimos 30 dias"
          value={fmt(metrics.last_30d)}
          accent="text-amber-600 dark:text-amber-400"
        />
        <MetricChip
          icon={Play}
          label="Plays de vídeo"
          value={fmt(metrics.video_total || 0)}
          accent="text-rose-600 dark:text-rose-400"
        />
      </div>

      {series.length > 0 && (
        <div className="rounded-lg border border-border/70 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Visitas por dia (últimos 30 dias){pageFilter ? ` — ${activePageTitle}` : ''}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {fmt(series.reduce((acc, p) => acc + (p.count || 0), 0))} no período
            </p>
          </div>
          <div className="flex items-end gap-[3px] h-24">
            {series.map((p) => {
              const max = Math.max(1, ...series.map((x) => x.count || 0))
              const h = Math.round(((p.count || 0) / max) * 100)
              const [y, m, d] = p.date.split('-')
              const dayLabel = d && m ? `${d}/${m}` : p.date
              return (
                <div
                  key={p.date}
                  className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1 group"
                  title={`${dayLabel}: ${fmt(p.count || 0)} visita${(p.count || 0) === 1 ? '' : 's'}`}
                >
                  <div
                    className="w-full rounded-t bg-violet-500/80 group-hover:bg-violet-500 transition-colors"
                    style={{ height: `${Math.max(h, p.count > 0 ? 6 : 2)}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex gap-[3px]">
            {series.map((p, i) => {
              const [y, m, d] = p.date.split('-')
              const dayLabel = d && m ? `${d}/${m}` : p.date
              return (
                <div
                  key={p.date}
                  className="flex-1 min-w-0 text-center text-[8px] text-muted-foreground leading-none"
                >
                  {i % 5 === 0 ? dayLabel : ''}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== Métricas de vídeo (pedido "adicionar metricas de video") ===== */}
      <div className="rounded-lg border border-border/70 divide-y divide-border/60">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Video className="w-3 h-3" />
          Vídeos mais reproduzidos
          {pageFilter ? ` — ${activePageTitle}` : ''}
        </p>
        {videoRanking.length === 0 ? (
          <p className="px-3 py-3 text-xs text-muted-foreground">
            Nenhum play de vídeo registrado ainda. Os plays aparecem quando visitantes dão play nos
            vídeos próprios do portal.
          </p>
        ) : (
          videoRanking.slice(0, 5).map((v, i) => (
            <div
              key={v.media_id + i}
              className="flex items-center justify-between px-3 py-2 text-xs gap-2"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <Play className="w-3 h-3 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="font-medium text-foreground truncate">
                  {v.page_slug === '' || v.page_slug === 'principal'
                    ? 'Página principal'
                    : v.page_slug}
                </span>
                <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                  · {v.media_id.slice(0, 8)}…
                </span>
              </span>
              <span className="text-xs font-bold shrink-0">
                {fmt(v.plays)} play{v.plays === 1 ? '' : 's'}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border border-border/70 divide-y divide-border/60">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Visitas recentes{pageFilter ? ` — ${activePageTitle}` : ''}
        </p>
        {metrics.recent.length === 0 ? (
          <p className="px-3 py-3 text-xs text-muted-foreground">
            Nenhuma visita registrada ainda.
          </p>
        ) : (
          metrics.recent.slice(0, 6).map((v, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="font-medium text-foreground">
                {v.page_slug === '' || v.page_slug === 'principal'
                  ? 'Página principal'
                  : v.page_slug}
              </span>
              <span className="text-muted-foreground">{fmtDate(v.at)}</span>
            </div>
          ))
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Visitas são anônimas — nenhum dado pessoal é coletado.
      </p>
    </div>
  )
}
