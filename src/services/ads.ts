import pb from '@/lib/pocketbase/client'

export type AdNetwork = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin'
export type AdObjective = 'trafego' | 'vendas' | 'reconhecimento' | 'leads' | 'engajamento'
export type AdStatus = 'rascunho' | 'ativa' | 'pausada' | 'concluida'

export interface TargetAudience {
  ageMin: number
  ageMax: number
  genders: 'todos' | 'homens' | 'mulheres'
  regions: string[]
  interests: string[]
}

export interface AdCopy {
  headline: string
  primaryText: string
  description: string
  cta: string
  tone?: string
}

export interface AdProjections {
  reach: number
  impressions: number
  clicks: number
  cpc: number // em R$
  cpm: number // em R$
  ctr: number // em %
}

export interface AdDailyMetric {
  id: string
  campaign: string
  user: string
  date: string
  impressions: number
  reach: number
  clicks: number
  ctr: number
  cpc: number
  spent: number
  conversions?: number
  is_simulated?: boolean
  created?: string
}

export interface AdCampaignRecord {
  id: string
  user: string
  brand?: string
  name: string
  network: AdNetwork
  objective: AdObjective
  status: AdStatus
  daily_budget: number
  total_budget?: number
  start_date?: string
  end_date?: string
  target_audience?: TargetAudience
  ad_copy?: AdCopy
  projections?: AdProjections
  destination_url?: string
  created: string
  updated: string
  metrics?: AdDailyMetric[]
  expand?: {
    brand?: {
      id: string
      name: string
      logo?: string
      color?: string
    }
  }
}

export function calculateAdProjections(
  dailyBudget: number,
  days = 7,
  objective: AdObjective = 'trafego',
): AdProjections {
  const total = dailyBudget * days
  // Benchmarks médios do mercado brasileiro
  let baseCpm = 14.5
  let baseCtr = 1.45

  if (objective === 'vendas' || objective === 'leads') {
    baseCpm = 22.0
    baseCtr = 1.1
  } else if (objective === 'reconhecimento') {
    baseCpm = 8.8
    baseCtr = 0.85
  }

  const impressions = Math.round((total / baseCpm) * 1000)
  const reach = Math.round(impressions * 0.78)
  const clicks = Math.round(impressions * (baseCtr / 100))
  const cpc = clicks > 0 ? Number((total / clicks).toFixed(2)) : 1.2

  return {
    reach,
    impressions,
    clicks,
    cpc,
    cpm: baseCpm,
    ctr: baseCtr,
  }
}

export function generateSmartAdCopy(
  brandName: string,
  objective: AdObjective,
  network: AdNetwork,
  segment?: string,
  tone?: string,
): AdCopy {
  const brand = brandName || 'Sua Marca'
  const seg = segment || 'produtos e serviços de alta qualidade'
  const toneLabel = tone || 'Profissional'

  if (objective === 'vendas') {
    return {
      headline: `${brand} com Condições Exclusivas por Tempo Limitado`,
      primaryText: `Descubra a linha completa de ${seg} que está conquistando clientes em todo o Brasil. Clique e aproveite entrega rápida e garantia total.`,
      description: 'Garanta sua compra em até 12x sem juros.',
      cta: 'Comprar Agora',
      tone: toneLabel,
    }
  }

  if (objective === 'leads') {
    return {
      headline: `Receba um Diagnóstico Gratuito com a Equipe de ${brand}`,
      primaryText: `Quer acelerar seus resultados em ${seg}? Preencha o formulário em menos de 1 minuto e converse com um especialista dedicado.`,
      description: 'Vagas limitadas para este ciclo.',
      cta: 'Cadastre-se Já',
      tone: toneLabel,
    }
  }

  if (objective === 'reconhecimento') {
    return {
      headline: `Conheça a Experiência Inovadora de ${brand}`,
      primaryText: `Feito para quem não abre mão de excelência em ${seg}. Acompanhe nossas novidades e inspire-se diariamente.`,
      description: 'Mais de 10.000 clientes satisfeitos.',
      cta: 'Saiba Mais',
      tone: toneLabel,
    }
  }

  // Padrão: Tráfego
  return {
    headline: `Descubra as Soluções de ${brand} para o seu Dia a Dia`,
    primaryText: `Conecte-se com o melhor em ${seg}. Acesse nosso site oficial e explore conteúdos e ofertas pensadas para você.`,
    description: 'Acesse o link direto e confira.',
    cta: network === 'instagram' ? 'Acessar Link' : 'Visitar Site',
    tone: toneLabel,
  }
}

export async function getAdCampaigns(): Promise<AdCampaignRecord[]> {
  try {
    return await pb.collection('ad_campaigns').getFullList({
      sort: '-created',
      expand: 'brand',
    })
  } catch {
    return []
  }
}

export async function createAdCampaign(data: Partial<AdCampaignRecord>): Promise<AdCampaignRecord> {
  const authRecord = pb.authStore.record
  return await pb.collection('ad_campaigns').create({
    user: authRecord?.id,
    ...data,
  })
}

export async function updateAdCampaign(
  id: string,
  data: Partial<AdCampaignRecord>,
): Promise<AdCampaignRecord> {
  return await pb.collection('ad_campaigns').update(id, data)
}

export async function deleteAdCampaign(id: string): Promise<boolean> {
  return await pb.collection('ad_campaigns').delete(id)
}

export async function getCampaignMetrics(campaignId: string): Promise<AdDailyMetric[]> {
  try {
    return await pb.collection('ads_metrics').getFullList<AdDailyMetric>({
      filter: `campaign = "${campaignId}"`,
      sort: 'date',
    })
  } catch {
    return []
  }
}

export async function getAllAdsMetrics(): Promise<AdDailyMetric[]> {
  try {
    return await pb.collection('ads_metrics').getFullList<AdDailyMetric>({
      sort: 'date',
    })
  } catch {
    return []
  }
}

export function generateDailyMetricsForCampaign(
  campaign: AdCampaignRecord,
  days = 7,
): AdDailyMetric[] {
  const dailyBudget = campaign.daily_budget || 30
  const isPaused = campaign.status === 'pausada'
  const isDraft = campaign.status === 'rascunho'
  const multiplier = isPaused ? 0.3 : isDraft ? 0.1 : 1.0

  const results: AdDailyMetric[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const factor = (0.85 + (7 - i) * 0.05 + Math.sin(i) * 0.08) * multiplier
    const spent = Number(Math.max(0, dailyBudget * factor).toFixed(2))
    const baseCpm =
      campaign.objective === 'vendas' ? 22 : campaign.objective === 'leads' ? 20 : 14.5
    const impressions = Math.round((spent / baseCpm) * 1000)
    const reach = Math.round(impressions * 0.78)
    const baseCtr = campaign.objective === 'vendas' ? 1.2 : 1.5
    const clicks = Math.round(impressions * (baseCtr / 100))
    const cpc = clicks > 0 ? Number((spent / clicks).toFixed(2)) : 1.1
    const conversions =
      campaign.objective === 'vendas' || campaign.objective === 'leads'
        ? Math.max(0, Math.round(clicks * 0.08))
        : Math.max(0, Math.round(clicks * 0.03))

    results.push({
      id: `sim-${campaign.id}-${i}`,
      campaign: campaign.id,
      user: campaign.user,
      date: d.toISOString().split('T')[0],
      impressions,
      reach,
      clicks,
      ctr: Number(baseCtr.toFixed(2)),
      cpc,
      spent,
      conversions,
      is_simulated: true,
    })
  }

  return results
}

export interface PlatformConnectionStatus {
  platform: 'meta' | 'google' | 'tiktok' | 'youtube' | 'linkedin'
  name: string
  configured: boolean
  status: 'connected' | 'not_configured' | 'error_calling_api' | 'exception'
  accountIdPrefix?: string | null
  customerIdPrefix?: string | null
  advertiserIdPrefix?: string | null
  channelIdPrefix?: string | null
  requiredSecrets: string[]
}

export interface PlatformsStatusResponse {
  platforms: {
    meta: PlatformConnectionStatus
    google: PlatformConnectionStatus
    tiktok: PlatformConnectionStatus
    youtube?: PlatformConnectionStatus
    linkedin?: PlatformConnectionStatus
  }
  message: string
}

export interface PlatformOfficialMetricsResult {
  platform: 'meta' | 'google' | 'tiktok' | 'youtube' | 'linkedin'
  source: 'official_api' | 'simulated_fallback'
  is_official: boolean
  status: string
  metrics?: {
    impressions: number
    reach: number
    clicks: number
    spent: number
    cpc: number
    ctr: number
    conversions: number
    views?: number
    watchMinutes?: number
    totalSubscribers?: number
    totalVideos?: number
  }
  message?: string
  period?: string
}

export interface MetaAdsStatusResponse {
  platform: 'meta'
  name: string
  configured: boolean
  status: 'connected' | 'not_configured' | 'error_calling_api' | 'exception'
  accountIdPrefix?: string | null
  requiredSecrets: string[]
  message?: string
}

export interface YouTubeAdsStatusResponse {
  platform: 'youtube'
  name: string
  configured: boolean
  status: 'connected' | 'not_configured' | 'error_calling_api' | 'exception'
  customerIdPrefix?: string | null
  requiredSecrets: string[]
  message?: string
}

export interface TikTokAdsStatusResponse {
  platform: 'tiktok'
  name: string
  configured: boolean
  status: 'connected' | 'not_configured' | 'error_calling_api' | 'exception'
  advertiserIdPrefix?: string | null
  requiredSecrets: string[]
  message?: string
}

export interface LinkedInAdsStatusResponse {
  platform: 'linkedin'
  name: string
  configured: boolean
  status: 'connected' | 'not_configured' | 'error_calling_api' | 'exception'
  accountIdPrefix?: string | null
  requiredSecrets: string[]
  message?: string
}

export async function getLinkedInAdsStatus(): Promise<LinkedInAdsStatusResponse> {
  try {
    const res = await pb.send('/backend/v1/linkedin/ads/status', { method: 'GET' })
    return res as LinkedInAdsStatusResponse
  } catch {
    return {
      platform: 'linkedin',
      name: 'LinkedIn Campaign Manager',
      configured: false,
      status: 'not_configured',
      requiredSecrets: ['LINKEDIN_ADS_ACCESS_TOKEN', 'LINKEDIN_ADS_AD_ACCOUNT_ID'],
      message: 'Estimativa calibrada ativa.',
    }
  }
}

export async function getTikTokAdsStatus(): Promise<TikTokAdsStatusResponse> {
  try {
    const res = await pb.send('/backend/v1/tiktok/ads/status', { method: 'GET' })
    return res as TikTokAdsStatusResponse
  } catch {
    return {
      platform: 'tiktok',
      name: 'TikTok Ads Manager',
      configured: false,
      status: 'not_configured',
      requiredSecrets: ['TIKTOK_ADS_ACCESS_TOKEN', 'TIKTOK_ADS_ADVERTISER_ID'],
      message: 'Estimativa calibrada ativa.',
    }
  }
}

export async function getYouTubeAdsStatus(): Promise<YouTubeAdsStatusResponse> {
  try {
    const res = await pb.send('/backend/v1/youtube/ads/status', { method: 'GET' })
    return res as YouTubeAdsStatusResponse
  } catch {
    return {
      platform: 'youtube',
      name: 'YouTube Ads & Video Campaigns',
      configured: false,
      status: 'not_configured',
      requiredSecrets: [
        'YOUTUBE_ADS_ACCESS_TOKEN',
        'YOUTUBE_ADS_CUSTOMER_ID',
        'GOOGLE_ADS_CUSTOMER_ID',
      ],
      message: 'Estimativa calibrada ativa.',
    }
  }
}

export async function getMetaAdsStatus(): Promise<MetaAdsStatusResponse> {
  try {
    const res = await pb.send('/backend/v1/meta/ads/status', { method: 'GET' })
    return res as MetaAdsStatusResponse
  } catch {
    return {
      platform: 'meta',
      name: 'Meta Ads (Facebook & Instagram)',
      configured: false,
      status: 'not_configured',
      requiredSecrets: ['META_ADS_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'],
      message: 'Estimativa calibrada ativa.',
    }
  }
}

export async function getAdsPlatformsStatus(): Promise<PlatformsStatusResponse> {
  try {
    const res = await pb.send('/backend/v1/ads/status', { method: 'GET' })
    return res as PlatformsStatusResponse
  } catch {
    return {
      platforms: {
        meta: {
          platform: 'meta',
          name: 'Meta Ads (Facebook & Instagram)',
          configured: false,
          status: 'not_configured',
          requiredSecrets: ['META_ADS_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'],
        },
        google: {
          platform: 'google',
          name: 'Google Ads Search & Display',
          configured: false,
          status: 'not_configured',
          requiredSecrets: [
            'GOOGLE_ADS_DEVELOPER_TOKEN',
            'GOOGLE_ADS_CUSTOMER_ID',
            'GOOGLE_ADS_REFRESH_TOKEN',
          ],
        },
        tiktok: {
          platform: 'tiktok',
          name: 'TikTok Ads Manager',
          configured: false,
          status: 'not_configured',
          requiredSecrets: ['TIKTOK_ADS_ACCESS_TOKEN', 'TIKTOK_ADS_ADVERTISER_ID'],
        },
        youtube: {
          platform: 'youtube',
          name: 'YouTube Analytics & Video Ads',
          configured: false,
          status: 'not_configured',
          requiredSecrets: ['YOUTUBE_ACCESS_TOKEN', 'YOUTUBE_API_KEY', 'YOUTUBE_CHANNEL_ID'],
        },
        linkedin: {
          platform: 'linkedin',
          name: 'LinkedIn Ads (Campaign Manager)',
          configured: false,
          status: 'not_configured',
          requiredSecrets: ['LINKEDIN_ADS_ACCESS_TOKEN', 'LINKEDIN_ADS_AD_ACCOUNT_ID'],
        },
        pinterest: {
          platform: 'pinterest',
          name: 'Pinterest Ads (Business Manager)',
          configured: false,
          status: 'not_configured',
          requiredSecrets: ['PINTEREST_ADS_ACCESS_TOKEN', 'PINTEREST_AD_ACCOUNT_ID'],
        },
        x: {
          platform: 'x',
          name: 'X (Twitter) Ads',
          configured: false,
          status: 'not_configured',
          requiredSecrets: ['X_ADS_ACCESS_TOKEN', 'X_ADS_ACCOUNT_ID'],
        },
      },
      message: 'Status obtido em fallback local.',
    }
  }
}

export async function getPinterestAdsStatus() {
  try {
    const res = await pb.send('/backend/v1/ads/pinterest/status', { method: 'GET' })
    return res
  } catch {
    return {
      platform: 'pinterest',
      name: 'Pinterest Ads (Business Manager)',
      configured: false,
      status: 'not_configured',
      requiredSecrets: ['PINTEREST_ADS_ACCESS_TOKEN', 'PINTEREST_AD_ACCOUNT_ID'],
      message: 'Estimativa calibrada ativa.',
    }
  }
}

export async function getXAdsStatus() {
  try {
    const res = await pb.send('/backend/v1/ads/x/status', { method: 'GET' })
    return res
  } catch {
    return {
      platform: 'x',
      name: 'X (Twitter) Ads',
      configured: false,
      status: 'not_configured',
      requiredSecrets: ['X_ADS_ACCESS_TOKEN', 'X_ADS_ACCOUNT_ID'],
      message: 'Estimativa calibrada ativa.',
    }
  }
}

export async function getPlatformOfficialMetrics(
  platform: 'meta' | 'google' | 'tiktok' | 'youtube' | 'linkedin' | 'pinterest' | 'x',
): Promise<PlatformOfficialMetricsResult> {
  try {
    const res = await pb.send(`/backend/v1/ads/${platform}/metrics`, { method: 'GET' })
    return res as PlatformOfficialMetricsResult
  } catch (err: any) {
    return {
      platform,
      source: 'simulated_fallback',
      is_official: false,
      status: 'error',
      message: err?.message || 'Falha ao consultar API da plataforma.',
    }
  }
}

export async function seedMetricsIfMissing(campaign: AdCampaignRecord): Promise<AdDailyMetric[]> {
  try {
    const existing = await getCampaignMetrics(campaign.id)
    if (existing.length > 0) return existing

    const generated = generateDailyMetricsForCampaign(campaign, 7)
    const authId = pb.authStore.record?.id || campaign.user
    for (const m of generated) {
      await pb.collection('ads_metrics').create({
        user: authId,
        campaign: campaign.id,
        date: `${m.date} 12:00:00.000Z`,
        impressions: m.impressions,
        reach: m.reach,
        clicks: m.clicks,
        ctr: m.ctr,
        cpc: m.cpc,
        spent: m.spent,
        conversions: m.conversions || 0,
        is_simulated: true,
      })
    }
    return await getCampaignMetrics(campaign.id)
  } catch (err) {
    console.warn('Fallback para métricas em memória da campanha:', err)
    return generateDailyMetricsForCampaign(campaign, 7)
  }
}
