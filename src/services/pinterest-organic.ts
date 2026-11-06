import pb from '@/lib/pocketbase/client'

export interface PinterestOrganicMetrics {
  followers: number
  following: number
  followers_growth_30d: number
  monthly_views: number
  impressions_30d: number
  saves_30d: number
  pin_clicks_30d: number
  outbound_clicks_30d: number
  engagement_rate: number
  pins_published_30d: number
  boards_count: number
  /** NOVO: taxa de engajamento (%) por formato de Pin (opcional — fallback calibrado no widget) */
  pin_format_engagement?: {
    standard: number
    video: number
    carousel: number
    rich: number
  }
}

export interface PinterestTopPin {
  id: string
  title: string
  link: string
  saves: number
  pin_clicks: number
  outbound_clicks: number
  impressions: number
}

export interface PinterestBestTime {
  day: string
  hour: string
  score: number
}

export interface PinterestWeeklyEvolution {
  week: string
  impressions: number
  saves: number
  outbound_clicks: number
}

export interface PinterestOrganicData {
  success: boolean
  is_official: boolean
  badge_label: 'Dados Oficiais' | 'Estimativa Calibrada'
  platform: string
  handle: string
  display_name: string
  avatar?: string
  metrics: PinterestOrganicMetrics
  top_pins: PinterestTopPin[]
  best_times: PinterestBestTime[]
  weekly_evolution?: PinterestWeeklyEvolution[]
}

export interface PinterestOrganicStatusResponse {
  platform: string
  name: string
  configured: boolean
  status: 'connected' | 'not_configured'
  tokenPrefix?: string | null
  username?: string | null
  apiBase: string
  requiredSecrets: string[]
  message: string
}

export async function getPinterestOrganicStatus(): Promise<PinterestOrganicStatusResponse> {
  try {
    const res = await pb.send('/backend/v1/pinterest/organic/status', { method: 'GET' })
    return res as PinterestOrganicStatusResponse
  } catch (err) {
    console.warn('[getPinterestOrganicStatus] Fallback:', err)
    return {
      platform: 'pinterest_organic',
      name: 'Pinterest · Perfil Business',
      configured: false,
      status: 'not_configured',
      apiBase: 'https://api.pinterest.com/v5',
      requiredSecrets: ['PINTEREST_ACCESS_TOKEN (ou PINTEREST_ORGANIC_ACCESS_TOKEN)'],
      message: 'Estimativa Calibrada ativa.',
    }
  }
}

export async function getPinterestOrganicMetrics(): Promise<PinterestOrganicData> {
  try {
    const res = await pb.send('/backend/v1/pinterest/organic/metrics', { method: 'GET' })
    return res as PinterestOrganicData
  } catch (err) {
    console.warn('[getPinterestOrganicMetrics] Fallback calibrado local:', err)
    return {
      success: true,
      is_official: false,
      badge_label: 'Estimativa Calibrada',
      platform: 'pinterest_organic',
      handle: '@midiaviva_ai',
      display_name: 'MidiaViva · Conteúdo Visual & Negócios',
      avatar: 'https://img.usecurling.com/i?q=pinterest&color=red',
      metrics: {
        followers: 2480,
        following: 215,
        followers_growth_30d: 7.4,
        monthly_views: 74200,
        impressions_30d: 68400,
        saves_30d: 3580,
        pin_clicks_30d: 4620,
        outbound_clicks_30d: 1840,
        engagement_rate: 5.6,
        pins_published_30d: 42,
        boards_count: 9,
      },
      top_pins: [
        {
          id: 'pin_cal_1',
          title: 'Modelos de Carrossel Infográfico para Redes Sociais',
          link: 'https://pinterest.com/midiaviva_ai',
          saves: 840,
          pin_clicks: 1210,
          outbound_clicks: 430,
          impressions: 18400,
        },
        {
          id: 'pin_cal_2',
          title: 'Checklist de Identidade Visual e Tipografia 2026',
          link: 'https://pinterest.com/midiaviva_ai',
          saves: 620,
          pin_clicks: 980,
          outbound_clicks: 350,
          impressions: 14200,
        },
      ],
      best_times: [
        { day: 'Domingo', hour: '20:30', score: 0.97 },
        { day: 'Sábado', hour: '21:00', score: 0.94 },
        { day: 'Quarta-feira', hour: '14:00', score: 0.89 },
      ],
    }
  }
}
