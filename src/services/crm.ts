import { pb } from '@/lib/pocketbase/client'
import { createPost } from '@/services/posts'
import { createScheduledPost } from '@/services/scheduled_posts'

export type CrmStage =
  | 'lead_captado'
  | 'contato_feito'
  | 'proposta_enviada'
  | 'negociacao'
  | 'fechado_ganho'
  | 'fechado_perdido'

export type CrmSource =
  | 'Instagram'
  | 'WhatsApp'
  | 'Google Ads'
  | 'Meta Ads'
  | 'LinkedIn'
  | 'TikTok'
  | 'YouTube Ads'
  | 'Indicacao'
  | 'Site'
  | 'Outro'

export type CrmPriority = 'baixa' | 'media' | 'alta'

export type InteractionType =
  | 'whatsapp'
  | 'email'
  | 'ligacao'
  | 'reuniao'
  | 'nota'
  | 'proposta'
  | 'mudanca_estagio'

export interface CrmCustomField {
  key: string
  label: string
  value: string
}

export interface CrmContact {
  id: string
  user?: string
  name: string
  company?: string
  email?: string
  phone?: string
  source?: CrmSource
  stage: CrmStage
  value?: number
  priority?: CrmPriority
  responsible?: string
  notes?: string
  custom_fields?: Record<string, string> | CrmCustomField[] | null
  tags?: string[] | string | null
  last_interaction_at?: string
  expected_close_date?: string
  created: string
  updated: string
}

export interface CrmContactFormData {
  name: string
  company?: string
  email?: string
  phone?: string
  source?: CrmSource
  stage: CrmStage
  value?: number
  priority?: CrmPriority
  responsible?: string
  notes?: string
  custom_fields?: Record<string, string>
  tags?: string[]
  expected_close_date?: string
}

export interface CrmInteraction {
  id: string
  user?: string
  contact: string
  type: InteractionType
  title: string
  description?: string
  interaction_date?: string
  metadata?: Record<string, unknown> | null
  created: string
  updated: string
  expand?: {
    contact?: CrmContact
  }
}

export interface CrmInteractionFormData {
  contact: string
  type: InteractionType
  title: string
  description?: string
  interaction_date?: string
  metadata?: Record<string, unknown>
}

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  lead_captado: 'Lead Captado',
  contato_feito: 'Contato Feito',
  proposta_enviada: 'Proposta Enviada',
  negociacao: 'Negociação',
  fechado_ganho: 'Fechado Ganho',
  fechado_perdido: 'Fechado Perdido',
}

export const CRM_STAGE_COLORS: Record<CrmStage, { bg: string; text: string; border: string }> = {
  lead_captado: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  contato_feito: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  proposta_enviada: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  negociacao: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
  },
  fechado_ganho: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  fechado_perdido: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
  },
}

export const CRM_SOURCES: CrmSource[] = [
  'Instagram',
  'WhatsApp',
  'Google Ads',
  'Meta Ads',
  'LinkedIn',
  'TikTok',
  'YouTube Ads',
  'Indicacao',
  'Site',
  'Outro',
]

// Fallback de demonstração caso ainda não existam contatos
export const CRM_DEMO_CONTACTS: CrmContact[] = [
  {
    id: 'demo-1',
    name: 'Carolina Ribeiro',
    company: 'Clinica Lumina Estética',
    email: 'carol@luminaestetica.com.br',
    phone: '(11) 98765-4321',
    source: 'Instagram',
    stage: 'negociacao',
    value: 4800,
    priority: 'alta',
    responsible: 'Ronaldo Barreto',
    notes: 'Interessada no plano de gestão completa + anúncios Meta Ads. Proposta em análise.',
    custom_fields: { nicho: 'Saúde & Estética', instagram: '@luminaestetica' },
    tags: ['VIP', 'Meta Ads', 'Ticket Alto'],
    created: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString(),
    updated: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
  {
    id: 'demo-2',
    name: 'Eduardo Martins',
    company: 'Apex Contabilidade',
    email: 'eduardo@apexcontabil.com.br',
    phone: '(21) 99123-8877',
    source: 'Google Ads',
    stage: 'proposta_enviada',
    value: 3200,
    priority: 'media',
    responsible: 'Ronaldo Barreto',
    notes: 'Proposta encaminhada via WhatsApp com plano trimestral de conteúdo B2B.',
    custom_fields: { nicho: 'B2B Serviços', decisor: 'Sócio Fundador' },
    tags: ['B2B', 'LinkedIn', 'Google Ads'],
    created: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
    updated: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
  {
    id: 'demo-3',
    name: 'Marina Silveira',
    company: 'Studio Pilates Vida',
    email: 'marina@pilatesvida.com.br',
    phone: '(31) 97654-2211',
    source: 'WhatsApp',
    stage: 'fechado_ganho',
    value: 2900,
    priority: 'alta',
    responsible: 'Ronaldo Barreto',
    notes: 'Contrato fechado! Onboarding marcado e primeiro calendário gerado no MidiaViva.',
    custom_fields: { nicho: 'Fitness', contrato: 'Semestral' },
    tags: ['Ganho', 'Recorrente'],
    created: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString(),
    updated: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'demo-4',
    name: 'Thiago Faria',
    company: 'TF Imóveis Prime',
    email: 'thiago@tfimoveis.com.br',
    phone: '(41) 98877-6655',
    source: 'Meta Ads',
    stage: 'contato_feito',
    value: 6500,
    priority: 'alta',
    responsible: 'Ronaldo Barreto',
    notes: 'Lead qualificado. Quer vídeos para Reels e lançamentos de alto padrão.',
    custom_fields: { nicho: 'Imobiliário', ticketMedioImovel: 'R$ 1.5M' },
    tags: ['Imóveis', 'Reels'],
    created: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(),
    updated: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(),
  },
  {
    id: 'demo-5',
    name: 'Juliana Castro',
    company: 'Doce Encanto Confeitaria',
    email: 'juliana@doceencanto.com',
    phone: '(19) 99345-1122',
    source: 'Indicacao',
    stage: 'lead_captado',
    value: 1800,
    priority: 'baixa',
    responsible: 'Ronaldo Barreto',
    notes: 'Chegou via indicação da Marina. Aguardando envio do briefing inicial.',
    tags: ['Indicação', 'Alimentação'],
    created: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    updated: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
  },
]

export const CRM_DEMO_INTERACTIONS: CrmInteraction[] = [
  {
    id: 'inter-1',
    contact: 'demo-1',
    type: 'reuniao',
    title: 'Apresentação da Proposta Comercial',
    description:
      'Reunião via Google Meet com Carolina. Alinhamos escopo de Meta Ads e geração de criativos com BestContent.',
    interaction_date: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(),
    created: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(),
    updated: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(),
  },
  {
    id: 'inter-2',
    contact: 'demo-1',
    type: 'whatsapp',
    title: 'Envio de PDF com tabela de valores',
    description:
      'Enviada tabela com condições especiais e bônus de 2 semanas de onboarding acelerado.',
    interaction_date: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    created: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    updated: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
  {
    id: 'inter-3',
    contact: 'demo-3',
    type: 'mudanca_estagio',
    title: 'Status alterado para Fechado Ganho 🎉',
    description: 'Contrato assinado e primeira parcela liquidada via Asaas.',
    interaction_date: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    created: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    updated: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
]

// ==========================================
// FUNÇÕES DE ACESSO AO BANCO (POCKETBASE)
// ==========================================

export async function getCrmContacts(): Promise<CrmContact[]> {
  try {
    const list = await pb.collection('crm_contacts').getFullList<CrmContact>({
      sort: '-created',
      requestKey: null,
    })
    return list
  } catch (err) {
    console.warn('Erro ao carregar crm_contacts do PocketBase:', err)
    return []
  }
}

export async function getCrmInteractions(contactId?: string): Promise<CrmInteraction[]> {
  try {
    const filter = contactId ? `contact = "${contactId}"` : ''
    const list = await pb.collection('crm_interactions').getFullList<CrmInteraction>({
      filter: filter || undefined,
      sort: '-created',
      expand: 'contact',
      requestKey: null,
    })
    return list
  } catch (err) {
    console.warn('Erro ao carregar crm_interactions do PocketBase:', err)
    return []
  }
}

export async function createCrmContact(data: CrmContactFormData): Promise<CrmContact> {
  const currentUserId = pb.authStore.record?.id
  const payload: Record<string, unknown> = {
    ...data,
    user: currentUserId || undefined,
    value: typeof data.value === 'number' ? data.value : 0,
    priority: data.priority || 'media',
    custom_fields: data.custom_fields || {},
    tags: data.tags || [],
  }

  const created = await pb.collection('crm_contacts').create<CrmContact>(payload)

  // Registra automaticamente a primeira interação
  try {
    await createCrmInteraction({
      contact: created.id,
      type: 'nota',
      title: 'Contato cadastrado no CRM',
      description: `Lead criado com estágio "${CRM_STAGE_LABELS[data.stage]}" e origem "${data.source || 'Não especificada'}".`,
      interaction_date: new Date().toISOString(),
    })
  } catch (_) {
    // Silencioso
  }

  return created
}

export async function updateCrmContact(
  id: string,
  data: Partial<CrmContactFormData>,
): Promise<CrmContact> {
  return await pb.collection('crm_contacts').update<CrmContact>(id, data)
}

export async function deleteCrmContact(id: string): Promise<boolean> {
  return await pb.collection('crm_contacts').delete(id)
}

/**
 * Atualiza o estágio do contato e dispara:
 * 1. Registro de interação de auditoria
 * 2. Automação de funil: tarefa no calendário em "Datas Próximas"
 */
export async function updateCrmContactStage(
  contact: CrmContact,
  newStage: CrmStage,
  userId?: string,
): Promise<CrmContact> {
  const oldStage = contact.stage
  const updated = await pb.collection('crm_contacts').update<CrmContact>(contact.id, {
    stage: newStage,
    last_interaction_at: new Date().toISOString(),
  })

  // 1. Registra interação
  try {
    await createCrmInteraction({
      contact: contact.id,
      type: 'mudanca_estagio',
      title: `Estágio alterado: ${CRM_STAGE_LABELS[oldStage]} → ${CRM_STAGE_LABELS[newStage]}`,
      description: `Atualização de funil realizada para o contato ${contact.name}${contact.company ? ` (${contact.company})` : ''}.`,
      interaction_date: new Date().toISOString(),
      metadata: { old_stage: oldStage, new_stage: newStage },
    })
  } catch (err) {
    console.warn('Erro ao registrar interação de mudança de estágio:', err)
  }

  // 2. Automação de Funil: gera uma tarefa no calendário de Datas Próximas
  try {
    await triggerStageAutomationCalendarTask(updated, oldStage, newStage, userId)
  } catch (err) {
    console.warn('Erro na automação de calendário do CRM:', err)
  }

  return updated
}

/**
 * Cria tarefa/agendamento no calendário com data próxima (2 dias à frente para follow-up)
 */
export async function triggerStageAutomationCalendarTask(
  contact: CrmContact,
  oldStage: CrmStage,
  newStage: CrmStage,
  userId?: string,
): Promise<void> {
  const currentUserId = userId || pb.authStore.record?.id
  if (!currentUserId) return

  // Data de follow-up: 2 dias à frente às 10:00 da manhã
  const followUpDate = new Date()
  followUpDate.setDate(followUpDate.getDate() + 2)
  followUpDate.setHours(10, 0, 0, 0)
  const scheduledIso = followUpDate.toISOString()

  const stageDescriptions: Record<CrmStage, string> = {
    lead_captado: `Qualificar lead ${contact.name} e agendar primeiro contato.`,
    contato_feito: `Enviar material institucional ou proposta para ${contact.name}.`,
    proposta_enviada: `Follow-up de proposta comercial enviada para ${contact.name} (${contact.company || 'Pessoa Física'}).`,
    negociacao: `Alinhar detalhes de contrato e fechamento com ${contact.name}.`,
    fechado_ganho: `Iniciar processo de Onboarding e boas-vindas para o cliente ${contact.name}!`,
    fechado_perdido: `Registrar motivo de perda e agendar reaquecimento de ${contact.name} em 60 dias.`,
  }

  const taskTitle = `[CRM Follow-up] ${contact.name} — ${CRM_STAGE_LABELS[newStage]}`
  const taskCaption = `${stageDescriptions[newStage] || 'Acompanhar oportunidade no CRM.'}\n\nContato: ${contact.phone || 'Sem telefone'} | ${contact.email || 'Sem email'}\nEmpresa: ${contact.company || 'N/A'}\nValor estimado: R$ ${(contact.value || 0).toLocaleString('pt-BR')}`

  // Cria um post tipo 'tarefa/followup' no sistema de posts
  const postRecord = await createPost({
    user: currentUserId,
    content: taskTitle,
    caption: taskCaption,
    platform: 'Instagram',
    status: 'scheduled',
    scheduled_date: scheduledIso,
    tags: JSON.stringify(['crm', 'followup', newStage]),
    target_networks: JSON.stringify(['instagram']),
  })

  // Vincula em scheduled_posts para aparecer nas visões de Próximas Datas / Calendário
  if (postRecord?.id) {
    await createScheduledPost({
      user: currentUserId,
      post: postRecord.id,
      scheduled_at: scheduledIso,
      status: 'pending',
      target_network: 'instagram',
    })
  }
}

export async function createCrmInteraction(data: CrmInteractionFormData): Promise<CrmInteraction> {
  const currentUserId = pb.authStore.record?.id
  const payload: Record<string, unknown> = {
    ...data,
    user: currentUserId || undefined,
    interaction_date: data.interaction_date || new Date().toISOString(),
    metadata: data.metadata || {},
  }
  return await pb.collection('crm_interactions').create<CrmInteraction>(payload)
}

// ==========================================
// MÉTRICAS E KPI'S DO FUNIL DO CRM
// ==========================================

export interface CrmFunnelKpis {
  totalContacts: number
  totalPipelineValue: number
  wonValue: number
  inNegotiationValue: number
  averageTicket: number
  conversionRate: number
  stageCounts: Record<CrmStage, number>
  stageValues: Record<CrmStage, number>
  sourceCounts: Record<string, number>
}

export function calculateCrmKpis(contacts: CrmContact[]): CrmFunnelKpis {
  const initialStages: Record<CrmStage, number> = {
    lead_captado: 0,
    contato_feito: 0,
    proposta_enviada: 0,
    negociacao: 0,
    fechado_ganho: 0,
    fechado_perdido: 0,
  }

  const initialValues: Record<CrmStage, number> = {
    lead_captado: 0,
    contato_feito: 0,
    proposta_enviada: 0,
    negociacao: 0,
    fechado_ganho: 0,
    fechado_perdido: 0,
  }

  const sourceCounts: Record<string, number> = {}

  let totalPipelineValue = 0
  let wonValue = 0
  let inNegotiationValue = 0
  let wonCount = 0

  contacts.forEach((c) => {
    const stage = c.stage || 'lead_captado'
    const val = Number(c.value) || 0

    if (initialStages[stage] !== undefined) {
      initialStages[stage] += 1
      initialValues[stage] += val
    }

    totalPipelineValue += val

    if (stage === 'fechado_ganho') {
      wonCount += 1
      wonValue += val
    }

    if (stage === 'negociacao' || stage === 'proposta_enviada') {
      inNegotiationValue += val
    }

    const src = c.source || 'Outro'
    sourceCounts[src] = (sourceCounts[src] || 0) + 1
  })

  const totalContacts = contacts.length
  const conversionRate =
    totalContacts > 0 ? Number(((wonCount / totalContacts) * 100).toFixed(1)) : 0
  const averageTicket =
    wonCount > 0
      ? Math.round(wonValue / wonCount)
      : totalContacts > 0
        ? Math.round(totalPipelineValue / totalContacts)
        : 0

  return {
    totalContacts,
    totalPipelineValue,
    wonValue,
    inNegotiationValue,
    averageTicket,
    conversionRate,
    stageCounts: initialStages,
    stageValues: initialValues,
    sourceCounts,
  }
}

// ==========================================
// EXPORTAÇÃO CSV / EXCEL COM UTF-8 BOM
// ==========================================

export function exportContactsToCSV(contacts: CrmContact[], filename?: string): void {
  const headers = [
    'ID',
    'Nome',
    'Empresa',
    'Email',
    'Telefone',
    'Origem',
    'Estágio',
    'Valor (R$)',
    'Prioridade',
    'Responsável',
    'Tags',
    'Campos Customizados',
    'Notas',
    'Criado em',
  ]

  const rows = contacts.map((c) => {
    const customFieldsStr = c.custom_fields
      ? typeof c.custom_fields === 'object'
        ? JSON.stringify(c.custom_fields)
        : String(c.custom_fields)
      : ''
    const tagsStr = Array.isArray(c.tags) ? c.tags.join('; ') : c.tags || ''

    return [
      `"${c.id || ''}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${c.source || ''}"`,
      `"${CRM_STAGE_LABELS[c.stage] || c.stage}"`,
      c.value || 0,
      `"${c.priority || 'media'}"`,
      `"${(c.responsible || '').replace(/"/g, '""')}"`,
      `"${tagsStr.replace(/"/g, '""')}"`,
      `"${customFieldsStr.replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`,
      `"${c.created ? new Date(c.created).toLocaleString('pt-BR') : ''}"`,
    ]
  })

  // UTF-8 BOM para garantir acentuação correta no Microsoft Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    filename || `crm_contatos_${new Date().toISOString().slice(0, 10)}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
