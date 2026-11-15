/**
 * Serviço de analytics do portal — visitas, export (CSV/PDF) e plays de vídeo.
 * Backend: hooks em pocketbase/hooks/portal_visits_pages.js.
 *  - GET  /backend/v1/portals/metrics/{portalId}?pageId=   (dono)
 *  - GET  /backend/v1/portals/visits-export/{portalId}?pageId= (dono)
 *  - POST /backend/v1/portals/video-plays/{token}          (público)
 */
import { pb } from '@/lib/pocketbase/client'

const BASE = import.meta.env.VITE_POCKETBASE_URL || ''

export interface PortalVisitItem {
  at: string
  page_slug: string
  page_id?: string
  referrer: string
}

export interface PortalVideoRankItem {
  media_id: string
  plays: number
  page_slug: string
  page_id: string
  last_play_at: string
  /** Engajamento (migration 0122): % médio concluído e tempo assistido. */
  avg_progress?: number
  watched_seconds?: number
}

/** Engajamento agregado de vídeo (migration 0122). */
export interface PortalVideoEngagement {
  avg_progress: number
  watched_seconds: number
  completed: number
}

export interface PortalMetrics {
  total: number
  last_24h: number
  last_7d: number
  last_30d: number
  daily_series: Array<{ date: string; count: number }>
  recent: PortalVisitItem[]
  /** Métricas de vídeo (pedido "adicionar metricas de video"). */
  video_total: number
  video_ranking: PortalVideoRankItem[]
  /** Engajamento de vídeo (migration 0122) — pode faltar em resposta antiga. */
  video_engagement?: PortalVideoEngagement
}

/** Página no filtro de analytics ('' = todas). */
export interface PortalMetricsFilter {
  pageId?: string
}

/**
 * Métricas do portal. `pageId` restringe tudo (totais, série, lista e plays)
 * àquela página interna; '' = todas.
 */
export async function getPortalMetrics(portalId: string, pageId = ''): Promise<PortalMetrics> {
  const query = pageId ? `?pageId=${encodeURIComponent(pageId)}` : ''
  return (await pb.send(`/backend/v1/portals/metrics/${portalId}${query}`, {
    method: 'GET',
  })) as PortalMetrics
}

/** Registro público de play de vídeo próprio na página do portal. */
export async function recordPortalVideoPlay(
  token: string,
  pageSlug: string,
  mediaId: string,
  pageId?: string,
): Promise<void> {
  if (!token || !mediaId) return
  await fetch(`${BASE}/backend/v1/portals/video-plays/${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageSlug, mediaId, pageId: pageId || '' }),
  }).catch(() => undefined)
}

/** Registra progresso de vídeo próprio (marco 25/50/75/100%) — POST público. */
export async function recordPortalVideoProgress(
  token: string,
  mediaId: string,
  progress: number,
  watchedSeconds: number,
  pageId?: string,
): Promise<void> {
  if (!token || !mediaId) return
  await fetch(`${BASE}/backend/v1/portals/video-progress/${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaId,
      progress: Math.min(100, Math.max(0, Math.round(progress))),
      watchedSeconds: Math.max(0, Math.round(watchedSeconds)),
      pageId: pageId || '',
    }),
  }).catch(() => undefined)
}

/** Export completo (até 10 mil visitas) já respeitando o filtro de página. */
export async function fetchVisitsExport(
  portalId: string,
  pageId = '',
): Promise<{
  count: number
  visits: PortalVisitItem[]
}> {
  const query = pageId ? `?pageId=${encodeURIComponent(pageId)}` : ''
  const res = (await pb.send(`/backend/v1/portals/visits-export/${portalId}${query}`, {
    method: 'GET',
  })) as { success: boolean; count: number; visits: PortalVisitItem[] }
  return { count: res.count || 0, visits: res.visits || [] }
}

/* ------------------------------------------------------------------ */
/* CSV (existente)                                                     */
/* ------------------------------------------------------------------ */

function csvEscape(value: string): string {
  const v = value ?? ''
  return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/** Monta o conteúdo do CSV do relatório (totais + série diária + visitas). */
export function buildVisitsCsv(
  metrics: PortalMetrics,
  visits: PortalVisitItem[],
  brandName: string,
): string {
  const lines: string[] = []
  lines.push(`Relatorio de analytics;${brandName || 'Portal'}`)
  lines.push(`Gerado em;${new Date().toISOString()}`)
  lines.push('')
  lines.push('Total de visitas;' + metrics.total)
  lines.push('Ultimas 24h;' + metrics.last_24h)
  lines.push('Ultimos 7 dias;' + metrics.last_7d)
  lines.push('Ultimos 30 dias;' + metrics.last_30d)
  lines.push('')
  lines.push('Data;Visitas')
  for (const d of metrics.daily_series || []) lines.push(`${d.date};${d.count}`)
  lines.push('')
  lines.push('Plays de video;' + (metrics.video_total || 0))
  const eng = metrics.video_engagement
  if (eng) {
    lines.push(
      'Conclusao media de video;' +
        (eng.avg_progress || 0).toFixed(1) +
        '%;Tempo assistido;' +
        Math.round(eng.watched_seconds || 0) +
        's;Finalizados;' +
        (eng.completed || 0),
    )
  }
  lines.push('Media ID;Plays;Pagina;Conclusao media (%);Assistido (s);Ultimo play')
  for (const v of metrics.video_ranking || []) {
    lines.push(
      [
        v.media_id,
        String(v.plays),
        v.page_slug,
        v.avg_progress != null ? v.avg_progress.toFixed(1) : '',
        v.watched_seconds != null ? String(Math.round(v.watched_seconds)) : '',
        v.last_play_at || '',
      ]
        .map(csvEscape)
        .join(';'),
    )
  }
  lines.push('')
  lines.push('Data;Pagina;Referrer')
  for (const v of visits) lines.push(`${v.at};${csvEscape(v.page_slug)};${csvEscape(v.referrer)}`)
  return lines.join('\n')
}

/** Baixa o CSV do relatório. */
export function downloadVisitsCsv(csv: string, brandName = 'portal'): void {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-portal-${brandName || 'portal'}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/* PDF (novo) — janela de impressão formatada (window.print)           */
/* ------------------------------------------------------------------ */

function escHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtDate(value: string): string {
  if (!value) return '—'
  const d = new Date(String(value).replace(' ', 'T').replace('Z', '') + 'Z')
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleString('pt-BR')
}

/**
 * Abre uma janela de impressão formatada com o relatório completo
 * (totais, série diária, plays de vídeo e lista de visitas) — o usuário
 * escolhe "Salvar como PDF" no diálogo de impressão do navegador.
 * Respeita o filtro de página ativo.
 */
export function printVisitsReport(
  metrics: PortalMetrics,
  visits: PortalVisitItem[],
  brandName: string,
  pageTitle: string,
): void {
  const series = metrics.daily_series || []
  const maxCount = Math.max(1, ...series.map((d) => d.count || 0))
  const bars = series
    .map((d) => {
      const h = Math.round(((d.count || 0) / maxCount) * 90)
      return `<div class="bar-col"><div class="bar" style="height:${Math.max(h, 2)}px"></div><span class="bar-lbl">${d.date.slice(8, 10)}/${d.date.slice(5, 7)}</span></div>`
    })
    .join('')

  const eng = metrics.video_engagement
  const engCard = eng
    ? `<div class="card"><div class="n">${(eng.avg_progress || 0).toFixed(0)}%</div><div class="l">Conclusão média</div></div>
       <div class="card"><div class="n">${Math.round(eng.watched_seconds || 0)}s</div><div class="l">Tempo assistido</div></div>
       <div class="card"><div class="n">${eng.completed || 0}</div><div class="l">Finalizados (100%)</div></div>`
    : ''
  const videoRows = (metrics.video_ranking || [])
    .map(
      (v, i) =>
        `<tr><td>${i + 1}</td><td>${escHtml(v.media_id)}</td><td>${escHtml(v.page_slug)}</td><td>${v.plays}</td><td>${
          v.avg_progress != null ? `${v.avg_progress.toFixed(0)}%` : '—'
        }</td><td>${v.watched_seconds != null ? `${Math.round(v.watched_seconds)}s` : '—'}</td><td>${fmtDate(v.last_play_at)}</td></tr>`,
    )
    .join('')

  const visitRows = visits
    .map(
      (v) =>
        `<tr><td>${fmtDate(v.at)}</td><td>${escHtml(v.page_slug)}</td><td>${escHtml(v.referrer || '—')}</td></tr>`,
    )
    .join('')

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<title>Relatório do portal — ${escHtml(brandName || 'Portal')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  h2 { font-size: 14px; margin: 22px 0 8px; }
  .sub { color: #555; font-size: 12px; margin-bottom: 16px; }
  .cards { display: flex; gap: 10px; flex-wrap: wrap; }
  .card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; min-width: 110px; }
  .card .n { font-size: 20px; font-weight: 700; }
  .card .l { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: .04em; }
  .chart { display: flex; align-items: flex-end; gap: 3px; height: 110px; padding: 6px 0 2px; }
  .bar-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; flex: 1; height: 100%; }
  .bar { width: 100%; max-width: 14px; background: #4f46e5; border-radius: 3px 3px 0 0; }
  .bar-lbl { font-size: 7px; color: #777; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #f3f4f6; padding: 5px 7px; border: 1px solid #e5e7eb; font-size: 10px; text-transform: uppercase; letter-spacing: .03em; }
  td { padding: 4px 7px; border: 1px solid #e5e7eb; }
  .muted { color: #666; font-size: 11px; }
  @media print { body { margin: 12mm; } .chart { page-break-inside: avoid; } }
</style></head><body>
  <h1>Relatório de analytics do portal</h1>
  <div class="sub">${escHtml(brandName || 'Portal')} · filtro: ${escHtml(pageTitle)} · gerado em ${new Date().toLocaleString('pt-BR')}</div>

  <div class="cards">
    <div class="card"><div class="n">${metrics.total}</div><div class="l">Total de visitas</div></div>
    <div class="card"><div class="n">${metrics.last_24h}</div><div class="l">Últimas 24h</div></div>
    <div class="card"><div class="n">${metrics.last_7d}</div><div class="l">Últimos 7 dias</div></div>
    <div class="card"><div class="n">${metrics.last_30d}</div><div class="l">Últimos 30 dias</div></div>
    <div class="card"><div class="n">${metrics.video_total || 0}</div><div class="l">Plays de vídeo</div></div>
    ${engCard}
  </div>

  <h2>Visitas por dia (30 dias)</h2>
  <div class="chart">${bars}</div>

  <h2>Vídeos mais reproduzidos</h2>
  ${
    videoRows
      ? `<table><thead><tr><th>#</th><th>Mídia</th><th>Página</th><th>Plays</th><th>Conclusão média</th><th>Assistido</th><th>Último play</th></tr></thead><tbody>${videoRows}</tbody></table>`
      : '<p class="muted">Nenhum play de vídeo registrado no período/filtro.</p>'
  }

  <h2>Visitas recentes (${visits.length})</h2>
  ${
    visitRows
      ? `<table><thead><tr><th>Data</th><th>Página</th><th>Origem</th></tr></thead><tbody>${visitRows}</tbody></table>`
      : '<p class="muted">Nenhuma visita registrada no período/filtro.</p>'
  }

  <script>window.onload = function () { setTimeout(function () { window.print() }, 250) }</script>
</body></html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) {
    // Bloqueio de pop-up: cai para o download do CSV para não perder o clique.
    downloadVisitsCsv(buildVisitsCsv(metrics, visits, brandName), brandName)
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}
