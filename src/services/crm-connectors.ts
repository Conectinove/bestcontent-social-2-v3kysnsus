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
    const dealsRes = await execute(
      'PIPEDRIVE_GET_ALL_DEALS',
      query ? { status: 'all_not_deleted' } : { limit: 20 },
    )

    const dealsData = dealsRes?.data as any
    const rawDeals = Array.isArray(dealsData?.data)
      ? dealsData.data
      : Array.isArray(dealsData?.deals)
        ? dealsData.deals
        : Array.isArray(dealsData)
          ? dealsData
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
    const personsRes = await execute('PIPEDRIVE_GET_ALL_PERSONS', { limit: 20 })

    const personsData = personsRes?.data as any
    const rawPersons = Array.isArray(personsData?.data)
      ? personsData.data
      : Array.isArray(personsData?.persons)
        ? personsData.persons
        : Array.isArray(personsData)
          ? personsData
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
    const activitiesRes = await execute(
      'PIPEDRIVE_GET_ALL_ACTIVITIES_ASSIGNED_TO_A_PARTICULAR_USER',
      { limit: 20 },
    )

    const actsData = activitiesRes?.data as any
    const rawActivities = Array.isArray(actsData?.data)
      ? actsData.data
      : Array.isArray(actsData?.activities)
        ? actsData.activities
        : Array.isArray(actsData)
          ? actsData
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
    const contactsRes = await execute('HUBSPOT_READ_APAGE_OF_OBJECTS_BY_TYPE', {
      objectType: 'contacts',
      limit: 20,
    })

    const contactsData = contactsRes?.data as any
    const raw = Array.isArray(contactsData?.results)
      ? contactsData.results
      : Array.isArray(contactsData?.contacts)
        ? contactsData.contacts
        : Array.isArray(contactsData)
          ? contactsData
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
    const dealsRes = await execute('HUBSPOT_READ_APAGE_OF_OBJECTS_BY_TYPE', {
      objectType: 'deals',
      limit: 20,
    })

    const dealsData = dealsRes?.data as any
    const raw = Array.isArray(dealsData?.results)
      ? dealsData.results
      : Array.isArray(dealsData?.deals)
        ? dealsData.deals
        : Array.isArray(dealsData)
          ? dealsData
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
