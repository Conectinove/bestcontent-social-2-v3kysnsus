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
): AdCopy {
  const brand = brandName || 'Sua Marca'
  const seg = segment || 'produtos e serviços de alta qualidade'

  if (objective === 'vendas') {
    return {
      headline: `${brand} com Condições Exclusivas por Tempo Limitado`,
      primaryText: `Descubra a linha completa de ${seg} que está conquistando clientes em todo o Brasil. Clique e aproveite entrega rápida e garantia total.`,
      description: 'Garanta sua compra em até 12x sem juros.',
      cta: 'Comprar Agora',
      tone: 'Persuasivo & Direto',
    }
  }

  if (objective === 'leads') {
    return {
      headline: `Receba um Diagnóstico Gratuito com a Equipe de ${brand}`,
      primaryText: `Quer acelerar seus resultados em ${seg}? Preencha o formulário em menos de 1 minuto e converse com um especialista dedicado.`,
      description: 'Vagas limitadas para este ciclo.',
      cta: 'Cadastre-se Já',
      tone: 'Consultivo',
    }
  }

  if (objective === 'reconhecimento') {
    return {
      headline: `Conheça a Experiência Inovadora de ${brand}`,
      primaryText: `Feito para quem não abre mão de excelência em ${seg}. Acompanhe nossas novidades e inspire-se diariamente.`,
      description: 'Mais de 10.000 clientes satisfeitos.',
      cta: 'Saiba Mais',
      tone: 'Inspirador',
    }
  }

  // Padrão: Tráfego
  return {
    headline: `Descubra as Soluções de ${brand} para o seu Dia a Dia`,
    primaryText: `Conecte-se com o melhor em ${seg}. Acesse nosso site oficial e explore conteúdos e ofertas pensadas para você.`,
    description: 'Acesse o link direto e confira.',
    cta: network === 'instagram' ? 'Acessar Link' : 'Visitar Site',
    tone: 'Profissional e Convidativo',
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
