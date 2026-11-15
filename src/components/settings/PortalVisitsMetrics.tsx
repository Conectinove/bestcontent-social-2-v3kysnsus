import { useState } from 'react'
import { Eye, MousePointerClick, CalendarDays, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PortalMetrics } from '@/services/portal-visits'

interface PortalVisitsMetricsProps {
  metrics: PortalMetrics | null
  loading: boolean
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR').format(n)
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
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

/** Analytics de visitas do portal (pedido 2): totais + visitas recentes. */
export function PortalVisitsMetrics({ metrics, loading }: PortalVisitsMetricsProps) {
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

  return (
    <div className="space-y-3">
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
      </div>

      {series.length > 0 && (
        <div className="rounded-lg border border-border/70 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Visitas por dia (últimos 30 dias)
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

      <div className="rounded-lg border border-border/70 divide-y divide-border/60">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Visitas recentes
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
