import pb, { pb as pbNamed } from '@/lib/pocketbase/client'

const client = pbNamed || pb

export interface PortalVisitItem {
  at: string
  page_slug: string
  referrer: string
}

export interface PortalDailyPoint {
  date: string
  count: number
}

export interface PortalMetrics {
  success: boolean
  total: number
  last_24h: number
  last_7d: number
  last_30d: number
  daily_series?: PortalDailyPoint[]
  recent: PortalVisitItem[]
}

/**
 * Analytics de visitas do portal — lê do hook GET /backend/v1/portals/metrics/{portalId}
 * (exige auth de dono).
 */
export async function getPortalMetrics(portalId: string): Promise<PortalMetrics> {
  const res = await client.send(`/backend/v1/portals/metrics/${portalId}`, {
    method: 'GET',
  })
  return res as PortalMetrics
}

/* ------------------------------------------------------------------ */
/* Exportação do relatório de visitas (pedido "exportar relatorio")    */
/* ------------------------------------------------------------------ */

const csvEscape = (v: unknown): string => {
  const s = String(v ?? '')
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Exporta todas as visitas do portal (rota autenticada do hook, até 10 mil
 * registros) e devolve as linhas prontas do CSV — cabeçalho de resumo + série
 * diária do gráfico + um registro por linha.
 */
export async function fetchVisitsExport(portalId: string): Promise<{
  count: number
  visits: PortalVisitItem[]
}> {
  const res = await client.send<{ count: number; visits: PortalVisitItem[] }>(
    `/backend/v1/portals/visits-export/${encodeURIComponent(portalId)}`,
    { method: 'GET' },
  )
  return { count: res?.count || 0, visits: res?.visits || [] }
}

/** Monta o CSV completo do relatório: resumo + série diária + visitas linha a linha. */
export function buildVisitsCsv(
  metrics: PortalMetrics | null,
  exportData: { count: number; visits: PortalVisitItem[] },
  brandName: string,
): string {
  const lines: string[] = []
  const total = metrics?.total ?? exportData.count
  lines.push(`Relatorio de visitas do portal;${brandName}`)
  lines.push(`Gerado em;${new Date().toLocaleString('pt-BR')}`)
  lines.push('')
  lines.push('Resumo;Valor')
  lines.push(`Total de visitas;${total}`)
  lines.push(`Ultimas 24 horas;${metrics?.last_24h ?? 0}`)
  lines.push(`Ultimos 7 dias;${metrics?.last_7d ?? 0}`)
  lines.push(`Ultimos 30 dias;${metrics?.last_30d ?? 0}`)
  lines.push('')
  lines.push('Data;Visitas')
  for (const pt of metrics?.daily_series ?? []) {
    lines.push(`${pt.date};${pt.count}`)
  }
  lines.push('')
  lines.push('Data e hora;Pagina;Origem (referrer)')
  for (const v of exportData.visits) {
    lines.push(
      [csvEscape(v.at), csvEscape(v.page_slug || 'principal'), csvEscape(v.referrer)].join(';'),
    )
  }
  return lines.join('\n')
}

/** Baixa o CSV como arquivo (uso no botão "Exportar" do painel de analytics). */
export function downloadVisitsCsv(csv: string, brandName: string) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safe = (brandName || 'portal')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  a.href = url
  a.download = `relatorio-visitas-${safe || 'portal'}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Registra uma visita (público, sem dados pessoais).
 * Chamado pela BrandPortalPage a cada carregamento de página.
 */
export async function recordPortalVisit(token: string, pageSlug = ''): Promise<void> {
  try {
    await client.send(`/backend/v1/portals/visits/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        pageSlug,
        referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
      },
    })
  } catch (err) {
    // Visita é best-effort: nunca deve quebrar a renderização do portal.
    console.warn('Falha ao registrar visita do portal:', err)
  }
}
