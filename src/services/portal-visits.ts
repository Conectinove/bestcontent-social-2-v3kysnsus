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
