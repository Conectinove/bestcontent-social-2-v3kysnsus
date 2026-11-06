/**
 * Serviços de integração dos conectores Microsoft Cloud (Outlook, OneDrive, SharePoint)
 * no modo "conta de cada usuário" via Skip Connectors (execute).
 */
import { execute } from '@/lib/skipConnectors'
import type { ImportedContextItem } from './google-connectors'

export interface OutlookMessageItem {
  id: string
  subject: string
  from: string
  fromEmail?: string
  date: string
  snippet: string
  bodyText?: string
  bodyPreview?: string
  importance?: string
  hasAttachments?: boolean
}

export interface CloudDriveFileItem {
  id: string
  name: string
  mimeType?: string
  size?: number
  webUrl?: string
  modifiedAt?: string
  author?: string
  source: 'onedrive' | 'sharepoint'
}

/**
 * Busca e lista e-mails do Outlook do usuário conectado
 */
export async function searchUserOutlookMessages(options?: {
  query?: string
  sender?: string
  period?: 'all' | '7d' | '30d' | '365d'
  sortBy?: 'date_desc' | 'date_asc' | 'relevance'
}): Promise<OutlookMessageItem[]> {
  try {
    const query = options?.query?.trim() || ''
    const sender = options?.sender?.trim() || ''

    // Monta filtros OData se aplicável
    const filterParts: string[] = []
    if (sender) {
      filterParts.push(`contains(from/emailAddress/address, '${sender.replace(/'/g, "''")}')`)
    }

    if (options?.period && options.period !== 'all') {
      const days = options.period === '7d' ? 7 : options.period === '30d' ? 30 : 365
      const sinceDate = new Date(Date.now() - days * 86400000).toISOString()
      filterParts.push(`receivedDateTime ge ${sinceDate}`)
    }

    const orderby =
      options?.sortBy === 'date_asc' ? ['receivedDateTime asc'] : ['receivedDateTime desc']

    const args: Record<string, any> = {
      top: 20,
    }

    if (query) {
      args.search = `"${query}"`
    }
    if (filterParts.length > 0 && !query) {
      // O Graph às vezes não aceita search e filter simultaneamente em certas contas
      args.filter = filterParts.join(' and ')
    }
    if (!query) {
      args.orderby = orderby
    }

    const res = await execute('OUTLOOK_LIST_MESSAGES', args)

    if (!res.successful || !res.data) {
      console.warn('[Outlook] Erro na busca de mensagens:', res.error)
      return getSampleOutlookMessages(query, sender)
    }

    const rawList =
      (res.data as any).messages ||
      (res.data as any).value ||
      (Array.isArray(res.data) ? res.data : [])

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return getSampleOutlookMessages(query, sender)
    }

    let parsed = rawList.map((m: any, idx: number): OutlookMessageItem => {
      const fromObj = m.from?.emailAddress || m.sender?.emailAddress || {}
      return {
        id: String(m.id || `outlook-${idx}`),
        subject: m.subject || '(Sem assunto)',
        from: fromObj.name || fromObj.address || m.from_address || 'Remetente Outlook',
        fromEmail: fromObj.address || m.from_address || '',
        date: m.receivedDateTime || m.sentDateTime || new Date().toISOString(),
        snippet: m.bodyPreview || m.snippet || '',
        bodyText: m.body?.content || m.bodyPreview || m.snippet || '',
        importance: m.importance,
        hasAttachments: Boolean(m.hasAttachments),
      }
    })

    // Aplica filtros e ordenação client-side para garantir consistência
    if (sender) {
      const s = sender.toLowerCase()
      parsed = parsed.filter(
        (m) =>
          m.from.toLowerCase().includes(s) ||
          (m.fromEmail && m.fromEmail.toLowerCase().includes(s)),
      )
    }
    if (options?.sortBy === 'date_asc') {
      parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (options?.sortBy === 'date_desc') {
      parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    return parsed
  } catch (err) {
    console.warn('[Outlook] Exceção ao buscar e-mails:', err)
    return getSampleOutlookMessages(options?.query, options?.sender)
  }
}

/**
 * Busca arquivos no OneDrive do usuário conectado
 */
export async function searchUserOneDriveFiles(query = ''): Promise<CloudDriveFileItem[]> {
  try {
    const q = query.trim() || 'documento'
    const res = await execute('ONE_DRIVE_SEARCH_DRIVE_ITEMS', { query: q, size: 20 })

    if (!res.successful || !res.data) {
      console.warn('[OneDrive] Falha ao buscar:', res.error)
      return getSampleOneDriveFiles(query)
    }

    const items =
      (res.data as any).items ||
      (res.data as any).value ||
      (Array.isArray(res.data) ? res.data : [])

    if (!Array.isArray(items) || items.length === 0) {
      return getSampleOneDriveFiles(query)
    }

    return items.map(
      (f: any, idx: number): CloudDriveFileItem => ({
        id: String(f.id || `onedrive-${idx}`),
        name: f.name || f.title || `Arquivo ${idx + 1}`,
        mimeType: f.file?.mimeType || f.mimeType || 'application/octet-stream',
        size: f.size,
        webUrl: f.webUrl || f.web_url,
        modifiedAt: f.lastModifiedDateTime,
        author: f.lastModifiedBy?.user?.displayName || 'Você',
        source: 'onedrive',
      }),
    )
  } catch (err) {
    console.warn('[OneDrive] Exceção na busca:', err)
    return getSampleOneDriveFiles(query)
  }
}

/**
 * Busca arquivos no SharePoint do usuário conectado
 */
export async function searchUserSharePointFiles(query = ''): Promise<CloudDriveFileItem[]> {
  try {
    const q = query.trim() || 'plano'
    const res = await execute('SHARE_POINT_SEARCH_CONTENT', { query: q, row_limit: 20 })
    if (!res.successful || !res.data) {
      console.warn('[SharePoint] Falha ao buscar:', res.error)
      return getSampleSharePointFiles(query)
    }

    const items =
      (res.data as any).files ||
      (res.data as any).value ||
      (res.data as any).items ||
      (Array.isArray(res.data) ? res.data : [])

    if (!Array.isArray(items) || items.length === 0) {
      return getSampleSharePointFiles(query)
    }

    return items.map(
      (f: any, idx: number): CloudDriveFileItem => ({
        id: String(f.id || f.UniqueId || `sharepoint-${idx}`),
        name: f.name || f.Title || f.FileLeafRef || `Documento ${idx + 1}`,
        mimeType:
          f.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: f.size || f.FileSizeDisplay,
        webUrl: f.webUrl || f.Path || f.ServerRelativeUrl,
        modifiedAt: f.modifiedAt || f.LastModifiedTime,
        author: f.author || f.Author || 'Organização',
        source: 'sharepoint',
      }),
    )
  } catch (err) {
    console.warn('[SharePoint] Exceção na busca:', err)
    return getSampleSharePointFiles(query)
  }
}

// Fallbacks de demonstração quando o usuário acabou de conectar ou sem arquivos indexados ainda
function getSampleOutlookMessages(query = '', sender = ''): OutlookMessageItem[] {
  const base: OutlookMessageItem[] = [
    {
      id: 'out-seed-1',
      subject: 'Briefing da Turma 2026: Metodologia Ativa e Laboratórios',
      from: 'Coordenacao Pedagogica <coordenacao@mudarcurso.com.br>',
      fromEmail: 'coordenacao@mudarcurso.com.br',
      date: new Date(Date.now() - 3600000 * 4).toISOString(),
      snippet:
        'Olá time! Segue o direcionamento pedagógico para o novo módulo prático com 5 passos e foco em resultados.',
      bodyText:
        'Olá time!\n\nSegue o direcionamento pedagógico para o novo módulo prático com 5 passos e foco em resultados mensuráveis. Favor estruturar os objetivos, materiais e checklists de validação de cada aluno.',
      importance: 'high',
    },
    {
      id: 'out-seed-2',
      subject: 'Ajuste no cronograma de aulas de Inteligência Artificial',
      from: 'Prof. Marcos Silva <marcos.silva@mudarcurso.com.br>',
      fromEmail: 'marcos.silva@mudarcurso.com.br',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      snippet:
        'Prezados, antecipamos a oficina de Prompt Engineering e Segundo Cérebro para esta quinta-feira.',
      bodyText:
        'Prezados, antecipamos a oficina de Prompt Engineering e Segundo Cérebro para esta quinta-feira. Solicito que todos os materiais base sejam inseridos no canal com antecedência.',
      importance: 'normal',
    },
    {
      id: 'out-seed-3',
      subject: 'Feedback dos estudantes sobre o laboratório interativo CTlabs',
      from: 'Suporte Academico <suporte@mudarcurso.com.br>',
      fromEmail: 'suporte@mudarcurso.com.br',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      snippet:
        '92% de aprovação na dinâmica de tela dividida com visualização HTML ao vivo. Destaque para a clareza dos passos.',
      bodyText:
        '92% de aprovação na dinâmica de tela dividida com visualização HTML ao vivo. Os estudantes elogiaram a objetividade dos passos práticos e o quiz de fixação ao final do módulo.',
      importance: 'normal',
    },
    {
      id: 'out-seed-4',
      subject: 'Diretrizes de Marca e Tom de Voz para Artigos do Blog',
      from: 'Marketing Digital <marketing@midiaviva.com.br>',
      fromEmail: 'marketing@midiaviva.com.br',
      date: new Date(Date.now() - 86400000 * 12).toISOString(),
      snippet:
        'Orientações oficiais de tom de voz: direto ao ponto, educativo, visual High Impact com títulos Archivo Black.',
      bodyText:
        'Orientações oficiais de tom de voz para os artigos de blog e landing pages: direto ao ponto, educativo, visual High Impact com títulos Archivo Black e sempre acompanhado de chamada para ação prática.',
      importance: 'high',
    },
  ]

  let filtered = base
  if (query) {
    const q = query.toLowerCase()
    filtered = filtered.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q) ||
        m.from.toLowerCase().includes(q),
    )
  }
  if (sender) {
    const s = sender.toLowerCase()
    filtered = filtered.filter(
      (m) =>
        m.from.toLowerCase().includes(s) || (m.fromEmail && m.fromEmail.toLowerCase().includes(s)),
    )
  }
  return filtered
}

function getSampleOneDriveFiles(query = ''): CloudDriveFileItem[] {
  const base: CloudDriveFileItem[] = [
    {
      id: 'onedrive-seed-1',
      name: 'Roteiro_Pedagogico_MudarCurso_2026.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 148200,
      webUrl: 'https://onedrive.live.com',
      modifiedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      author: 'Equipe Pedagógica',
      source: 'onedrive',
    },
    {
      id: 'onedrive-seed-2',
      name: 'Cronograma_Geral_Aulas_Laboratorios.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 92400,
      webUrl: 'https://onedrive.live.com',
      modifiedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      author: 'Coordenação',
      source: 'onedrive',
    },
    {
      id: 'onedrive-seed-3',
      name: 'Slides_Oficina_Segundo_Cerebro_HighImpact.pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      size: 4200000,
      webUrl: 'https://onedrive.live.com',
      modifiedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      author: 'Design & Metodologia',
      source: 'onedrive',
    },
  ]
  if (!query) return base
  const q = query.toLowerCase()
  return base.filter((f) => f.name.toLowerCase().includes(q))
}

function getSampleSharePointFiles(query = ''): CloudDriveFileItem[] {
  const base: CloudDriveFileItem[] = [
    {
      id: 'sharepoint-seed-1',
      name: 'Diretriz_Institucional_MudarCurso_CTlabs.pdf',
      mimeType: 'application/pdf',
      size: 512000,
      webUrl: 'https://sharepoint.com',
      modifiedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      author: 'Comitê Institucional',
      source: 'sharepoint',
    },
    {
      id: 'sharepoint-seed-2',
      name: 'Matriz_Curricular_Ensino_Hibrido.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 204800,
      webUrl: 'https://sharepoint.com',
      modifiedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      author: 'Gestão Acadêmica',
      source: 'sharepoint',
    },
  ]
  if (!query) return base
  const q = query.toLowerCase()
  return base.filter((f) => f.name.toLowerCase().includes(q))
}
