import pb from '@/lib/pocketbase/client'

export interface CompetitorAnalysis {
  id: string
  brand?: string
  user?: string
  name: string
  handle?: string
  network: string
  estimated_followers: number
  estimated_engagement_rate: number
  post_frequency: string
  estimated_growth_rate: number
  posts_count?: number
  strengths: string[]
  weaknesses: string[]
  notes: string
  is_simulated: boolean
  created?: string
  updated?: string
}

function parseJsonArray(field: unknown): string[] {
  if (!field) return []
  if (Array.isArray(field)) return field.map(String)
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

function mapCompetitorRecord(rec: any): CompetitorAnalysis {
  return {
    id: rec.id,
    brand: rec.brand,
    user: rec.user,
    name: rec.name || 'Concorrente',
    handle: rec.handle || '',
    network: rec.network || 'instagram',
    estimated_followers: Number(rec.estimated_followers) || 15000,
    estimated_engagement_rate: Number(rec.estimated_engagement_rate) || 4.2,
    post_frequency: rec.post_frequency || '3-5 posts / semana',
    estimated_growth_rate: Number(rec.estimated_growth_rate) || 5.0,
    posts_count: Number(rec.posts_count) || undefined,
    strengths: parseJsonArray(rec.strengths),
    weaknesses: parseJsonArray(rec.weaknesses),
    notes: rec.notes || '',
    is_simulated: rec.is_simulated ?? true,
    created: rec.created,
    updated: rec.updated,
  }
}

export const FALLBACK_COMPETITORS: CompetitorAnalysis[] = [
  {
    id: 'fallback-comp-1',
    name: 'TechWave Criativa',
    handle: '@techwave.criativa',
    network: 'instagram',
    estimated_followers: 28400,
    estimated_engagement_rate: 3.8,
    post_frequency: '5 posts / semana',
    estimated_growth_rate: 4.2,
    strengths: ['Vídeos curtos no Reels', 'Identidade visual consistente'],
    weaknesses: ['Pouco engajamento nos Stories', 'Respostas lentas na DM'],
    notes: 'Forte presença em Reels visuais, mas menor retenção em carrosséis técnicos.',
    is_simulated: true,
  },
  {
    id: 'fallback-comp-2',
    name: 'Pulse Media Digital',
    handle: '@pulsemediabr',
    network: 'instagram',
    estimated_followers: 18900,
    estimated_engagement_rate: 4.9,
    post_frequency: '3 posts / semana',
    estimated_growth_rate: 6.8,
    strengths: ['Carrosséis educativos aprofundados', 'Comunidade ativa nos comentários'],
    weaknesses: ['Frequência irregular', 'Pouca produção de vídeo'],
    notes: 'Referência em carrosséis de autoridade, com público muito engajado.',
    is_simulated: true,
  },
  {
    id: 'fallback-comp-3',
    name: 'Vanguard Hub Corporativo',
    handle: 'vanguard-hub-brasil',
    network: 'linkedin',
    estimated_followers: 34500,
    estimated_engagement_rate: 4.2,
    post_frequency: '4 posts / semana',
    estimated_growth_rate: 5.1,
    strengths: ['Artigos longos e liderança de pensamento', 'C-levels engajando'],
    weaknesses: ['Linguagem formal excessiva', 'Pouca experimentação de formatos'],
    notes: 'Grande base B2B, porém taxa de cliques menor que a da sua marca.',
    is_simulated: true,
  },
  {
    id: 'fallback-comp-4',
    name: 'Viralize Creators Lab',
    handle: '@viralize.lab',
    network: 'tiktok',
    estimated_followers: 47200,
    estimated_engagement_rate: 7.4,
    post_frequency: '7 vídeos / semana',
    estimated_growth_rate: 12.5,
    strengths: ['Alta retenção nos primeiros 3 segundos', 'Uso inteligente de áudios em alta'],
    weaknesses: ['Baixa conversão para vendas', 'Comunidade volátil'],
    notes: 'Foco massivo em visualizações virais, mas menor autoridade de produto.',
    is_simulated: true,
  },
  {
    id: 'fallback-comp-5',
    name: 'Apex Growth & Strategy',
    handle: '@apex_growth_br',
    network: 'twitter',
    estimated_followers: 14200,
    estimated_engagement_rate: 5.6,
    post_frequency: '2 threads / dia',
    estimated_growth_rate: 8.3,
    posts_count: 620,
    strengths: ['Threads de alto impacto e debate', 'Engajamento em tempo real'],
    weaknesses: ['Poucos criativos visuais', 'Dependência de polêmicas'],
    notes: 'Muito ativo em discussões de nicho e comentários rápidos no X.',
    is_simulated: true,
  },
  {
    id: 'fallback-comp-6',
    name: 'Social Boost Brasil',
    handle: 'fb.com/socialboostbr',
    network: 'facebook',
    estimated_followers: 22100,
    estimated_engagement_rate: 3.4,
    post_frequency: '4 posts / semana',
    estimated_growth_rate: 2.1,
    posts_count: 310,
    strengths: ['Grupos de discussão engajados', 'Lives mensais'],
    weaknesses: ['Baixo alcance orgânico na página', 'Pouco tráfego jovem'],
    notes: 'Mantém comunidade ativa via grupos nichados no Facebook.',
    is_simulated: true,
  },
  {
    id: 'fallback-comp-7',
    name: 'Canal VIP Comunidade Pro',
    handle: 'chat.whatsapp.com/vip-pro',
    network: 'whatsapp',
    estimated_followers: 8600,
    estimated_engagement_rate: 14.2,
    post_frequency: '2 avisos / dia',
    estimated_growth_rate: 8.9,
    posts_count: 350,
    strengths: ['Abertura de mensagens acima de 70%', 'Ofertas relâmpago'],
    weaknesses: ['Risco de ruído se enviar mensagens em excesso', 'Pouca viralidade'],
    notes: 'Canal de alta conversão direta e fidelização dos clientes mais fiéis.',
    is_simulated: true,
  },
  {
    id: 'fallback-comp-8',
    name: 'Studio Mídia Play',
    handle: '@studiomidiaplay',
    network: 'youtube',
    estimated_followers: 26500,
    estimated_engagement_rate: 5.8,
    post_frequency: '2 vídeos + 4 Shorts / semana',
    estimated_growth_rate: 6.4,
    posts_count: 190,
    strengths: ['Thumbnails clicáveis de alto CTR', 'SEO impecável nas buscas'],
    weaknesses: ['Custo alto de produção', 'Retenção oscilante'],
    notes: 'Canal com forte relevância de pesquisa a longo prazo no YouTube.',
    is_simulated: true,
  },
]

export async function getCompetitorsByBrand(
  brandId?: string,
  network?: string,
): Promise<CompetitorAnalysis[]> {
  try {
    const filters: string[] = []
    if (brandId && brandId !== 'all') {
      filters.push(`brand = "${brandId}"`)
    }
    if (network && network !== 'all') {
      filters.push(`network = "${network}"`)
    }
    const filter = filters.length > 0 ? filters.join(' && ') : undefined

    const records = await pb.collection('competitor_analysis').getFullList({
      filter,
      sort: '-estimated_followers',
    })

    if (!records || records.length === 0) {
      return FALLBACK_COMPETITORS
    }

    return records.map(mapCompetitorRecord)
  } catch (err) {
    console.error('Falha ao carregar concorrentes do backend:', err)
    return FALLBACK_COMPETITORS
  }
}
