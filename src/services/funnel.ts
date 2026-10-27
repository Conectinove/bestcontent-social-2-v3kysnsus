import pb from '@/lib/pocketbase/client'

export type DealStage =
  | 'lead_captado'
  | 'contato_feito'
  | 'proposta_enviada'
  | 'negociacao'
  | 'fechado_ganho'
  | 'fechado_perdido'

export type DealSource = 'Instagram' | 'TikTok' | 'LinkedIn' | 'Indicacao' | 'Site' | 'Outro'

export interface FunnelDeal {
  id: string
  user?: string
  title: string
  company?: string
  value?: number
  stage: DealStage
  source?: DealSource
  responsible?: string
  expected_close_date?: string
  notes?: string
  priority?: 'baixa' | 'media' | 'alta'
  created: string
  updated: string
}

export interface FunnelDealFormData {
  title: string
  company?: string
  value?: number
  stage: DealStage
  source?: DealSource
  responsible?: string
  expected_close_date?: string
  notes?: string
  priority?: 'baixa' | 'media' | 'alta'
}

export interface FunnelStageConfig {
  id: DealStage
  label: string
  color: string
  badgeBg: string
  border: string
  textColor: string
  description: string
}

export const FUNNEL_STAGES: FunnelStageConfig[] = [
  {
    id: 'lead_captado',
    label: 'Lead Captado',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    border: 'border-purple-500/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    description: 'Novo contato recebido via direct, bio ou anúncio',
  },
  {
    id: 'contato_feito',
    label: 'Contato Feito',
    color: '#3b82f6',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    description: 'Primeira conversa, qualificação e alinhamento',
  },
  {
    id: 'proposta_enviada',
    label: 'Proposta Enviada',
    color: '#eab308',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    description: 'Orçamento/escopo encaminhado para análise',
  },
  {
    id: 'negociacao',
    label: 'Negociação',
    color: '#f97316',
    badgeBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    border: 'border-orange-500/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    description: 'Ajustes de escopo, prazos e condições comerciais',
  },
  {
    id: 'fechado_ganho',
    label: 'Fechado Ganho',
    color: '#10b981',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'Contrato assinado e pagamento confirmado',
  },
  {
    id: 'fechado_perdido',
    label: 'Fechado Perdido',
    color: '#ef4444',
    badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    border: 'border-rose-500/30',
    textColor: 'text-rose-600 dark:text-rose-400',
    description: 'Negociação cancelada ou oportunidade arquivada',
  },
]

export const SOURCES_OPTIONS: DealSource[] = [
  'Instagram',
  'TikTok',
  'LinkedIn',
  'Indicacao',
  'Site',
  'Outro',
]

export async function getFunnelDeals(): Promise<FunnelDeal[]> {
  try {
    return await pb.collection('funnel_deals').getFullList<FunnelDeal>({
      sort: '-created',
      requestKey: null,
    })
  } catch (err) {
    console.warn('Erro ao carregar funnel_deals:', err)
    return []
  }
}

export async function createFunnelDeal(data: FunnelDealFormData): Promise<FunnelDeal> {
  const currentUserId = pb.authStore.record?.id
  const payload = {
    ...data,
    user: currentUserId || undefined,
    value: typeof data.value === 'number' ? data.value : 0,
    priority: data.priority || 'media',
  }
  return await pb.collection('funnel_deals').create<FunnelDeal>(payload)
}

export async function updateFunnelDeal(
  id: string,
  data: Partial<FunnelDealFormData>,
): Promise<FunnelDeal> {
  return await pb.collection('funnel_deals').update<FunnelDeal>(id, data)
}

export async function updateDealStage(id: string, stage: DealStage): Promise<FunnelDeal> {
  return await pb.collection('funnel_deals').update<FunnelDeal>(id, { stage })
}

export async function deleteFunnelDeal(id: string): Promise<boolean> {
  return await pb.collection('funnel_deals').delete(id)
}

export interface FunnelKpis {
  totalPipelineValue: number
  inNegotiationValue: number
  conversionRate: number
  averageTicket: number
  wonThisMonthValue: number
  totalDeals: number
  wonCount: number
  lostCount: number
  openDealsCount: number
}

export function calculateFunnelKpis(deals: FunnelDeal[]): FunnelKpis {
  const totalDeals = deals.length
  if (totalDeals === 0) {
    return {
      totalPipelineValue: 0,
      inNegotiationValue: 0,
      conversionRate: 0,
      averageTicket: 0,
      wonThisMonthValue: 0,
      totalDeals: 0,
      wonCount: 0,
      lostCount: 0,
      openDealsCount: 0,
    }
  }

  let totalPipelineValue = 0
  let inNegotiationValue = 0
  let wonTotalValue = 0
  let wonThisMonthValue = 0
  let wonCount = 0
  let lostCount = 0

  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth()

  deals.forEach((deal) => {
    const val = Number(deal.value) || 0
    totalPipelineValue += val

    if (deal.stage === 'negociacao' || deal.stage === 'proposta_enviada') {
      inNegotiationValue += val
    }

    if (deal.stage === 'fechado_ganho') {
      wonCount += 1
      wonTotalValue += val

      const dealDate = deal.updated ? new Date(deal.updated) : new Date(deal.created)
      if (dealDate.getFullYear() === curYear && dealDate.getMonth() === curMonth) {
        wonThisMonthValue += val
      }
    } else if (deal.stage === 'fechado_perdido') {
      lostCount += 1
    }
  })

  // Taxa de conversão: ganhos / total
  const conversionRate = totalDeals > 0 ? Number(((wonCount / totalDeals) * 100).toFixed(1)) : 0
  // Ticket médio dos ganhos (ou da carteira geral se nenhum ganho)
  const averageTicket =
    wonCount > 0
      ? Math.round(wonTotalValue / wonCount)
      : Math.round(totalPipelineValue / totalDeals)

  const openDealsCount = totalDeals - (wonCount + lostCount)

  return {
    totalPipelineValue,
    inNegotiationValue,
    conversionRate,
    averageTicket,
    wonThisMonthValue,
    totalDeals,
    wonCount,
    lostCount,
    openDealsCount,
  }
}
