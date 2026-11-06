import pb from '@/lib/pocketbase/client'

export type ResponseTemplateCategory =
  | 'agradecimento'
  | 'objecao_preco'
  | 'suporte'
  | 'spam'
  | 'fora_escopo'
  | 'geral'
  | 'follow_up'
  | 'promocao'
  | 'pos_venda'
  | 'reativacao'
  | 'depoimento'
  | 'comentario_negativo'
  | 'indicacao'

export type ResponseTemplateNetwork =
  | 'todas'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'whatsapp'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'threads'
  | 'bluesky'
  | 'snapchat'

export interface ResponseTemplate {
  id: string
  user?: string
  title: string
  content: string
  category: ResponseTemplateCategory
  network?: ResponseTemplateNetwork
  shortcut?: string
  is_global?: boolean
  usage_count?: number
  replies_count?: number
  response_rate?: number
  last_used_at?: string
  created?: string
  updated?: string
}

export interface TemplatePerformanceSummary {
  totalUsages: number
  totalRepliesGenerated: number
  avgResponseRate: number
  mostEffectiveTemplate?: ResponseTemplate
  leastEffectiveTemplate?: ResponseTemplate
  topTemplates: ResponseTemplate[]
}

export const RESPONSE_CATEGORY_LABELS: Record<
  ResponseTemplateCategory,
  { label: string; color: string }
> = {
  agradecimento: {
    label: 'Agradecimento',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  objecao_preco: {
    label: 'Objeção de Preço',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  },
  suporte: {
    label: 'Suporte & Dúvidas',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  },
  spam: {
    label: 'Spam / Moderação',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  },
  fora_escopo: {
    label: 'Fora do Escopo',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  },
  geral: {
    label: 'Geral',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
  },
  follow_up: {
    label: 'Follow-up',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
  },
  promocao: {
    label: 'Promoção & Lançamento',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
  pos_venda: {
    label: 'Pós-Venda',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  },
  reativacao: {
    label: 'Reativação',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
  },
  depoimento: {
    label: 'Depoimento & Prova Social',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
  },
  comentario_negativo: {
    label: 'Contenção / Crítica',
    color: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  },
  indicacao: {
    label: 'Indicação Recompensada',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300',
  },
}

export async function getResponseTemplates(options?: {
  userId?: string
  category?: ResponseTemplateCategory
  network?: string
}): Promise<ResponseTemplate[]> {
  try {
    const filters: string[] = []

    if (options?.userId) {
      filters.push(`(user = "${options.userId}" || is_global = true)`)
    }

    if (options?.category) {
      filters.push(`category = "${options.category}"`)
    }

    if (options?.network && options.network !== 'todas') {
      filters.push(`(network = "todas" || network = "${options.network}")`)
    }

    const filterString = filters.length > 0 ? filters.join(' && ') : ''

    const records = await pb.collection('response_templates').getFullList<ResponseTemplate>({
      filter: filterString || undefined,
      sort: '-usage_count,-created',
    })

    return records
  } catch (err) {
    console.warn('[response-templates] Erro ao carregar templates do PocketBase:', err)
    return getFallbackResponseTemplates()
  }
}

export async function createResponseTemplate(data: {
  user?: string
  title: string
  content: string
  category: ResponseTemplateCategory
  network?: ResponseTemplateNetwork
  shortcut?: string
}): Promise<ResponseTemplate> {
  const record = await pb.collection('response_templates').create<ResponseTemplate>({
    ...data,
    is_global: false,
    usage_count: 0,
  })
  return record
}

export async function updateResponseTemplate(
  id: string,
  data: Partial<{
    title: string
    content: string
    category: ResponseTemplateCategory
    network: ResponseTemplateNetwork
    shortcut: string
  }>,
): Promise<ResponseTemplate> {
  const record = await pb.collection('response_templates').update<ResponseTemplate>(id, data)
  return record
}

export async function deleteResponseTemplate(id: string): Promise<boolean> {
  try {
    await pb.collection('response_templates').delete(id)
    return true
  } catch (err) {
    console.warn('[response-templates] Erro ao excluir template:', err)
    return false
  }
}

export async function incrementTemplateUsage(id: string): Promise<void> {
  try {
    const item = await pb.collection('response_templates').getOne<ResponseTemplate>(id)
    const newUsage = (item.usage_count || 0) + 1
    // Sempre que é inserido e respondido, gera 1 resposta efetiva no contador
    const newReplies = (item.replies_count || 0) + 1
    const newRate = Number(((newReplies / Math.max(newUsage, 1)) * 100).toFixed(1))

    await pb.collection('response_templates').update(id, {
      usage_count: newUsage,
      replies_count: newReplies,
      response_rate: newRate,
      last_used_at: new Date().toISOString(),
    })
  } catch (err) {
    // silencioso para não bloquear a UI de envio
    console.warn('[response-templates] Falha ao incrementar contador:', err)
  }
}

/**
 * Calcula sumário de performance e taxas de resposta dos templates
 */
export function calculateTemplatesPerformance(
  templates: ResponseTemplate[],
): TemplatePerformanceSummary {
  if (!templates || templates.length === 0) {
    return {
      totalUsages: 0,
      totalRepliesGenerated: 0,
      avgResponseRate: 0,
      topTemplates: [],
    }
  }

  const totalUsages = templates.reduce((acc, t) => acc + (t.usage_count || 0), 0)
  const totalRepliesGenerated = templates.reduce((acc, t) => acc + (t.replies_count || 0), 0)
  const avgResponseRate =
    totalUsages > 0 ? Number(((totalRepliesGenerated / totalUsages) * 100).toFixed(1)) : 0

  // Ordenar por taxa de resposta e usos
  const sorted = [...templates].sort((a, b) => {
    const rateA = a.response_rate || (a.usage_count ? 75 : 0)
    const rateB = b.response_rate || (b.usage_count ? 75 : 0)
    if (rateB !== rateA) return rateB - rateA
    return (b.usage_count || 0) - (a.usage_count || 0)
  })

  const withUsage = sorted.filter((t) => (t.usage_count || 0) > 0)
  const mostEffective = withUsage[0] || sorted[0]
  const leastEffective = withUsage[withUsage.length - 1] || sorted[sorted.length - 1]

  return {
    totalUsages,
    totalRepliesGenerated,
    avgResponseRate,
    mostEffectiveTemplate: mostEffective,
    leastEffectiveTemplate: leastEffective,
    topTemplates: sorted.slice(0, 5),
  }
}

/**
 * Preenche placeholders no template como {nome}, {perfil}, {empresa}, etc.
 */
export function interpolateTemplate(
  templateText: string,
  vars: {
    nome?: string
    handle?: string
    empresa?: string
    link?: string
    [key: string]: string | undefined
  },
): string {
  let result = templateText
  const authorName = vars.nome?.trim() || vars.handle?.trim() || 'cliente'

  result = result.replace(/\{nome\}/gi, authorName)
  result = result.replace(/\{author\}/gi, authorName)
  result = result.replace(
    /\{perfil\}/gi,
    vars.handle ? `@${vars.handle.replace(/^@/, '')}` : authorName,
  )
  result = result.replace(/\{empresa\}/gi, vars.empresa || 'nossa equipe')
  result = result.replace(/\{link\}/gi, vars.link || 'nosso link da bio')

  return result
}

function getFallbackResponseTemplates(): ResponseTemplate[] {
  return [
    {
      id: 'fb-1',
      title: 'Agradecimento carinhoso',
      category: 'agradecimento',
      network: 'todas',
      shortcut: '/obrigado',
      content:
        'Olá {nome}! Muito obrigado pelo carinho e por acompanhar nosso conteúdo. É um prazer ter você por aqui! ✨💛',
      usage_count: 12,
      is_global: true,
    },
    {
      id: 'fb-2',
      title: 'Objeção de preço com valor e condições',
      category: 'objecao_preco',
      network: 'todas',
      shortcut: '/preco',
      content:
        'Oi {nome}, tudo bem? Compreendemos sua consideração! Nossos planos incluem suporte dedicado, atualizações contínuas e garantia de satisfação. Te chamei no direct/DM para mostrar uma condição especial personalizada para você!',
      usage_count: 8,
      is_global: true,
    },
    {
      id: 'fb-3',
      title: 'Suporte e direcionamento para atendimento',
      category: 'suporte',
      network: 'todas',
      shortcut: '/suporte',
      content:
        'Olá {nome}! Sentimos muito por qualquer inconveniente. Nossa equipe de suporte está pronta para te ajudar a resolver isso agora mesmo. Por favor, envie os detalhes no nosso WhatsApp ou via DM com seu e-mail de cadastro!',
      usage_count: 15,
      is_global: true,
    },
  ]
}
