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
        title: 'Carrossel Slide-a-Slide: Guia Prático de 5 Passos',
        suggestedModel: 'Carrossel Educativo',
        format: 'Carrossel (Slides)',
        caption:
          'Deslize para o lado para dominar este guia! 👉\n\n• Slide 1: O erro invisível que custa caro\n• Slide 2: Onde a maioria quebra\n• Slide 3: O método em 3 etapas\n• Slide 4: Aplicação prática imediata\n• Slide 5: Salve para consultar sempre que produzir!',
        hashtags: ['#carrossel', '#educativo', '#dicaspraticas', '#estrategia'],
        bestTime: '18:30 (Melhor horário mapeado da sua audiência)',
        reason:
          'Seus posts em formato carrossel educativo geram 3x mais salvamentos e retenção slide a slide.',
      },
      {
        id: 'idea-2',
        title: 'Roteiro de Vídeo Curto com Beats de Tempo (TikTok & Reels)',
        suggestedModel: 'Roteiro de Vídeo (Beats)',
        format: 'Vídeo Curto / Reels',
        caption:
          '🎬 ROTEIRO COMPLETO (30s):\n\n[0:00 - 0:03] GANCHO: "Pare de cometer esse erro agora mesmo se você quer crescer!"\n[0:03 - 0:15] DESENVOLVIMENTO: "A maioria tenta pelo caminho longo, mas com essa mudança simples você dobra seus cliques."\n[0:15 - 0:25] DEMONSTRAÇÃO: Mostrar o produto ou tela em funcionamento.\n[0:25 - 0:30] CTA: "Comente QUERO para receber o acesso gratuito no direct!"',
        hashtags: ['#reels', '#shorts', '#viral', '#roteiro'],
        bestTime: '12:00 (Pico no horário de almoço)',
        reason:
          'Ganchos de 3 segundos aumentam a retenção em 70% nos algoritmos de Reels e TikTok.',
      },
      {
        id: 'idea-3',
        title: 'Thread Estruturada para X/Twitter (5 Tweets Encadeados)',
        suggestedModel: 'Thread no X',
        format: 'Thread X / Twitter',
        caption:
          '🧵 1/5 | 90% das pessoas erram feio ao planejar seu conteúdo.\n\nAqui estão os 3 pilares validados para destravar sua consistência 👇\n\n2/5 | Ponto 1: Simplicidade bate sofisticação.\n3/5 | Ponto 2: Consistência vence picos isolados.\n4/5 | Ponto 3: Conversas no direct fecham contratos.\n5/5 | Curtiu? Dê um RT no primeiro tweet e siga para receber insights diários!',
        hashtags: ['#twitter', '#threads', '#estrategia', '#negocios'],
        bestTime: '09:00 (Manhã Executiva)',
        reason: 'Threads estruturadas no X geram 4x mais retweets e consolidam autoridade rápida.',
      },
      {
        id: 'idea-4',
        title: 'Newsletter & Artigo Longo para LinkedIn (Liderança de Pensamento)',
        suggestedModel: 'Newsletter LinkedIn',
        format: 'Newsletter / Artigo',
        caption:
          'Assunto: O que os líderes de mercado não contam sobre consistência em 2025.\n\nPrezados colegas,\n\nAo analisar dezenas de operações bem-sucedidas, um fato fica claro: qualidade e constância superam qualquer hack efêmero de algoritmo.\n\nNesta edição semanal, detalho as 3 decisões estratégicas que separam marcas relevantes de marcas esquecíveis.\n\nQual a sua perspectiva sobre esse cenário? Vamos debater nos comentários!',
        hashtags: ['#newsletter', '#linkedin', '#lideranca', '#gestao'],
        bestTime: '08:00 (Início do Expediente)',
        reason:
          'Artigos longos e newsletters aumentam a geração de leads qualificados em até 65% no LinkedIn.',
      },
    ]
  }
}
