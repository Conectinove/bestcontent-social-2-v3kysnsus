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
