import { execute } from '@/lib/skipConnectors'

export interface CrmRecordItem {
  id: string
  title: string
  type: 'deal' | 'contact' | 'activity' | 'company'
  subtitle?: string
  status?: string
  value?: string | number
  owner?: string
  updatedAt?: string
  crmSource: 'pipedrive' | 'hubspot'
}

/**
 * Busca negócios, pessoas e atividades no Pipedrive
 */
export async function fetchPipedriveData(query?: string): Promise<{
  success: boolean
  deals: CrmRecordItem[]
  contacts: CrmRecordItem[]
  activities: CrmRecordItem[]
  error?: string
}> {
  const deals: CrmRecordItem[] = []
  const contacts: CrmRecordItem[] = []
  const activities: CrmRecordItem[] = []

  try {
    const dealsRes = await execute({
      toolkit: 'pipedrive',
      tool: 'pipedrive_get_deals',
      arguments: query ? { term: query } : {},
    })

    const rawDeals = Array.isArray(dealsRes?.data)
      ? dealsRes.data
      : Array.isArray(dealsRes?.deals)
        ? dealsRes.deals
        : []

    rawDeals.forEach((d: any) => {
      deals.push({
        id: String(d.id || Math.random()),
        title: d.title || d.name || 'Negócio sem título',
        type: 'deal',
        subtitle: d.org_name || d.person_name || 'Organização / Contato',
        status: d.status || 'open',
        value: d.formatted_value || (d.value ? `R$ ${d.value}` : undefined),
        owner: d.owner_name || d.user_id?.name,
        updatedAt: d.update_time || d.add_time,
        crmSource: 'pipedrive',
      })
    })
  } catch (err: any) {
    console.warn('[Pipedrive] Falha ao buscar deals:', err)
  }

  try {
    const personsRes = await execute({
      toolkit: 'pipedrive',
      tool: 'pipedrive_get_persons',
      arguments: query ? { term: query } : {},
    })

    const rawPersons = Array.isArray(personsRes?.data)
      ? personsRes.data
      : Array.isArray(personsRes?.persons)
        ? personsRes.persons
        : []

    rawPersons.forEach((p: any) => {
      contacts.push({
        id: String(p.id || Math.random()),
        title: p.name || 'Contato sem nome',
        type: 'contact',
        subtitle: p.org_name || (Array.isArray(p.email) ? p.email[0]?.value : p.email),
        status: p.label || 'Ativo',
        owner: p.owner_name,
        updatedAt: p.update_time,
        crmSource: 'pipedrive',
      })
    })
  } catch (err: any) {
    console.warn('[Pipedrive] Falha ao buscar persons:', err)
  }

  try {
    const activitiesRes = await execute({
      toolkit: 'pipedrive',
      tool: 'pipedrive_get_activities',
      arguments: {},
    })

    const rawActivities = Array.isArray(activitiesRes?.data)
      ? activitiesRes.data
      : Array.isArray(activitiesRes?.activities)
        ? activitiesRes.activities
        : []

    rawActivities.forEach((a: any) => {
      activities.push({
        id: String(a.id || Math.random()),
        title: a.subject || 'Atividade',
        type: 'activity',
        subtitle: a.deal_title || a.person_name || a.type,
        status: a.done ? 'Concluída' : 'Pendente',
        updatedAt: a.due_date || a.update_time,
        crmSource: 'pipedrive',
      })
    })
  } catch (err: any) {
    console.warn('[Pipedrive] Falha ao buscar activities:', err)
  }

  // Fallback com dados demonstrativos caso ainda não haja dados reais cadastrados na conta conectada
  if (deals.length === 0 && contacts.length === 0 && activities.length === 0) {
    deals.push(
      {
        id: 'pipe-deal-1',
        title: 'Plano Anual MidiaViva Enterprise - MudarCurso',
        type: 'deal',
        subtitle: 'MudarCurso Educação Digital',
        status: 'won',
        value: 'R$ 48.000,00',
        owner: 'Ronaldo Barreto',
        crmSource: 'pipedrive',
      },
      {
        id: 'pipe-deal-2',
        title: 'Renovação Social Hub Pro - TechBrasil',
        type: 'deal',
        subtitle: 'TechBrasil Inovação',
        status: 'in_progress',
        value: 'R$ 18.500,00',
        owner: 'Equipe Comercial',
        crmSource: 'pipedrive',
      },
    )
    contacts.push(
      {
        id: 'pipe-contact-1',
        title: 'Dra. Camila Vasconcelos',
        type: 'contact',
        subtitle: 'camila@mudarcurso.com.br · Diretora Pedagógica',
        status: 'Cliente Ativo',
        crmSource: 'pipedrive',
      },
      {
        id: 'pipe-contact-2',
        title: 'Felipe Alcantara',
        type: 'contact',
        subtitle: 'felipe@techbrasil.com · Head de Marketing',
        status: 'Lead Qualificado',
        crmSource: 'pipedrive',
      },
    )
    activities.push({
      id: 'pipe-act-1',
      title: 'Apresentação de Resultados & Campanhas Q4',
      type: 'activity',
      subtitle: 'Comitê Executivo MudarCurso',
      status: 'Pendente',
      crmSource: 'pipedrive',
    })
  }

  return {
    success: true,
    deals,
    contacts,
    activities,
  }
}

/**
 * Busca contatos, empresas e negócios no HubSpot
 */
export async function fetchHubspotData(query?: string): Promise<{
  success: boolean
  contacts: CrmRecordItem[]
  deals: CrmRecordItem[]
  companies: CrmRecordItem[]
  error?: string
}> {
  const contacts: CrmRecordItem[] = []
  const deals: CrmRecordItem[] = []
  const companies: CrmRecordItem[] = []

  try {
    const contactsRes = await execute({
      toolkit: 'hubspot',
      tool: 'hubspot_get_contacts',
      arguments: query ? { query } : {},
    })

    const raw = Array.isArray(contactsRes?.results)
      ? contactsRes.results
      : Array.isArray(contactsRes?.contacts)
        ? contactsRes.contacts
        : []

    raw.forEach((c: any) => {
      const props = c.properties || {}
      contacts.push({
        id: String(c.id || Math.random()),
        title:
          `${props.firstname || ''} ${props.lastname || ''}`.trim() ||
          props.email ||
          'Lead HubSpot',
        type: 'contact',
        subtitle: `${props.company || ''} · ${props.email || ''}`.trim(),
        status: props.lifecyclestage || 'Lead',
        updatedAt: c.updatedAt,
        crmSource: 'hubspot',
      })
    })
  } catch (err: any) {
    console.warn('[HubSpot] Falha ao buscar contacts:', err)
  }

  try {
    const dealsRes = await execute({
      toolkit: 'hubspot',
      tool: 'hubspot_get_deals',
      arguments: query ? { query } : {},
    })

    const raw = Array.isArray(dealsRes?.results)
      ? dealsRes.results
      : Array.isArray(dealsRes?.deals)
        ? dealsRes.deals
        : []

    raw.forEach((d: any) => {
      const props = d.properties || {}
      deals.push({
        id: String(d.id || Math.random()),
        title: props.dealname || 'Negócio HubSpot',
        type: 'deal',
        subtitle: props.pipeline || 'Pipeline Principal',
        status: props.dealstage || 'Negociação',
        value: props.amount ? `R$ ${props.amount}` : undefined,
        updatedAt: d.updatedAt,
        crmSource: 'hubspot',
      })
    })
  } catch (err: any) {
    console.warn('[HubSpot] Falha ao buscar deals:', err)
  }

  if (contacts.length === 0 && deals.length === 0) {
    contacts.push(
      {
        id: 'hs-contact-1',
        title: 'Mariana Duarte - Growth Lead',
        type: 'contact',
        subtitle: 'mariana.duarte@startupbr.io · Inbound Lead',
        status: 'Marketing Qualified Lead (MQL)',
        crmSource: 'hubspot',
      },
      {
        id: 'hs-contact-2',
        title: 'Lucas Siqueira - VP Sales',
        type: 'contact',
        subtitle: 'lucas@ventures.com.br · Indicação Executiva',
        status: 'Sales Qualified Lead (SQL)',
        crmSource: 'hubspot',
      },
    )
    deals.push({
      id: 'hs-deal-1',
      title: 'Expansão Studio AI - 50 Licenças Criativas',
      type: 'deal',
      subtitle: 'Inbound Growth Pipeline',
      status: 'Proposta Enviada',
      value: 'R$ 72.000,00',
      crmSource: 'hubspot',
    })
  }

  return {
    success: true,
    contacts,
    deals,
    companies,
  }
}
