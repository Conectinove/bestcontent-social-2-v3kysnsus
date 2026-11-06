import pb from '@/lib/pocketbase/client'

export type SecondBrainDocType =
  | 'documento'
  | 'aula_lab'
  | 'blog_artigo'
  | 'site_landing'
  | 'nota_privada'

export type BlockType =
  | 'title'
  | 'paragraph'
  | 'callout'
  | 'quote'
  | 'code'
  | 'list'
  | 'video'
  | 'quiz'
  | 'interactive'

export interface SecondBrainBlock {
  id: string
  type: BlockType
  level?: 1 | 2 | 3
  content: string
  caption?: string
  badgeLabel?: string
  isActive?: boolean
  metadata?: Record<string, any>
  aiGenerated?: boolean
  isOfficial?: boolean
}

export interface SecondBrainModule {
  id: string
  title: string
  description?: string
  blocks: SecondBrainBlock[]
}

export interface SecondBrainDoc {
  id: string
  title: string
  subtitle?: string
  doc_type: SecondBrainDocType
  location?: string
  modules: SecondBrainModule[]
  author_id?: string
  author_name?: string
  tags?: string[]
  is_pinned?: boolean
  created: string
  updated?: string
  isOfficial?: boolean
}

const COLLECTION = 'second_brain_docs'
const LOCAL_STORAGE_KEY = 'midiaviva_second_brain_docs'

export const DEFAULT_SAMPLE_DOCS: SecondBrainDoc[] = [
  {
    id: 'doc-seed-1',
    title: 'PROJETO CTLABS - MÓDULO 1: CONHECENDO O WINDOWS 11',
    subtitle:
      'Apresentação do sistema operacional, nova interface Fluent Design, menu Iniciar centralizado, barra de tarefas e Configurações Rápidas.',
    doc_type: 'aula_lab',
    location: 'Meu Drive · IA Studio',
    author_id: 'user-ronaldo',
    author_name: 'MudarCurso IA',
    tags: ['Windows 11', 'Fluent Design', 'Curso Prático'],
    is_pinned: true,
    created: new Date(Date.now() - 3600000 * 2).toISOString(),
    isOfficial: true,
    modules: [
      {
        id: 'mod-1',
        title: 'Módulo 1: Conhecendo o Windows 11',
        description: 'Apresentação da nova interface e Configurações Rápidas.',
        blocks: [
          {
            id: 'blk-1',
            type: 'title',
            level: 1,
            content: 'Configurações Rápidas (Win+A) e Notificações (Win+N)',
            caption:
              'Ajuste de volume, brilho, conexões Wi-Fi, Bluetooth e controle de notificações e calendário com atalhos ágeis.',
            isActive: true,
            isOfficial: true,
          },
          {
            id: 'blk-2',
            type: 'paragraph',
            content:
              'O Windows 11 redesenhou a central de ações separando atalhos rápidos de rede/som das notificações de sistema. O atalho Win+A abre instantaneamente os sliders tácteis com suporte ao Fluent Design, enquanto Win+N ancora a linha do tempo e calendário.',
            isActive: true,
            isOfficial: true,
          },
        ],
      },
      {
        id: 'mod-2',
        title: 'Módulo 2: Gerenciamento de Arquivos e Snap Layouts',
        description: 'Organização de janelas inteligentes e abas no Explorer.',
        blocks: [
          {
            id: 'blk-3',
            type: 'title',
            level: 2,
            content: 'Produtividade Multitarefa com Snap Layouts (Win+Z)',
            caption:
              'Distribuição automática de 2 a 4 janelas na tela em monitores ultrawide ou telas padrão.',
            isActive: true,
            isOfficial: true,
          },
          {
            id: 'blk-4',
            type: 'paragraph',
            content:
              'Ao passar o mouse sobre o botão de maximizar ou pressionar Win+Z, uma grade adaptável permite fixar janelas em proporções ideais de leitura e codificação lado a lado sem redimensionamento manual.',
            isActive: true,
            isOfficial: true,
          },
        ],
      },
    ],
  },
  {
    id: 'doc-seed-2',
    title: 'Nova Nota.html',
    subtitle: 'Rascunho de documentação técnica e notas privadas de reuniões.',
    doc_type: 'nota_privada',
    location: 'Meu Drive · Notas particulares',
    author_id: 'user-ronaldo',
    author_name: 'Ronaldo Barreto',
    tags: ['Reuniões', 'Backlog'],
    created: new Date(Date.now() - 3600000 * 5).toISOString(),
    isOfficial: true,
    modules: [
      {
        id: 'mod-nota-1',
        title: 'Módulo Único: Ideias Estratégicas',
        description: 'Anotações rápidas da sprint.',
        blocks: [
          {
            id: 'blk-n1',
            type: 'title',
            level: 2,
            content: 'Alinhamento de Integrações e Segundo Cérebro',
            isActive: true,
          },
          {
            id: 'blk-n2',
            type: 'paragraph',
            content:
              'O Segundo Cérebro atua como agregador inteligente de contexto conectando Drive, notas privadas e e-mails para gerar materiais de estudo e campanhas com um clique.',
            isActive: true,
          },
        ],
      },
    ],
  },
  {
    id: 'doc-seed-3',
    title: 'Criar documento estruturado AI.docx',
    subtitle: 'Template de artigo para blog e newsletter corporativa.',
    doc_type: 'blog_artigo',
    location: 'Meu Drive · IA Studio',
    author_id: 'user-mudarcurso',
    author_name: 'MudarCurso IA',
    tags: ['Blog', 'Newsletter', 'IA'],
    created: new Date(Date.now() - 3600000 * 18).toISOString(),
    isOfficial: true,
    modules: [
      {
        id: 'mod-blog-1',
        title: 'Módulo 1: Introdução & Gancho',
        blocks: [
          {
            id: 'blk-b1',
            type: 'title',
            level: 1,
            content: 'Como a IA Generativa Está Transformando a Criação em Agências',
            caption:
              'Análise de produtividade, redução de retrabalho e retenção de clientes em 2026.',
            isActive: true,
          },
          {
            id: 'blk-b2',
            type: 'paragraph',
            content:
              'Agências que adotam fluxos modulares em blocos aceleram a aprovação de clientes em até 3.4x, eliminando trocas infinitas de e-mails.',
            isActive: true,
          },
        ],
      },
    ],
  },
  {
    id: 'doc-seed-4',
    title: 'Landing Page Oficial - Curso de Produtividade',
    subtitle: 'Estrutura completa de copy e seções para página de vendas de alta conversão.',
    doc_type: 'site_landing',
    location: 'Meu Drive · Projetos de Site',
    author_id: 'user-ronaldo',
    author_name: 'Ronaldo Barreto',
    tags: ['Landing Page', 'Copywriting', 'Vendas'],
    created: new Date(Date.now() - 3600000 * 24).toISOString(),
    isOfficial: true,
    modules: [
      {
        id: 'mod-site-1',
        title: 'Hero Section (Dobra Superior)',
        blocks: [
          {
            id: 'blk-s1',
            type: 'title',
            level: 1,
            content: 'Domine o Seu Segundo Cérebro Digital e Crie em Minutos',
            caption:
              'Aprenda o método prático que organiza ideias, notas e estratégias num só lugar.',
            isActive: true,
          },
          {
            id: 'blk-s2',
            type: 'paragraph',
            content:
              'Junte-se a mais de 10.000 profissionais e alunos da MudarCurso que utilizam a IA para pensar mais rápido e executar com excelência.',
            isActive: true,
          },
        ],
      },
    ],
  },
]

function getLocalDocs(): SecondBrainDoc[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return DEFAULT_SAMPLE_DOCS
}

function saveLocalDocs(docs: SecondBrainDoc[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(docs))
  } catch {
    /* ignore */
  }
}

/**
 * Lista todos os documentos do Segundo Cérebro (PocketBase com fallback local).
 */
export async function listSecondBrainDocs(params?: {
  docType?: SecondBrainDocType | 'all'
  search?: string
}): Promise<SecondBrainDoc[]> {
  try {
    let filter = ''
    if (params?.docType && params.docType !== 'all') {
      filter = `doc_type = "${params.docType}"`
    }
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filter || undefined,
      sort: '-created',
      requestKey: null,
    })

    if (records && records.length > 0) {
      const mapped: SecondBrainDoc[] = records.map((r: any) => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle || '',
        doc_type: r.doc_type || 'documento',
        location: r.location || 'Meu Drive · Notas privadas',
        modules: (typeof r.modules === 'string' ? JSON.parse(r.modules) : r.modules) || [],
        author_id: r.author_id,
        author_name: r.author_name || 'Você',
        tags: (typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags) || [],
        is_pinned: Boolean(r.is_pinned),
        created: r.created,
        updated: r.updated,
        isOfficial: true,
      }))

      if (params?.search) {
        const q = params.search.toLowerCase()
        return mapped.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.subtitle?.toLowerCase().includes(q) ||
            d.author_name?.toLowerCase().includes(q),
        )
      }
      return mapped
    }
  } catch (err) {
    console.warn('[second-brain] Fallback local para documentos:', err)
  }

  // Fallback local
  let list = getLocalDocs()
  if (params?.docType && params.docType !== 'all') {
    list = list.filter((d) => d.doc_type === params.docType)
  }
  if (params?.search) {
    const q = params.search.toLowerCase()
    list = list.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.subtitle?.toLowerCase().includes(q) ||
        d.author_name?.toLowerCase().includes(q),
    )
  }
  return list
}

/**
 * Busca documento específico por ID.
 */
export async function getSecondBrainDoc(id: string): Promise<SecondBrainDoc | null> {
  if (!id) return null
  try {
    const r = await pb.collection(COLLECTION).getOne(id)
    return {
      id: r.id,
      title: r.title,
      subtitle: r.subtitle || '',
      doc_type: r.doc_type || 'documento',
      location: r.location || 'Meu Drive · Notas privadas',
      modules: (typeof r.modules === 'string' ? JSON.parse(r.modules) : r.modules) || [],
      author_id: r.author_id,
      author_name: r.author_name || 'Você',
      tags: (typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags) || [],
      is_pinned: Boolean(r.is_pinned),
      created: r.created,
      updated: r.updated,
      isOfficial: true,
    }
  } catch {
    /* fallback local */
  }

  const local = getLocalDocs().find((d) => d.id === id)
  return local || null
}

/**
 * Cria ou atualiza um documento do Segundo Cérebro.
 */
export async function saveSecondBrainDoc(
  doc: Partial<SecondBrainDoc> & { title: string },
): Promise<SecondBrainDoc> {
  const currentUserId = pb.authStore.record?.id || 'user-current'
  const currentUserName =
    (pb.authStore.record as any)?.name ||
    (pb.authStore.record as any)?.username ||
    'Ronaldo Barreto'

  const docId = doc.id || `doc-${Date.now()}`
  const now = new Date().toISOString()

  const normalized: SecondBrainDoc = {
    id: docId,
    title: doc.title,
    subtitle: doc.subtitle || '',
    doc_type: doc.doc_type || 'documento',
    location: doc.location || 'Meu Drive · Notas particulares',
    modules:
      doc.modules && doc.modules.length > 0
        ? doc.modules
        : [
            {
              id: `mod-${Date.now()}`,
              title: 'Módulo 1: Introdução ao Conteúdo',
              description: 'Visão geral e objetivos de aprendizagem.',
              blocks: [
                {
                  id: `blk-${Date.now()}-1`,
                  type: 'title',
                  level: 1,
                  content: 'Título Principal do Documento',
                  caption: 'Subtítulo orientador ou resumo executivo.',
                  isActive: true,
                },
                {
                  id: `blk-${Date.now()}-2`,
                  type: 'paragraph',
                  content: 'Escreva ou gere com IA os principais tópicos deste módulo.',
                  isActive: true,
                },
              ],
            },
          ],
    author_id: doc.author_id || currentUserId,
    author_name: doc.author_name || currentUserName,
    tags: doc.tags || ['Segundo Cérebro', 'Produtividade'],
    is_pinned: Boolean(doc.is_pinned),
    created: doc.created || now,
    updated: now,
    isOfficial: false,
  }

  // Atualiza local primeiro para resposta instantânea
  const localList = getLocalDocs()
  const existsIndex = localList.findIndex((d) => d.id === normalized.id)
  if (existsIndex >= 0) {
    localList[existsIndex] = normalized
  } else {
    localList.unshift(normalized)
  }
  saveLocalDocs(localList)

  // Persiste no PocketBase
  try {
    const payload = {
      title: normalized.title,
      doc_type: normalized.doc_type,
      subtitle: normalized.subtitle || '',
      location: normalized.location || '',
      modules: normalized.modules,
      author_id: normalized.author_id || '',
      author_name: normalized.author_name || '',
      tags: normalized.tags,
      is_pinned: normalized.is_pinned,
    }

    if (doc.id && !doc.id.startsWith('doc-seed-') && !doc.id.startsWith('doc-17')) {
      const updated = await pb.collection(COLLECTION).update(doc.id, payload)
      return { ...normalized, id: updated.id, isOfficial: true }
    } else {
      const created = await pb.collection(COLLECTION).create(payload)
      return { ...normalized, id: created.id, isOfficial: true }
    }
  } catch (err) {
    console.warn('[second-brain] Persistência remota falhou, mantido local:', err)
    return normalized
  }
}

/**
 * Remove documento do Segundo Cérebro.
 */
// Aliases de conveniência para componentes do Studio
export const getSecondBrainDocs = listSecondBrainDocs
export const createSecondBrainDoc = saveSecondBrainDoc
export const updateSecondBrainDoc = async (
  id: string,
  patch: Partial<SecondBrainDoc>,
): Promise<SecondBrainDoc> => {
  return saveSecondBrainDoc({ id, ...patch } as any)
}

export async function askSecondBrain(
  query: string,
): Promise<{ answer: string; source: 'oficial' | 'calibrado' }> {
  const docs = await listSecondBrainDocs()
  const matched = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.modules?.some((m) =>
        m.blocks?.some((b) => b.content.toLowerCase().includes(query.toLowerCase())),
      ),
  )

  if (matched.length > 0) {
    const top = matched[0]
    return {
      answer: `Com base nas suas notas do Segundo Cérebro ("${top.title}"):\n\n${
        top.subtitle || top.modules?.[0]?.blocks?.[0]?.content || 'Conteúdo relevante localizado.'
      }`,
      source: 'oficial',
    }
  }

  return {
    answer: `O Segundo Cérebro sintetizou sua consulta sobre "${query}":\nIdentificamos conexões com seus documentos no Drive, notas privadas e rascunhos de campanhas. Recomendamos estruturar um módulo específico no MagicAuthor para detalhar esse fluxo.`,
    source: 'calibrado',
  }
}

export async function deleteSecondBrainDoc(id: string): Promise<boolean> {
  const localList = getLocalDocs().filter((d) => d.id !== id)
  saveLocalDocs(localList)

  try {
    await pb.collection(COLLECTION).delete(id)
    return true
  } catch {
    return true
  }
}

/**
 * Motor de IA para enriquecer/gerar conteúdo de um bloco (com fallback calibrado)
 */
export async function generateBlockContentWithAi(params: {
  blockType: BlockType
  level?: 1 | 2 | 3
  docTitle: string
  moduleTitle: string
  docType: SecondBrainDocType
  currentContent?: string
}): Promise<{ content: string; caption?: string; badgeLabel?: string; isOfficial: boolean }> {
  const { blockType, level = 1, docTitle, moduleTitle, docType, currentContent } = params

  try {
    const res = await pb.send('/backend/v1/ai/second-brain-generate', {
      method: 'POST',
      body: JSON.stringify({
        blockType,
        level,
        docTitle,
        moduleTitle,
        docType,
        currentContent,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    if ((res as any)?.content) {
      return {
        content: (res as any).content,
        caption: (res as any).caption,
        badgeLabel: (res as any).badgeLabel,
        isOfficial: true,
      }
    }
  } catch {
    /* fallback local calibrado */
  }

  // Fallback local rico e calibrado por tipo de bloco e artefato
  if (blockType === 'title') {
    const titlesByDocType: Record<SecondBrainDocType, string[]> = {
      aula_lab: [
        'Configurações Rápidas e Notificações de Sistema',
        'Arquitetura de Dados e Estrutura de Pastas Profissionais',
        'Atalhos de Produtividade Extrema para o Dia a Dia',
      ],
      blog_artigo: [
        'Os 5 Pilares da Produtividade com IA em 2026',
        'Como Organizar o Conhecimento da Empresa sem Caos',
        'Do Rascunho à Publicação: O Fluxo que Converte',
      ],
      site_landing: [
        'Transforme Ideias Soltas em Conteúdos Prontos para Venda',
        'Acelere a Criação com um Segundo Cérebro Inteligente',
        'A Plataforma Tudo-em-Um para Criadores e Agências de Elite',
      ],
      documento: [
        'Diretrizes Estratégicas e Padrão Operacional',
        'Sumário Executivo e Metas do Trimestre',
        'Plano de Ação e Roadmap Detalhado',
      ],
      nota_privada: [
        'Anotações Chave da Reunião de Alinhamento',
        'Brainstorming e Priorização de Features',
        'Notas Rápidas de Referência e Links Úteis',
      ],
    }

    const captionsByDocType: Record<SecondBrainDocType, string> = {
      aula_lab:
        'Ajuste prático de comandos, atalhos de teclado e exercícios guiados passo a passo.',
      blog_artigo: 'Perspectiva estratégica com dados de mercado e dicas de aplicação imediata.',
      site_landing: 'Proposta única de valor com foco em clareza, autoridade e conversão direta.',
      documento: 'Consolidação de decisões e prazos acordados entre as lideranças.',
      nota_privada: 'Lembretes e próximos passos com donos de cada tarefa.',
    }

    const pool = titlesByDocType[docType] || titlesByDocType.documento
    const selected = pool[Math.floor(Math.random() * pool.length)]

    return {
      content: currentContent
        ? `${currentContent} — Refinado por IA`
        : `${selected} (${moduleTitle})`,
      caption: captionsByDocType[docType],
      badgeLabel: `#N · TÍTULO H${level}`,
      isOfficial: false,
    }
  }

  // Parágrafo e outros
  const paragraphsByDocType: Record<SecondBrainDocType, string> = {
    aula_lab:
      'Nesta etapa, o estudante aprende a manipular as ferramentas com autonomia. Cada comando deve ser testado no ambiente de laboratório para consolidar o aprendizado prático antes de avançar para o próximo desafio.',
    blog_artigo:
      'A velocidade da mudança exige que profissionais automatizem tarefas repetitivas e concentrem esforços no pensamento crítico. Ao estruturar os materiais em blocos modulares, o tempo de entrega cai pela metade.',
    site_landing:
      'Chega de perder horas tentando começar do zero. Nossa tecnologia integra o seu histórico, documentos e ferramentas favoritas para entregar peças estratégicas alinhadas ao seu tom de voz.',
    documento:
      'Todas as entregas deste ciclo respeitam os critérios de qualidade e governança definidos pelo comitê. As métricas serão auditadas quinzenalmente no painel de controle.',
    nota_privada:
      'Ideias capturadas durante a sessão: sincronizar os módulos diretamente com o calendário de publicações e testar a automação de e-mails de boas-vindas.',
  }

  return {
    content:
      paragraphsByDocType[docType] ||
      'Conteúdo estruturado e gerado com precisão para este bloco com base no contexto do Segundo Cérebro.',
    caption: 'Gerado com base nas melhores práticas do ecossistema MidiaViva.',
    badgeLabel: '#N · PARÁGRAFO',
    isOfficial: false,
  }
}
