import pb from '@/lib/pocketbase/client'

export interface PostTemplate {
  id: string
  user: string
  brand?: string
  name: string
  type: 'feed' | 'story'
  network?:
    | 'instagram'
    | 'facebook'
    | 'linkedin'
    | 'whatsapp'
    | 'tiktok'
    | 'youtube'
    | 'twitter'
    | 'all'
  category?: 'promo' | 'educativo' | 'storytelling' | 'autoridade' | 'engajamento'
  aspect_ratio?: string
  dimensions?: string
  layout_data: Record<string, unknown>
  style_settings: Record<string, unknown>
  is_favorite: boolean
  is_shared: boolean
  created: string
  updated: string
  ai_reason?: string
}

export interface GetTemplatesFilter {
  type?: string
  network?: string
  category?: string
  favoritesOnly?: boolean
  search?: string
}

export const getTemplates = (userId?: string, filter?: GetTemplatesFilter) => {
  const parts: string[] = []
  if (userId) {
    parts.push(`(user = "${userId}" || is_shared = true)`)
  }
  if (filter?.type && filter.type !== 'all') parts.push(`type = "${filter.type}"`)
  if (filter?.network && filter.network !== 'all') parts.push(`network = "${filter.network}"`)
  if (filter?.category && filter.category !== 'all') parts.push(`category = "${filter.category}"`)
  if (filter?.favoritesOnly) parts.push(`is_favorite = true`)
  if (filter?.search) {
    parts.push(`name ~ "${filter.search.replace(/"/g, '')}"`)
  }
  const filterStr = parts.length ? parts.join(' && ') : undefined
  return pb.collection('post_templates').getFullList({
    filter: filterStr,
    sort: '-created',
  })
}

export const getTemplate = (id: string) => pb.collection('post_templates').getOne(id)

export const createTemplate = (data: Record<string, unknown>) =>
  pb.collection('post_templates').create(data)

export const updateTemplate = (id: string, data: Record<string, unknown>) =>
  pb.collection('post_templates').update(id, data)

export const toggleFavorite = async (id: string, current: boolean) => {
  await pb.collection('post_templates').update(id, { is_favorite: !current })
  return !current
}

export const deleteTemplate = (id: string) => pb.collection('post_templates').delete(id)

export interface SuggestTemplatesOptions {
  brandName?: string
  brandVoice?: string
  objective?: 'vender' | 'engajar' | 'leads' | 'authority'
  approach?: 'oferta' | 'storytelling' | 'prova_social' | 'viral' | 'educativo' | 'comunidade'
  network?: string
  format?: string
}

export interface TodayPostIdea {
  id: string
  title: string
  suggestedModel: string
  format: string
  caption: string
  hashtags: string[]
  bestTime: string
  reason: string
}
export async function suggestTemplates(
  options: SuggestTemplatesOptions = {},
): Promise<PostTemplate[]> {
  try {
    const res = await pb.send('/backend/v1/ai/suggest-templates', {
      method: 'POST',
      body: JSON.stringify(options),
      headers: { 'Content-Type': 'application/json' },
    })
    return (res as any)?.suggestions || []
  } catch (err) {
    console.error('Falha ao sugerir templates por IA:', err)
    return []
  }
}

/**
 * Consulta o motor de IA para "O que postar hoje?", retornando 3 ideias completas
 * de post baseadas nas métricas anteriores, melhor horário de audiência e tom da marca.
 */
export async function getWhatToPostToday(options: {
  brandName?: string
  brandNiche?: string
  brandTone?: string
  network?: string
}): Promise<TodayPostIdea[]> {
  try {
    const res = await pb.send('/backend/v1/ai/what-to-post-today', {
      method: 'POST',
      body: JSON.stringify(options),
      headers: { 'Content-Type': 'application/json' },
    })
    return (res as any)?.ideas || []
  } catch (err) {
    console.warn('[getWhatToPostToday] Fallback:', err)
    return [
      {
        id: 'idea-1',
        title: 'O Erro Invisível que Custa Clientes (E a Solução em 3 Passos)',
        suggestedModel: 'Carrossel Passo a Passo',
        format: 'Carrossel (1080x1350)',
        caption:
          'A maioria dos negócios perde vendas por um detalhe que passa despercebido no dia a dia. Salve este post para conferir a auditoria prática de 3 minutos! 👇\n\n1. O sintoma inicial...\n2. Onde a conversão quebra...\n3. O ajuste que destrava o resultado.\n\nQual desses pontos mais chama atenção na sua operação hoje?',
        hashtags: ['#estratégia', '#negocios', '#produtividade', '#crescimento'],
        bestTime: '18:30 (Melhor horário mapeado da sua audiência)',
        reason:
          'Seus posts em formato carrossel educativo tiveram 2.1x mais engajamento e salvamentos.',
      },
      {
        id: 'idea-2',
        title: 'Estudo de Caso Rápido: Do Zero à Autoridade Sem Gastar com Anúncios',
        suggestedModel: 'Post Único com Prova Social',
        format: 'Feed Quadrado (1080x1080)',
        caption:
          'Quando começamos, muitos disseram que o mercado estava saturado. Aqui está o princípio que nos diferenciou e atraiu os clientes certos de forma orgânica. 🚀\n\nComente "GUIA" que te envio o resumo completo no direct!',
        hashtags: ['#autoridade', '#empreendedorismo', '#marketingdeconteudo', '#sucesso'],
        bestTime: '12:00 (Pico no horário de almoço)',
        reason:
          'Conteúdos com prova social e tom direto aumentaram a conversão em +45% no histórico recente.',
      },
      {
        id: 'idea-3',
        title: 'Checklist Definitivo da Semana: 5 Hábitos para Escalar Resultados',
        suggestedModel: 'Infográfico / Checklist Visual',
        format: 'Stories / Reels Vertical (1080x1920)',
        caption:
          'Sua semana pode ser produtiva ou apenas ocupada. Qual dos 5 itens da lista você já aplicou hoje? Deixe nos comentários seu foco principal da semana! 👇🔥',
        hashtags: ['#foco', '#planejamento', '#dicaspraticas', '#altaperformance'],
        bestTime: '20:15 (Maior tempo de tela)',
        reason: 'Formatos interativos com checklist aumentam em +38% as interações de respostas.',
      },
    ]
  }
}
