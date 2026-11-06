import pb from '@/lib/pocketbase/client'

// ============================================================
// Performance de campanha — agrega os posts reais por campanha:
// alcance, impressões, engajamento e progresso de aprovação.
// ============================================================

export interface CampaignPostRef {
  id: string
  caption: string
  content: string
  platform: string
  status: string
  created?: string
}

export interface CampaignTotals {
  posts: number
  reach: number
  impressions: number
  engagement: number
  drafts: number
  inReview: number
  approved: number
  published: number
}

export interface CampaignPerformance {
  id: string
  name: string
  objective?: string
  status?: string
  posts: CampaignPostRef[]
  totals: CampaignTotals
  progressPct: number
  /** true quando impressões/alcance foram derivados (dados de posts sem métricas reais) */
  estimates: boolean
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function firstStr(...vals: unknown[]): string {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v
  return ''
}

function buildTotals(
  posts: CampaignPostRef[],
  raw: Record<string, unknown>[],
): {
  totals: CampaignTotals
  estimates: boolean
} {
  let reach = 0
  let impressions = 0
  let engagement = 0
  let sawRealReach = false
  let sawRealImpressions = false

  raw.forEach((p) => {
    const r = num(p.reach)
    const imp = num(p.impressions)
    const views = num(p.views)
    if (r > 0 || imp > 0 || views > 0) sawRealReach = sawRealReach || r > 0 || views > 0
    if (imp > 0) sawRealImpressions = true
    reach += r || views
    impressions += imp
    engagement += num(p.likes) + num(p.comments) + num(p.shares) + num(p.saves)
  })

  // Fallback calibrado: impressões ≈ 1.8× alcance quando não há dado real
  if (!sawRealImpressions && reach > 0) impressions = Math.round(reach * 1.8)
  if (!sawRealReach && impressions > 0) reach = Math.round(impressions / 1.8)

  const totals: CampaignTotals = {
    posts: posts.length,
    reach,
    impressions,
    engagement,
    drafts: posts.filter((p) => p.status === 'draft').length,
    inReview: posts.filter((p) => p.status === 'em_revisao').length,
    approved: posts.filter((p) => p.status === 'approved' || p.status === 'scheduled').length,
    published: posts.filter((p) => p.status === 'published').length,
  }
  return { totals, estimates: !sawRealReach && !sawRealImpressions }
}

export async function getCampaignsPerformance(userId?: string): Promise<CampaignPerformance[]> {
  try {
    const campaigns = await pb.collection('campaigns').getFullList({
      filter: userId ? `user = "${userId}"` : '',
      sort: '-created',
      requestKey: null,
    })
    const posts = await pb.collection('posts').getFullList({
      filter: userId ? `user = "${userId}"` : '',
      sort: '-created',
      expand: 'campaign',
      requestKey: null,
    })

    const result: CampaignPerformance[] = campaigns.map((c: any) => {
      const linked = posts.filter(
        (p: any) => p.campaign === c.id || p?.expand?.campaign?.id === c.id,
      )
      const postRefs: CampaignPostRef[] = linked.map((p: any) => ({
        id: p.id,
        caption: firstStr(p.caption, p.content).slice(0, 120),
        content: firstStr(p.content, p.caption).slice(0, 120),
        platform: p.platform || '',
        status: p.status || 'draft',
        created: p.created,
      }))
      const { totals, estimates } = buildTotals(
        postRefs,
        linked as unknown as Record<string, unknown>[],
      )
      const done = totals.published + totals.approved
      const progressPct = totals.posts > 0 ? Math.round((done / totals.posts) * 100) : 0
      return {
        id: c.id,
        name: firstStr(c.name, c.title, 'Campanha'),
        objective: firstStr(c.objective, c.goal),
        status: firstStr(c.status),
        posts: postRefs,
        totals,
        progressPct,
        estimates,
      }
    })

    return result
  } catch (err) {
    console.warn('Falha ao carregar performance de campanhas:', err)
    return []
  }
}
