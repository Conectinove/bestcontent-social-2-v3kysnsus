import pb from '@/lib/pocketbase/client'

export interface CollectionSummary {
  name: string
  label: string
  description: string
  count: number
  lastCreated?: string
  canInsertManual: boolean
  fieldsOverview: string[]
}

export const MONITORED_COLLECTIONS: {
  name: string
  label: string
  description: string
  canInsertManual: boolean
  fieldsOverview: string[]
}[] = [
  {
    name: 'funnel_deals',
    label: 'Funil de Vendas (Deals)',
    description: 'Oportunidades de vendas, valores e estágios de negociação.',
    canInsertManual: true,
    fieldsOverview: ['title', 'company', 'value', 'stage', 'source', 'responsible'],
  },
  {
    name: 'students',
    label: 'Alunos Matriculados',
    description: 'Base de alunos, cursos, progresso e status de engajamento.',
    canInsertManual: true,
    fieldsOverview: ['name', 'email', 'course', 'cohort', 'status', 'progress'],
  },
  {
    name: 'posts',
    label: 'Publicações & Criativos',
    description: 'Posts editoriais, carrosséis, vídeos e legendas criadas.',
    canInsertManual: true,
    fieldsOverview: ['content', 'platform', 'status', 'scheduled_date'],
  },
  {
    name: 'brands',
    label: 'Marcas / Organizações',
    description: 'Marcas configuradas com identidade visual, cores e tom de voz.',
    canInsertManual: false,
    fieldsOverview: ['name', 'description', 'colors', 'voice_tone'],
  },
  {
    name: 'campaigns',
    label: 'Campanhas Estratégicas',
    description: 'Projetos de lançamento, autoridade e múltiplos formatos.',
    canInsertManual: false,
    fieldsOverview: ['name', 'objective', 'brand_voice', 'status'],
  },
  {
    name: 'community_topics',
    label: 'Tópicos da Comunidade',
    description: 'Discussões, dúvidas e interações do fórum de criadores.',
    canInsertManual: false,
    fieldsOverview: ['title', 'content', 'category', 'views_count'],
  },
  {
    name: 'post_metrics',
    label: 'Métricas de Performance',
    description: 'Alcance, engajamento, curtidas e salvamentos por postagem.',
    canInsertManual: false,
    fieldsOverview: ['post', 'network', 'alcance', 'engajamento'],
  },
]

export async function getCollectionsOverview(): Promise<CollectionSummary[]> {
  const summaries: CollectionSummary[] = []

  for (const col of MONITORED_COLLECTIONS) {
    try {
      // Busca a lista para contagem e último registro
      const list = await pb.collection(col.name).getList(1, 1, {
        sort: '-created',
        requestKey: null,
      })

      const count = list.totalItems
      const lastCreated = list.items.length > 0 ? list.items[0].created : undefined

      summaries.push({
        ...col,
        count,
        lastCreated,
      })
    } catch (err) {
      console.warn(`Erro ao inspecionar coleção ${col.name}:`, err)
      summaries.push({
        ...col,
        count: 0,
        lastCreated: undefined,
      })
    }
  }

  return summaries
}

export async function exportCollectionToCSV(collectionName: string): Promise<string> {
  try {
    const records = await pb.collection(collectionName).getFullList({
      sort: '-created',
      requestKey: null,
    })

    if (!records || records.length === 0) {
      return 'Nenhum registro encontrado'
    }

    // Identificar chaves públicas excluindo campos sensíveis internos
    const sample = records[0]
    const headers = Object.keys(sample).filter(
      (k) => !['collectionId', 'collectionName', 'expand'].includes(k),
    )

    const csvRows = [headers.join(';')]

    records.forEach((rec: any) => {
      const values = headers.map((header) => {
        let val = rec[header]
        if (val === null || val === undefined) return '""'
        if (typeof val === 'object') val = JSON.stringify(val)
        // Escapa aspas duplas
        const escaped = String(val).replace(/"/g, '""')
        return `"${escaped}"`
      })
      csvRows.push(values.join(';'))
    })

    return csvRows.join('\n')
  } catch (err) {
    console.error(`Erro ao exportar coleção ${collectionName} para CSV:`, err)
    throw err
  }
}

// ============================================================
// IMPORTAÇÃO CSV — posts e post_metrics
// Validação de colunas + erro claro antes de gravar no PocketBase
// ============================================================

export interface CsvImportError {
  row: number
  message: string
}

export interface CsvImportResult {
  imported: number
  errors: CsvImportError[]
  headers: string[]
}

/** Faz o parse de um CSV (delimitador ; ou ,) respeitando aspas duplas. */
export function parseCsv(raw: string): { headers: string[]; rows: string[][] } {
  const text = raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .trim()
  if (!text) throw new Error('O arquivo CSV está vazio.')

  const delimiter = text.split('\n')[0].includes(';') ? ';' : ','
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      cur.push(field)
      field = ''
    } else if (ch === '\n') {
      cur.push(field)
      field = ''
      rows.push(cur)
      cur = []
    } else {
      field += ch
    }
  }
  // Última linha (sem \n no fim)
  cur.push(field)
  rows.push(cur)

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ''))
  if (nonEmpty.length < 2)
    throw new Error('O CSV precisa de um cabeçalho e ao menos uma linha de dados.')
  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase())
  return { headers, rows: nonEmpty.slice(1) }
}

const POSTS_REQUIRED = ['content', 'platform', 'status']
const POSTS_ALLOWED = ['content', 'caption', 'platform', 'status', 'scheduled_date', 'media_url']
const METRICS_REQUIRED = ['post', 'network']
const METRICS_ALLOWED = [
  'post',
  'network',
  'impressions',
  'reach',
  'likes',
  'comments',
  'shares',
  'saves',
  'engagement_rate',
]

function validateHeaders(
  headers: string[],
  required: string[],
  allowed: string[],
): CsvImportError[] {
  const errors: CsvImportError[] = []
  const missing = required.filter((r) => !headers.includes(r))
  if (missing.length > 0) {
    errors.push({
      row: 0,
      message: `Colunas obrigatórias ausentes: ${missing.join(', ')}. Colunas aceitas: ${allowed.join(', ')}.`,
    })
  }
  return errors
}

function coerceNumber(value: string): number {
  const n = Number(
    String(value ?? '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, ''),
  )
  return Number.isFinite(n) ? n : 0
}

/**
 * Importa registros de um CSV para posts ou post_metrics.
 * Valida colunas e conteúdo ANTES de gravar; nunca grava parcialmente sem avisar.
 */
export async function importCsvToCollection(
  collectionName: 'posts' | 'post_metrics',
  raw: string,
): Promise<CsvImportResult> {
  const { headers, rows } = parseCsv(raw)

  const isPosts = collectionName === 'posts'
  const required = isPosts ? POSTS_REQUIRED : METRICS_REQUIRED
  const allowed = isPosts ? POSTS_ALLOWED : METRICS_ALLOWED

  const errors = validateHeaders(headers, required, allowed)
  if (errors.length > 0) {
    throw Object.assign(new Error(errors[0].message), { importErrors: errors })
  }

  const idx = (h: string) => headers.indexOf(h)
  const get = (row: string[], h: string) => (idx(h) >= 0 ? (row[idx(h)] ?? '').trim() : '')

  let imported = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // +2: cabeçalho + base 1
    try {
      if (isPosts) {
        const content = get(row, 'content')
        const platform = get(row, 'platform').toLowerCase()
        const status = get(row, 'status').toLowerCase() || 'draft'
        if (!content) throw new Error('Coluna "content" vazia.')
        if (
          ![
            'instagram',
            'tiktok',
            'linkedin',
            'youtube',
            'facebook',
            'x',
            'pinterest',
            'threads',
            'google_business',
            'substack',
          ].includes(platform)
        ) {
          throw new Error(`Rede inválida: "${platform}".`)
        }
        if (!['draft', 'scheduled', 'published', 'approved', 'em_revisao'].includes(status)) {
          throw new Error(`Status inválido: "${status}".`)
        }
        const payload: Record<string, unknown> = { content, platform, status }
        const caption = get(row, 'caption')
        if (caption) payload.caption = caption
        const scheduled = get(row, 'scheduled_date')
        if (scheduled) payload.scheduled_date = scheduled
        const mediaUrl = get(row, 'media_url')
        if (mediaUrl) payload.media_url = mediaUrl
        await pb.collection('posts').create(payload)
      } else {
        const post = get(row, 'post')
        const network = get(row, 'network').toLowerCase()
        if (!post) throw new Error('Coluna "post" (id do post) vazia.')
        if (!network) throw new Error('Coluna "network" vazia.')
        // Verifica se o post referenciado existe
        try {
          await pb.collection('posts').getOne(post)
        } catch {
          throw new Error(`Post "${post}" não encontrado no banco.`)
        }
        const payload: Record<string, unknown> = { post, network }
        for (const key of ['impressions', 'reach', 'likes', 'comments', 'shares', 'saves']) {
          const v = get(row, key)
          if (v !== '') payload[key] = coerceNumber(v)
        }
        const er = get(row, 'engagement_rate')
        if (er !== '') payload.engagement_rate = coerceNumber(er)
        await pb.collection('post_metrics').create(payload)
      }
      imported++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido na linha.'
      errors.push({ row: rowNumber, message: msg })
    }
  }

  return { imported, errors, headers }
}
