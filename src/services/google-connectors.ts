import { execute } from '@/lib/skipConnectors'

export interface DriveItem {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  webViewLink?: string
  size?: string
}

export interface GmailMessageItem {
  id: string
  threadId?: string
  subject: string
  snippet: string
  from?: string
  date?: string
  bodyText?: string
}

export type SupportedToolkit =
  | 'gmail'
  | 'googledrive'
  | 'googledocs'
  | 'googlesheets'
  | 'outlook'
  | 'one_drive'
  | 'share_point'

export interface ImportedContextItem {
  id: string
  source:
    | 'googledrive'
    | 'gmail'
    | 'googledocs'
    | 'googlesheets'
    | 'outlook'
    | 'one_drive'
    | 'share_point'
    | 'manual'
    | 'pedagogico'
  title: string
  subtitle?: string
  content: string
  origin?: string
  type?:
    | 'drive'
    | 'gmail'
    | 'docs'
    | 'sheets'
    | 'outlook'
    | 'onedrive'
    | 'sharepoint'
    | 'manual'
    | 'pedagogico'
  metadata?: Record<string, any>
  createdAt: string
}

export function getConnectedStatus(toolkit: SupportedToolkit): boolean {
  try {
    const raw = localStorage.getItem(`skip_connector_${toolkit}_status`)
    return raw === 'connected'
  } catch {
    return false
  }
}

/**
 * Busca arquivos no Google Drive do usuário logado
 */
export async function searchUserDriveFiles(query = '', pageSize = 15): Promise<DriveItem[]> {
  try {
    const qParts: string[] = ['trashed = false']
    if (query.trim()) {
      qParts.push(`name contains '${query.replace(/'/g, "\\'")}'`)
    }
    const q = qParts.join(' and ')

    const res = await execute('GOOGLEDRIVE_FIND_FILE', {
      q,
      pageSize,
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink, size)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    if (res.successful && res.data) {
      const data = res.data as any
      const rawFiles = data.files || data.data?.files || (Array.isArray(data) ? data : [])
      if (Array.isArray(rawFiles)) {
        return rawFiles.map((f: any) => ({
          id: f.id || f.fileId || '',
          name: f.name || f.title || 'Arquivo sem nome',
          mimeType: f.mimeType || 'application/octet-stream',
          modifiedTime: f.modifiedTime,
          webViewLink: f.webViewLink,
          size: f.size,
        }))
      }
    }
  } catch (err) {
    console.warn('[google-connectors] Erro ao listar arquivos do Drive:', err)
  }
  return []
}

/**
 * Lê o conteúdo em texto de um arquivo do Google Drive (Doc ou export)
 */
export async function readUserDriveFileContent(
  fileId: string,
  mimeType?: string,
): Promise<{ text: string; error?: string }> {
  try {
    // Se for Google Doc, podemos exportar como texto puro ou ler via Docs API
    if (mimeType?.includes('google-apps.document')) {
      const docRes = await execute('GOOGLEDOCS_GET_DOCUMENT_PLAINTEXT', {
        document_id: fileId,
      })
      if (docRes.successful && docRes.data) {
        const text =
          (docRes.data as any).text ||
          (docRes.data as any).content ||
          (typeof docRes.data === 'string' ? docRes.data : JSON.stringify(docRes.data))
        return { text: String(text).trim() }
      }
    }

    // Se for planilha Google Sheets, lê os dados principais
    if (mimeType?.includes('google-apps.spreadsheet')) {
      const sheetsRes = await execute('GOOGLESHEETS_BATCH_GET', {
        spreadsheet_id: fileId,
        ranges: ['A1:Z50'],
      })
      if (sheetsRes.successful && sheetsRes.data) {
        const valueRanges = (sheetsRes.data as any).valueRanges || []
        const rows = valueRanges[0]?.values || []
        const text = rows.map((r: any[]) => r.join(' | ')).join('\n')
        return { text: text || 'Planilha vazia ou sem dados nas primeiras células.' }
      }
    }

    // Download genérico de texto
    const res = await execute('GOOGLEDRIVE_DOWNLOAD_FILE', {
      fileId,
      mime_type: 'text/plain',
    })

    if (res.successful && res.data) {
      const d = res.data as any
      const content =
        d.downloaded_file_content ||
        d.content ||
        (typeof d === 'string' ? d : JSON.stringify(d, null, 2))
      return { text: String(content).slice(0, 8000) }
    }

    return {
      text: '',
      error: res.error || 'Não foi possível extrair o texto direto deste tipo de arquivo.',
    }
  } catch (err: any) {
    return { text: '', error: err?.message || 'Falha ao ler arquivo.' }
  }
}

/**
 * Lista mensagens recentes do Gmail do usuário logado
 */
export interface GmailSearchOptions {
  query?: string
  sender?: string
  period?: 'all' | '7d' | '30d' | '365d'
  sortBy?: 'date_desc' | 'date_asc' | 'relevance'
  maxResults?: number
}

/**
 * Lista mensagens recentes do Gmail com filtros avançados:
 * busca por assunto/corpo, filtro de remetente, período e ordenação.
 */
export async function searchUserGmailMessages(
  optionsOrQuery: string | GmailSearchOptions = '',
  legacyMaxResults = 15,
): Promise<GmailMessageItem[]> {
  try {
    const opts: GmailSearchOptions =
      typeof optionsOrQuery === 'string'
        ? { query: optionsOrQuery, maxResults: legacyMaxResults }
        : optionsOrQuery

    const rawQuery = opts.query?.trim() || ''
    const sender = opts.sender?.trim() || ''
    const maxResults = opts.maxResults || 20

    // Monta query combinada do Gmail (ex: "label:INBOX from:maria newer_than:7d")
    const queryParts: string[] = []
    if (rawQuery) {
      queryParts.push(rawQuery)
    } else {
      queryParts.push('label:INBOX')
    }

    if (sender) {
      queryParts.push(`from:${sender}`)
    }

    if (opts.period && opts.period !== 'all') {
      const days = opts.period === '7d' ? '7d' : opts.period === '30d' ? '30d' : '365d'
      queryParts.push(`newer_than:${days}`)
    }

    const fullQuery = queryParts.join(' ')

    const res = await execute('GMAIL_FETCH_EMAILS', {
      query: fullQuery,
      max_results: maxResults,
      include_payload: true,
      verbose: true,
    })

    if (res.successful && res.data) {
      const data = res.data as any
      const rawMessages =
        data.messages || data.emails || data.data?.messages || (Array.isArray(data) ? data : [])

      if (Array.isArray(rawMessages)) {
        let list: GmailMessageItem[] = rawMessages.map((m: any) => {
          // Extrai assunto dos headers se disponível
          let subject = m.subject || ''
          let from = m.from || ''
          let date = m.date || ''

          if (!subject && m.payload?.headers) {
            const hSub = m.payload.headers.find((h: any) => h.name?.toLowerCase() === 'subject')
            if (hSub) subject = hSub.value
            const hFrom = m.payload.headers.find((h: any) => h.name?.toLowerCase() === 'from')
            if (hFrom) from = hFrom.value
            const hDate = m.payload.headers.find((h: any) => h.name?.toLowerCase() === 'date')
            if (hDate) date = hDate.value
          }

          return {
            id: m.id || m.message_id || '',
            threadId: m.threadId || m.thread_id,
            subject: subject || m.snippet?.slice(0, 40) || 'Sem assunto',
            snippet: m.snippet || '',
            from: from || 'Remetente Gmail',
            date: date || new Date().toISOString(),
            bodyText: m.body || m.text || m.snippet || '',
          }
        })

        // Filtro adicional de segurança client-side caso a busca retorne resultados mais amplos
        if (sender) {
          const s = sender.toLowerCase()
          list = list.filter((m) => (m.from || '').toLowerCase().includes(s))
        }

        // Ordenação
        if (opts.sortBy === 'date_asc') {
          list.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
        } else if (opts.sortBy === 'date_desc') {
          list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
        }

        return list
      }
    }
  } catch (err) {
    console.warn('[google-connectors] Erro ao listar e-mails do Gmail:', err)
  }
  return []
}

/**
 * Lê o corpo completo de um e-mail específico pelo ID
 */
export async function fetchUserGmailMessage(
  messageId: string,
): Promise<{ subject: string; body: string; from?: string; date?: string; error?: string }> {
  try {
    const res = await execute('GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID', {
      message_id: messageId,
      format: 'full',
    })

    if (res.successful && res.data) {
      const m = res.data as any
      let subject = m.subject || ''
      let from = m.from || ''
      let date = m.date || ''

      if (m.payload?.headers) {
        const hSub = m.payload.headers.find((h: any) => h.name?.toLowerCase() === 'subject')
        if (hSub) subject = hSub.value
        const hFrom = m.payload.headers.find((h: any) => h.name?.toLowerCase() === 'from')
        if (hFrom) from = hFrom.value
        const hDate = m.payload.headers.find((h: any) => h.name?.toLowerCase() === 'date')
        if (hDate) date = hDate.value
      }

      const body = m.body || m.snippet || m.text || 'Corpo da mensagem indisponível em texto puro.'
      return {
        subject: subject || 'E-mail importado',
        body: String(body).slice(0, 8000),
        from,
        date,
      }
    }
    return { subject: '', body: '', error: res.error || 'Mensagem não encontrada.' }
  } catch (err: any) {
    return { subject: '', body: '', error: err?.message || 'Falha ao buscar mensagem.' }
  }
}

/**
 * Lê documento do Google Docs pelo ID
 */
export async function readUserGoogleDoc(
  documentId: string,
): Promise<{ title: string; content: string; error?: string }> {
  try {
    const plainRes = await execute('GOOGLEDOCS_GET_DOCUMENT_PLAINTEXT', {
      document_id: documentId,
    })

    if (plainRes.successful && plainRes.data) {
      const data = plainRes.data as any
      const content =
        typeof data === 'string' ? data : data.text || data.content || JSON.stringify(data, null, 2)
      return {
        title: data.title || 'Documento Google Docs',
        content: String(content).slice(0, 10000),
      }
    }

    const docRes = await execute('GOOGLEDOCS_GET_DOCUMENT_BY_ID', {
      id: documentId,
    })
    if (docRes.successful && docRes.data) {
      const data = docRes.data as any
      return {
        title: data.title || 'Documento Google Docs',
        content: JSON.stringify(data.body?.content || data, null, 2).slice(0, 10000),
      }
    }

    return { title: '', content: '', error: plainRes.error || docRes.error || 'Falha ao ler Doc.' }
  } catch (err: any) {
    return { title: '', content: '', error: err?.message || 'Erro ao carregar documento.' }
  }
}

/**
 * Lê planilha do Google Sheets pelo ID e intervalo
 */
export async function readUserGoogleSheet(
  spreadsheetId: string,
  range = 'A1:Z60',
): Promise<{ title?: string; rowsText: string; error?: string }> {
  try {
    const infoRes = await execute('GOOGLESHEETS_GET_SPREADSHEET_INFO', {
      spreadsheet_id: spreadsheetId,
    })
    const sheetTitle = (infoRes.data as any)?.properties?.title || 'Planilha Google Sheets'

    const valuesRes = await execute('GOOGLESHEETS_BATCH_GET', {
      spreadsheet_id: spreadsheetId,
      ranges: [range],
    })

    if (valuesRes.successful && valuesRes.data) {
      const valueRanges = (valuesRes.data as any).valueRanges || []
      const rows = valueRanges[0]?.values || []
      const rowsText = rows.map((r: any[]) => r.join(' | ')).join('\n')
      return {
        title: sheetTitle,
        rowsText: rowsText || 'Planilha vazia ou sem linhas preenchidas no intervalo.',
      }
    }

    return {
      title: sheetTitle,
      rowsText: '',
      error: valuesRes.error || 'Falha ao ler valores da planilha.',
    }
  } catch (err: any) {
    return { rowsText: '', error: err?.message || 'Erro ao ler Google Sheet.' }
  }
}
