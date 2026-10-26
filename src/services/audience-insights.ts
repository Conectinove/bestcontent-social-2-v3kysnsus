import pb from '@/lib/pocketbase/client'

export interface AgeGroupItem {
  range: string
  percentage: number
}

export interface GenderDistribution {
  female: number
  male: number
  other: number
}

export interface CityItem {
  city: string
  percentage: number
}

export interface BestTimeItem {
  day: string
  hour: string
  score: number
}

export interface WeeklyGrowthItem {
  week: string
  followers: number
  growthRate: number // ex: +2.4%
  netGain: number // ex: +320
}

export interface NetworkAudienceComparison {
  network: string
  label: string
  primaryAgeGroup: string
  genderDominance: string
  engagementRate: number
  growthRate: number
  keyInsight: string
  bestContentType: string
}

export interface RetentionMetrics {
  returningEngagersRate: number // % de pessoas que engajam em mais de 1 post
  averageSessionsPerWeek: number
  saveToShareRatio: number
  churnRisk: 'Baixo' | 'Médio' | 'Alto'
  retentionScore: number // 0-100
  loyalAudienceCount: number
}

export interface AudienceInsight {
  id: string
  brand?: string
  user?: string
  network: string
  age_distribution: AgeGroupItem[]
  gender_distribution: GenderDistribution
  top_cities: CityItem[]
  best_times: BestTimeItem[]
  total_followers_tracked: number
  engagement_peak_day: string
  engagement_peak_hour: string
  weekly_growth?: WeeklyGrowthItem[]
  retention_metrics?: RetentionMetrics
  is_simulated: boolean
  created?: string
  updated?: string
}

function parseJsonField<T>(field: unknown, fallback: T): T {
  if (!field) return fallback
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T
    } catch {
      return fallback
    }
  }
  return field as T
}

function mapAudienceRecord(rec: any): AudienceInsight {
  const defaultFallback = getFallbackAudienceInsight(rec.network || 'all')

  return {
    id: rec.id,
    brand: rec.brand,
    user: rec.user,
    network: rec.network || 'all',
    age_distribution: parseJsonField<AgeGroupItem[]>(
      rec.age_distribution,
      defaultFallback.age_distribution,
    ),
    gender_distribution: parseJsonField<GenderDistribution>(
      rec.gender_distribution,
      defaultFallback.gender_distribution,
    ),
    top_cities: parseJsonField<CityItem[]>(rec.top_cities, defaultFallback.top_cities),
    best_times: parseJsonField<BestTimeItem[]>(rec.best_times, defaultFallback.best_times),
    total_followers_tracked: rec.total_followers_tracked || defaultFallback.total_followers_tracked,
    engagement_peak_day: rec.engagement_peak_day || defaultFallback.engagement_peak_day,
    engagement_peak_hour: rec.engagement_peak_hour || defaultFallback.engagement_peak_hour,
    weekly_growth: defaultFallback.weekly_growth,
    retention_metrics: defaultFallback.retention_metrics,
    is_simulated: rec.is_simulated ?? true,
    created: rec.created,
    updated: rec.updated,
  }
}

/**
 * Busca insights de audiência por marca e rede social
 */
export async function getAudienceInsights(
  brandId?: string,
  network = 'all',
): Promise<AudienceInsight | null> {
  try {
    const filters: string[] = []
    if (brandId && brandId !== 'all') {
      filters.push(`brand = "${brandId}"`)
    }
    if (network && network !== 'all') {
      filters.push(`network = "${network}"`)
    } else {
      filters.push(`network = "all"`)
    }

    const filterStr = filters.join(' && ')
    const record = await pb.collection('audience_insights').getFirstListItem(filterStr)

    return mapAudienceRecord(record)
  } catch {
    // Se não encontrou o insight da rede exata ou marca, tenta fallback geral
    return getFallbackAudienceInsight(network)
  }
}

/**
 * Retorna todos os insights de audiência disponíveis para a conta / marca
 */
export async function getAllAudienceInsights(brandId?: string): Promise<AudienceInsight[]> {
  try {
    const filter = brandId && brandId !== 'all' ? `brand = "${brandId}"` : undefined
    const records = await pb.collection('audience_insights').getFullList({
      filter,
      sort: '-created',
    })
    return records.map(mapAudienceRecord)
  } catch {
    return [getFallbackAudienceInsight('all')]
  }
}

/**
 * Fallback plausível caso não haja registro prévio no banco
 */
export function getFallbackAudienceInsight(network = 'all'): AudienceInsight {
  const net = network.toLowerCase()
  const buildWeeklyGrowth = (
    baseFollowers: number,
    growthRatePercent: number,
  ): WeeklyGrowthItem[] => {
    const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8']
    let current = Math.round(baseFollowers * 0.88)
    return weeks.map((w, idx) => {
      const rate = Number((growthRatePercent + (idx % 3 === 0 ? 0.3 : -0.2)).toFixed(1))
      const netGain = Math.round(current * (rate / 100))
      current += netGain
      return {
        week: w,
        followers: current,
        growthRate: rate,
        netGain: netGain,
      }
    })
  }

  if (net === 'linkedin') {
    return {
      id: 'fallback-linkedin',
      network: 'linkedin',
      age_distribution: [
        { range: '18-24', percentage: 11 },
        { range: '25-34', percentage: 48 },
        { range: '35-44', percentage: 27 },
        { range: '45-54', percentage: 11 },
        { range: '55+', percentage: 3 },
      ],
      gender_distribution: { female: 44, male: 53, other: 3 },
      top_cities: [
        { city: 'São Paulo, SP', percentage: 38 },
        { city: 'Rio de Janeiro, RJ', percentage: 16 },
        { city: 'Belo Horizonte, MG', percentage: 11 },
        { city: 'Curitiba, PR', percentage: 8 },
        { city: 'Brasília, DF', percentage: 7 },
      ],
      best_times: [
        { day: 'Terça-feira', hour: '08:30', score: 96 },
        { day: 'Quarta-feira', hour: '12:00', score: 92 },
        { day: 'Quinta-feira', hour: '17:30', score: 98 },
        { day: 'Sexta-feira', hour: '10:00', score: 84 },
      ],
      total_followers_tracked: 8900,
      engagement_peak_day: 'Quinta-feira',
      engagement_peak_hour: '17:30',
      weekly_growth: buildWeeklyGrowth(8900, 2.1),
      retention_metrics: {
        returningEngagersRate: 41,
        averageSessionsPerWeek: 3.2,
        saveToShareRatio: 1.8,
        churnRisk: 'Baixo',
        retentionScore: 84,
        loyalAudienceCount: 3650,
      },
      is_simulated: true,
    }
  }

  if (net === 'facebook') {
    return {
      id: 'fallback-facebook',
      network: 'facebook',
      age_distribution: [
        { range: '18-24', percentage: 14 },
        { range: '25-34', percentage: 31 },
        { range: '35-44', percentage: 29 },
        { range: '45-54', percentage: 17 },
        { range: '55+', percentage: 9 },
      ],
      gender_distribution: { female: 56, male: 42, other: 2 },
      top_cities: [
        { city: 'São Paulo, SP', percentage: 30 },
        { city: 'Rio de Janeiro, RJ', percentage: 15 },
        { city: 'Salvador, BA', percentage: 10 },
        { city: 'Fortaleza, CE', percentage: 9 },
        { city: 'Belo Horizonte, MG', percentage: 8 },
      ],
      best_times: [
        { day: 'Segunda-feira', hour: '20:00', score: 88 },
        { day: 'Quarta-feira', hour: '19:30', score: 94 },
        { day: 'Sábado', hour: '11:00', score: 90 },
        { day: 'Domingo', hour: '20:30', score: 97 },
      ],
      total_followers_tracked: 12400,
      engagement_peak_day: 'Domingo',
      engagement_peak_hour: '20:30',
      weekly_growth: buildWeeklyGrowth(12400, 1.2),
      retention_metrics: {
        returningEngagersRate: 33,
        averageSessionsPerWeek: 2.5,
        saveToShareRatio: 0.9,
        churnRisk: 'Médio',
        retentionScore: 68,
        loyalAudienceCount: 4090,
      },
      is_simulated: true,
    }
  }

  if (net === 'whatsapp') {
    return {
      id: 'fallback-whatsapp',
      network: 'whatsapp',
      age_distribution: [
        { range: '18-24', percentage: 19 },
        { range: '25-34', percentage: 39 },
        { range: '35-44', percentage: 24 },
        { range: '45-54', percentage: 13 },
        { range: '55+', percentage: 5 },
      ],
      gender_distribution: { female: 58, male: 40, other: 2 },
      top_cities: [
        { city: 'São Paulo, SP', percentage: 34 },
        { city: 'Campinas, SP', percentage: 14 },
        { city: 'Rio de Janeiro, RJ', percentage: 12 },
        { city: 'Belo Horizonte, MG', percentage: 9 },
        { city: 'Porto Alegre, RS', percentage: 7 },
      ],
      best_times: [
        { day: 'Segunda-feira', hour: '09:00', score: 95 },
        { day: 'Terça-feira', hour: '14:30', score: 93 },
        { day: 'Quarta-feira', hour: '18:00', score: 97 },
        { day: 'Sexta-feira', hour: '11:30', score: 91 },
      ],
      total_followers_tracked: 4600,
      engagement_peak_day: 'Quarta-feira',
      engagement_peak_hour: '18:00',
      weekly_growth: buildWeeklyGrowth(4600, 3.4),
      retention_metrics: {
        returningEngagersRate: 58,
        averageSessionsPerWeek: 4.8,
        saveToShareRatio: 2.4,
        churnRisk: 'Baixo',
        retentionScore: 92,
        loyalAudienceCount: 2660,
      },
      is_simulated: true,
    }
  }

  if (net === 'tiktok') {
    return {
      id: 'fallback-tiktok',
      network: 'tiktok',
      age_distribution: [
        { range: '18-24', percentage: 46 },
        { range: '25-34', percentage: 34 },
        { range: '35-44', percentage: 13 },
        { range: '45-54', percentage: 5 },
        { range: '55+', percentage: 2 },
      ],
      gender_distribution: { female: 61, male: 36, other: 3 },
      top_cities: [
        { city: 'São Paulo, SP', percentage: 32 },
        { city: 'Rio de Janeiro, RJ', percentage: 17 },
        { city: 'Fortaleza, CE', percentage: 9 },
        { city: 'Belo Horizonte, MG', percentage: 8 },
        { city: 'Recife, PE', percentage: 7 },
      ],
      best_times: [
        { day: 'Terça-feira', hour: '21:00', score: 94 },
        { day: 'Quinta-feira', hour: '21:30', score: 98 },
        { day: 'Sexta-feira', hour: '22:00', score: 96 },
        { day: 'Sábado', hour: '16:00', score: 91 },
      ],
      total_followers_tracked: 19500,
      engagement_peak_day: 'Quinta-feira',
      engagement_peak_hour: '21:30',
      weekly_growth: buildWeeklyGrowth(19500, 4.2),
      retention_metrics: {
        returningEngagersRate: 48,
        averageSessionsPerWeek: 5.1,
        saveToShareRatio: 1.6,
        churnRisk: 'Baixo',
        retentionScore: 86,
        loyalAudienceCount: 9360,
      },
      is_simulated: true,
    }
  }

  if (net === 'youtube') {
    return {
      id: 'fallback-youtube',
      network: 'youtube',
      age_distribution: [
        { range: '18-24', percentage: 22 },
        { range: '25-34', percentage: 41 },
        { range: '35-44', percentage: 24 },
        { range: '45-54', percentage: 9 },
        { range: '55+', percentage: 4 },
      ],
      gender_distribution: { female: 47, male: 50, other: 3 },
      top_cities: [
        { city: 'São Paulo, SP', percentage: 36 },
        { city: 'Rio de Janeiro, RJ', percentage: 18 },
        { city: 'Belo Horizonte, MG', percentage: 10 },
        { city: 'Curitiba, PR', percentage: 9 },
        { city: 'Porto Alegre, RS', percentage: 8 },
      ],
      best_times: [
        { day: 'Terça-feira', hour: '18:00', score: 92 },
        { day: 'Quinta-feira', hour: '19:30', score: 96 },
        { day: 'Sábado', hour: '14:00', score: 94 },
        { day: 'Domingo', hour: '17:00', score: 99 },
      ],
      total_followers_tracked: 22400,
      engagement_peak_day: 'Domingo',
      engagement_peak_hour: '17:00',
      weekly_growth: buildWeeklyGrowth(22400, 2.5),
      retention_metrics: {
        returningEngagersRate: 52,
        averageSessionsPerWeek: 4.2,
        saveToShareRatio: 2.1,
        churnRisk: 'Baixo',
        retentionScore: 89,
        loyalAudienceCount: 11650,
      },
      is_simulated: true,
    }
  }

  if (net === 'twitter' || net === 'x') {
    return {
      id: 'fallback-twitter',
      network: 'twitter',
      age_distribution: [
        { range: '18-24', percentage: 28 },
        { range: '25-34', percentage: 46 },
        { range: '35-44', percentage: 18 },
        { range: '45-54', percentage: 6 },
        { range: '55+', percentage: 2 },
      ],
      gender_distribution: { female: 39, male: 57, other: 4 },
      top_cities: [
        { city: 'São Paulo, SP', percentage: 42 },
        { city: 'Rio de Janeiro, RJ', percentage: 19 },
        { city: 'Belo Horizonte, MG', percentage: 12 },
        { city: 'Brasília, DF', percentage: 11 },
        { city: 'Curitiba, PR', percentage: 7 },
      ],
      best_times: [
        { day: 'Segunda-feira', hour: '12:30', score: 93 },
        { day: 'Terça-feira', hour: '10:00', score: 95 },
        { day: 'Quarta-feira', hour: '15:00', score: 97 },
        { day: 'Quinta-feira', hour: '21:00', score: 91 },
      ],
      total_followers_tracked: 11200,
      engagement_peak_day: 'Quarta-feira',
      engagement_peak_hour: '15:00',
      weekly_growth: buildWeeklyGrowth(11200, 1.8),
      retention_metrics: {
        returningEngagersRate: 37,
        averageSessionsPerWeek: 3.6,
        saveToShareRatio: 1.1,
        churnRisk: 'Médio',
        retentionScore: 73,
        loyalAudienceCount: 4140,
      },
      is_simulated: true,
    }
  }

  // Instagram e Geral ('all')
  return {
    id: 'fallback-default',
    network: 'all',
    age_distribution: [
      { range: '18-24', percentage: 23 },
      { range: '25-34', percentage: 44 },
      { range: '35-44', percentage: 21 },
      { range: '45-54', percentage: 8 },
      { range: '55+', percentage: 4 },
    ],
    gender_distribution: { female: 54, male: 43, other: 3 },
    top_cities: [
      { city: 'São Paulo, SP', percentage: 35 },
      { city: 'Rio de Janeiro, RJ', percentage: 16 },
      { city: 'Belo Horizonte, MG', percentage: 10 },
      { city: 'Curitiba, PR', percentage: 8 },
      { city: 'Brasília, DF', percentage: 7 },
    ],
    best_times: [
      { day: 'Segunda-feira', hour: '18:30', score: 89 },
      { day: 'Terça-feira', hour: '12:00', score: 91 },
      { day: 'Quarta-feira', hour: '19:00', score: 98 },
      { day: 'Quinta-feira', hour: '20:00', score: 95 },
      { day: 'Domingo', hour: '19:30', score: 92 },
    ],
    total_followers_tracked: 16800,
    engagement_peak_day: 'Quarta-feira',
    engagement_peak_hour: '19:00',
    weekly_growth: buildWeeklyGrowth(16800, 2.8),
    retention_metrics: {
      returningEngagersRate: 46,
      averageSessionsPerWeek: 3.9,
      saveToShareRatio: 1.5,
      churnRisk: 'Baixo',
      retentionScore: 82,
      loyalAudienceCount: 7720,
    },
    is_simulated: true,
  }
}

/**
 * Retorna comparativo de audiência entre redes da mesma marca
 */
export function getNetworkAudienceComparisons(): NetworkAudienceComparison[] {
  return [
    {
      network: 'instagram',
      label: 'Instagram',
      primaryAgeGroup: '25-34 anos (44%)',
      genderDominance: '54% Feminino',
      engagementRate: 4.8,
      growthRate: 2.8,
      keyInsight: 'Público visual focado em consumo rápido, estética e tendências.',
      bestContentType: 'Reels dinâmico & Carrossel 5 slides',
    },
    {
      network: 'linkedin',
      label: 'LinkedIn',
      primaryAgeGroup: '60% 35+ anos (35-54+)',
      genderDominance: '53% Masculino',
      engagementRate: 5.4,
      growthRate: 2.1,
      keyInsight: 'Público mais maduro, decisores de negócios e busca por autoridade.',
      bestContentType: 'Artigos profundos & Carrossel PDF',
    },
    {
      network: 'tiktok',
      label: 'TikTok',
      primaryAgeGroup: '18-24 anos (46%)',
      genderDominance: '61% Feminino',
      engagementRate: 6.9,
      growthRate: 4.2,
      keyInsight: 'Geração Z e público jovem; altíssimo alcance orgânico e viralização.',
      bestContentType: 'Vídeos curtos com áudio trending',
    },
    {
      network: 'youtube',
      label: 'YouTube',
      primaryAgeGroup: '25-44 anos (65%)',
      genderDominance: '50% Masculino',
      engagementRate: 5.1,
      growthRate: 2.5,
      keyInsight: 'Audiência perene focada em aprendizado prático e tutoriais.',
      bestContentType: 'Vídeos longos educativos & Shorts',
    },
    {
      network: 'whatsapp',
      label: 'WhatsApp',
      primaryAgeGroup: '25-44 anos (63%)',
      genderDominance: '58% Feminino',
      engagementRate: 8.2,
      growthRate: 3.4,
      keyInsight: 'Canal de retenção e lealdade máxima; alta taxa de conversão.',
      bestContentType: 'Listas VIP, áudios e ofertas diretas',
    },
    {
      network: 'facebook',
      label: 'Facebook',
      primaryAgeGroup: '35-54 anos (46%)',
      genderDominance: '56% Feminino',
      engagementRate: 3.2,
      growthRate: 1.2,
      keyInsight: 'Famílias, grupos de discussão e compras em comunidade.',
      bestContentType: 'Posts de comunidade & Vídeos nativos',
    },
  ]
}
