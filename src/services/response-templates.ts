import pb from '@/lib/pocketbase/client'

export type ResponseTemplateCategory =
  | 'agradecimento'
  | 'objecao_preco'
  | 'suporte'
  | 'spam'
  | 'fora_escopo'
  | 'geral'

export type ResponseTemplateNetwork =
  | 'todas'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'whatsapp'
  | 'linkedin'
  | 'tiktok'

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
  created?: string
  updated?: string
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
    const newCount = (item.usage_count || 0) + 1
    await pb.collection('response_templates').update(id, { usage_count: newCount })
  } catch (err) {
    // silencioso para não bloquear a UI de envio
    console.warn('[response-templates] Falha ao incrementar contador:', err)
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
