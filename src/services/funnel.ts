import pb from '@/lib/pocketbase/client'

export type DealStage =
  | 'lead_captado'
  | 'contato_feito'
  | 'proposta_enviada'
  | 'negociacao'
  | 'fechado_ganho'
  | 'fechado_perdido'

export type DealSource =
  | 'Google Ads'
  | 'Meta Ads'
  | 'YouTube Ads'
  | 'TikTok Ads'
  | 'LinkedIn Ads'
  | 'Pinterest Ads'
  | 'X Ads'
  | 'Instagram'
  | 'TikTok'
  | 'LinkedIn'
  | 'Indicacao'
  | 'Site'
  | 'Outro'

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
  'Google Ads',
  'Meta Ads',
  'YouTube Ads',
  'TikTok Ads',
  'LinkedIn Ads',
  'Pinterest Ads',
  'X Ads',
  'Instagram',
  'TikTok',
  'LinkedIn',
  'Indicacao',
  'Site',
  'Outro',
]

export interface FunnelAutomationRecord {
  id: string
  user?: string
  rule_key: string
  name: string
  description?: string
  enabled: boolean
  days_inactive?: number
  action_type?: string
  target_stage?: string
  config_json?: any
  created?: string
  updated?: string
}

export async function getFunnelAutomations(): Promise<FunnelAutomationRecord[]> {
  try {
    return await pb.collection('funnel_automations').getFullList<FunnelAutomationRecord>({
      sort: 'created',
      requestKey: null,
    })
  } catch (err) {
    console.warn('Erro ao carregar automações do funil:', err)
    return []
  }
}

export async function updateFunnelAutomation(
  id: string,
  data: Partial<FunnelAutomationRecord>,
): Promise<FunnelAutomationRecord> {
  return await pb.collection('funnel_automations').update<FunnelAutomationRecord>(id, data)
}

export async function toggleFunnelAutomation(
  id: string,
  enabled: boolean,
): Promise<FunnelAutomationRecord> {
  return await pb.collection('funnel_automations').update<FunnelAutomationRecord>(id, { enabled })
}

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

/**
 * Exporta a lista de oportunidades do funil em formato CSV (UTF-8 com BOM para Excel)
 */
export function exportDealsToCSV(deals: FunnelDeal[], filename?: string): void {
  const stageLabels: Record<string, string> = {
    novo_lead: 'Novo Lead',
    qualificacao: 'Qualificação',
    reuniao_agendada: 'Reunião Agendada',
    proposta_enviada: 'Proposta Enviada',
    negociacao: 'Negociação',
    fechado_ganho: 'Fechado Ganho',
    fechado_perdido: 'Fechado Perdido',
  }

  const sourceLabels: Record<string, string> = {
    meta_ads: 'Meta Ads (Instagram/FB)',
    google_ads: 'Google Ads',
    tiktok_ads: 'TikTok Ads',
    linkedin_ads: 'LinkedIn Ads',
    youtube_ads: 'YouTube Ads',
    organico: 'Orgânico Social',
    indicacao: 'Indicação',
    outbound: 'Outbound / Prospecção',
    outro: 'Outro',
  }

  const headers = [
    'ID',
    'Nome / Oportunidade',
    'Empresa',
    'Estágio',
    'Valor (R$)',
    'Origem / Canal',
    'Responsável',
    'Data Prevista',
    'Notas',
    'Criado em',
    'Atualizado em',
  ]

  const rows = deals.map((d) => [
    `"${d.id || ''}"`,
    `"${(d.title || '').replace(/"/g, '""')}"`,
    `"${(d.company || '').replace(/"/g, '""')}"`,
    `"${stageLabels[d.stage] || d.stage}"`,
    d.value || 0,
    `"${d.source ? sourceLabels[d.source] || d.source : ''}"`,
    `"${(d.responsible || '').replace(/"/g, '""')}"`,
    d.expected_close_date || '',
    `"${(d.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    d.created || '',
    d.updated || '',
  ])

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    filename || `funil_oportunidades_${new Date().toISOString().slice(0, 10)}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporta a lista de oportunidades do funil em formato JSON formatado
 */
export function exportDealsToJSON(deals: FunnelDeal[], filename?: string): void {
  const jsonContent = JSON.stringify(
    {
      export_date: new Date().toISOString(),
      total_deals: deals.length,
      deals: deals,
    },
    null,
    2,
  )
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    filename || `funil_oportunidades_${new Date().toISOString().slice(0, 10)}.json`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporta Relatório Resumo Executivo do Funil em formato textual/Markdown para download ou visualização
 */
export function generateFunnelExecutiveSummary(
  deals: FunnelDeal[],
  metrics: FunnelKpis,
  selectedBrandName?: string,
): string {
  const stageLabels: Record<string, string> = {
    novo_lead: 'Novo Lead',
    qualificacao: 'Qualificação',
    reuniao_agendada: 'Reunião Agendada',
    proposta_enviada: 'Proposta Enviada',
    negociacao: 'Negociação',
    fechado_ganho: 'Fechado Ganho',
    fechado_perdido: 'Fechado Perdido',
  }

  // Agrupamento por estágio
  const stageStats: Record<string, { count: number; totalValue: number }> = {}
  Object.keys(stageLabels).forEach((st) => {
    stageStats[st] = { count: 0, totalValue: 0 }
  })

  // Agrupamento por canal de Ads / origem
  const sourceStats: Record<string, { count: number; totalValue: number; wonCount: number }> = {}

  deals.forEach((d) => {
    const val = Number(d.value) || 0
    if (!stageStats[d.stage]) {
      stageStats[d.stage] = { count: 0, totalValue: 0 }
    }
    stageStats[d.stage].count += 1
    stageStats[d.stage].totalValue += val

    const src = d.source || 'outro'
    if (!sourceStats[src]) {
      sourceStats[src] = { count: 0, totalValue: 0, wonCount: 0 }
    }
    sourceStats[src].count += 1
    sourceStats[src].totalValue += val
    if (d.stage === 'fechado_ganho') {
      sourceStats[src].wonCount += 1
    }
  })

  const lines = [
    `# RELATÓRIO EXECUTIVO DO FUNIL DE VENDAS`,
    `Marca / Escopo: ${selectedBrandName || 'Todas as Marcas'}`,
    `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    `------------------------------------------------------------`,
    `## 1. INDICADORES PRINCIPAIS (KPIs)`,
    `- Pipeline Total em Carteira: R$ ${metrics.totalPipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `- Valor em Negociação Avançada: R$ ${metrics.inNegotiationValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `- Receita Fechada no Mês: R$ ${metrics.wonThisMonthValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `- Taxa Global de Conversão: ${metrics.conversionRate}%`,
    `- Ticket Médio Fechado: R$ ${metrics.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `- Total de Oportunidades: ${metrics.totalDeals} (Abertas: ${metrics.openDealsCount} | Ganhas: ${metrics.wonCount} | Perdidas: ${metrics.lostCount})`,
    ``,
    `## 2. DISTRIBUIÇÃO POR ESTÁGIO DO FUNIL`,
    ...Object.entries(stageStats).map(
      ([st, data]) =>
        `- ${stageLabels[st] || st}: ${data.count} oportunidades | R$ ${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ),
    ``,
    `## 3. COMPARATIVO DE ORIGENS E CANAIS DE ADS`,
    ...Object.entries(sourceStats).map(([src, data]) => {
      const conv = data.count > 0 ? ((data.wonCount / data.count) * 100).toFixed(1) : '0'
      return `- Canal: ${src.toUpperCase()} | ${data.count} deals | R$ ${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Fechados: ${data.wonCount} (Conv: ${conv}%)`
    }),
    ``,
    `------------------------------------------------------------`,
    `MidiaViva — Powered by BestContent AI | Gestão Integrada de Tráfego & Vendas`,
  ]

  return lines.join('\n')
}
