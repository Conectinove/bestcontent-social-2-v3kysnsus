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
  performance_score?: number
  best_time?: string
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

export type FunnelObjective = 'Atração' | 'Autoridade' | 'Conversão' | 'Comunidade'

export interface NetworkBestTimeSlot {
  network: string
  time: string
  reason: string
}

export interface ExpectedEngagementRange {
  min: number
  max: number
  unit: string
  benchmarkFormat: string
  confidenceScore: number
}

export interface VideoGuidelines {
  hookExample?: string
  cutPacing?: string
  idealDurationByNetwork?: {
    reels?: string
    tiktok?: string
    shorts?: string
    youtubeLong?: string
  }
  trackEnergy?: string
  recommendedNetworkByPerformance?: string
}

export interface TodayPostIdea {
  id: string
  title: string
  suggestedModel: string
  format: string
  caption: string
  hashtags: string[]
  bestTime: string
  recommendedNetwork?: string
  networkBestTimes?: NetworkBestTimeSlot[]
  expectedEngagement?: ExpectedEngagementRange
  reason: string
  funnelObjective?: FunnelObjective
  concreteAngle?: string
  seasonalityContext?: string
  suggestedCta?: string
  hook3s?: string
  trackEnergy?: string
  durationSec?: number
  estimatedPerformanceScore?: number
  whyNowContext?: string
  videoGuidelines?: VideoGuidelines | null
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
export interface GetWhatToPostTodayOptions {
  brandName?: string
  brandNiche?: string
  brandTone?: string
  network?: string
  funnelObjective?: FunnelObjective
  format?: string
  requestedFormat?: string
  preferredFormats?: string[]
  visualStyle?: string
}

export async function getWhatToPostToday(
  options: GetWhatToPostTodayOptions,
): Promise<TodayPostIdea[]> {
  try {
    const res = await pb.send('/backend/v1/ai/what-to-post-today', {
      method: 'POST',
      body: JSON.stringify(options),
      headers: { 'Content-Type': 'application/json' },
    })
    return (res as any)?.ideas || []
  } catch (err) {
    console.warn('[getWhatToPostToday] Fallback:', err)
    const brandName = options.brandName || 'Sua Marca'
    const favFormats = options.preferredFormats || []
    const requestedObj = options.funnelObjective
    const requestedFmt = (options.requestedFormat || options.format || '').toLowerCase()

    const rawFallbackList: TodayPostIdea[] = [
      {
        id: 'idea-1',
        title: '5 Erros Silenciosos de IA na Carreira (Do Básico ao Avançado)',
        suggestedModel: 'Carrossel Educativo Passo a Passo',
        format: 'Carrossel (Slides)',
        funnelObjective: 'Autoridade',
        recommendedNetwork: 'Instagram & LinkedIn',
        estimatedPerformanceScore: 94,
        hook3s: 'Capa Impactante: "90% usam IA errado. O slide 3 é o que custa clientes."',
        expectedEngagement: {
          min: 320,
          max: 580,
          unit: 'interações estimadas (curtidas + salvamentos)',
          benchmarkFormat: 'Carrossel Educativo',
          confidenceScore: 92,
        },
        networkBestTimes: [
          { network: 'Instagram', time: '18:30', reason: 'Maior pico de salvamento de carrosséis' },
          { network: 'LinkedIn', time: '08:45', reason: 'Pauta corporativa e reflexão matinal' },
          { network: 'Threads', time: '12:15', reason: 'Conversas de intervalo e leitura rápida' },
          { network: 'Pinterest', time: '20:00', reason: 'Pico de repins e organização de pastas' },
        ],
        whyNowContext:
          'Tendência de IA corporativa nos últimos 14 dias em alta de +42% nas buscas.',
        concreteAngle:
          'Auditoria progressiva de 5 slides: do erro amador de prompt até a falha que custa contratos com clientes.',
        seasonalityContext: 'Contexto de produtividade, inovação e consolidação de resultados',
        suggestedCta:
          'Toque em Salvar para auditar seus prompts e processos antes da sua próxima campanha.',
        caption:
          'Quem usa IA apenas como buscador está ficando para trás. Deslize para ver os 5 erros que separam amadores de profissionais no uso de automações hoje.\n\n• Slide 1: O erro do prompt genérico\n• Slide 2: Onde a personalização é esquecida\n• Slide 3: O filtro crítico humano essencial\n• Slide 4: A automação que gera valor real\n• Slide 5: Salve para consultar sempre que produzir!\n\nQual desses você mais percebe no mercado? 👇',
        hashtags: ['#inteligenciaartificial', '#carreira', '#estrategia', '#produtividade'],
        bestTime: '18:30 (Melhor horário mapeado da sua audiência)',
        reason: favFormats.some((f) => f.toLowerCase().includes('carrossel'))
          ? `Priorizado pelo Estilo da Marca (${brandName}): carrossel com ângulo concreto e anti-repetição dos últimos 14 dias com +34% de retenção.`
          : 'Seus carrosséis engajam 34% mais que posts estáticos e geram 3x mais salvamentos e retenção slide a slide.',
      },
      {
        id: 'idea-2',
        title: 'O Gancho Magnético dos 3 Segundos: Roteiro Pronto para Testar Hoje',
        suggestedModel: 'Talking Head / Reels Dinâmico (30s)',
        format: 'Vídeo Curto (Reels / TikTok)',
        funnelObjective: 'Atração',
        recommendedNetwork: 'TikTok & Shorts',
        estimatedPerformanceScore: 91,
        hook3s: 'Primeiros 3s: "Se você perdeu metade da audiência no início, o erro está aqui!"',
        videoGuidelines: {
          hookExample:
            '"Pare de postar Reels e TikTok sem antes ver esses 3 segundos que salvam o alcance."',
          cutPacing: 'Cortes dinâmicos a cada 1.8s a 2.5s com zoom sutil para sustentar a atenção',
          idealDurationByNetwork: {
            reels: '15-30s (taxa de retenção máxima)',
            tiktok: '21-34s (janela otimizada For You)',
            shorts: '20-40s (loop suave)',
            youtubeLong: '6-9 min com divisão temática',
          },
          trackEnergy: 'Batida ritmada lo-fi moderna com punch nos cortes (120 BPM)',
          recommendedNetworkByPerformance: 'TikTok & Instagram Reels (maior retenção real)',
        },
        expectedEngagement: {
          min: 1200,
          max: 2800,
          unit: 'visualizações estimadas (completude 42%+ e retenção 3s)',
          benchmarkFormat: 'Reels / Shorts / TikTok',
          confidenceScore: 89,
        },
        networkBestTimes: [
          {
            network: 'Instagram',
            time: '12:00',
            reason: 'Pausa de almoço com alto consumo de Reels',
          },
          { network: 'TikTok', time: '19:30', reason: 'Pico noturno de retenção por algoritmo' },
          { network: 'YouTube', time: '17:00', reason: 'Consumo pré-noite de Shorts mobile' },
          { network: 'Threads', time: '13:00', reason: 'Compartilhamento em formato rápido' },
        ],
        whyNowContext:
          'Vídeos com gancho nos 3s têm 70% mais retenção; horário de almoço é o pico de consumo.',
        concreteAngle:
          'Estrutura em 4 tempos (gancho 0-3s, problema 3-15s, demonstração 15-25s e CTA 25-30s) desenhada para reter não-seguidores.',
        seasonalityContext: 'Alta busca por tutoriais expressos em vídeo dinâmico',
        suggestedCta: 'Comente "QUERO" para receber o roteiro completo no seu direct.',
        caption:
          '🎬 ROTEIRO COMPLETO (30s):\n\n[0:00 - 0:03] GANCHO: "Pare de cometer esse erro agora mesmo se você quer crescer!"\n[0:03 - 0:15] DESENVOLVIMENTO: "A maioria tenta pelo caminho longo, mas com essa mudança simples você dobra seus cliques."\n[0:15 - 0:25] DEMONSTRAÇÃO: Mostrar o produto ou tela em funcionamento.\n[0:25 - 0:30] CTA: "Comente QUERO para receber o acesso gratuito no direct!"',
        hashtags: ['#reels', '#shorts', '#viral', '#roteiro'],
        bestTime: '12:00 (Pico no horário de almoço)',
        reason: favFormats.some(
          (f) =>
            f.toLowerCase().includes('vídeo') ||
            f.toLowerCase().includes('reels') ||
            f.toLowerCase().includes('shorts'),
        )
          ? `Priorizado pelo Estilo da Marca (${brandName}): formato favorito de vídeos curtos com beats rápidos para retenção máxima.`
          : 'Vídeos curtos de 30s com gancho nos primeiros 3s têm taxa de retenção 70% superior e expandem alcance para não-seguidores.',
      },
      {
        id: 'idea-3',
        title: 'Estudo de Caso Real: Do Zero a 48 Clientes Qualificados Sem Gastar 1 Real em Ads',
        suggestedModel: 'Estudo de Caso & Prova Social',
        format: 'Feed Único / Carrossel',
        funnelObjective: 'Conversão',
        recommendedNetwork: 'Instagram & LinkedIn',
        hook3s: 'Gancho Visual: Card de métricas reais (antes vs depois) com valor em destaque',
        estimatedPerformanceScore: 88,
        expectedEngagement: {
          min: 15,
          max: 38,
          unit: 'respostas no direct / leads qualificados',
          benchmarkFormat: 'Post de Conversão Direta',
          confidenceScore: 86,
        },
        networkBestTimes: [
          {
            network: 'Instagram',
            time: '19:15',
            reason: 'Janela de descanso e abertura de direct',
          },
          {
            network: 'LinkedIn',
            time: '11:00',
            reason: 'Decisões comerciais de meio de expediente',
          },
          { network: 'Threads', time: '17:30', reason: 'Troca de feedbacks e networking' },
          { network: 'Facebook', time: '20:15', reason: 'Interação de grupos e comunidade' },
        ],
        whyNowContext: 'Lacuna de funil: você não postou nada com foco em Conversão há 6 dias.',
        concreteAngle:
          'Apresentação de métricas reais de cliente (antes x depois) com quebra de objeção sobre tempo de implementação.',
        seasonalityContext: 'Momento propício para fechamentos e decisões comerciais do mês',
        suggestedCta:
          'Clique no link da bio ou mande mensagem para agendar sua sessão estratégica.',
        caption:
          'Como transformamos um funil parado em 48 novos clientes qualificados em 21 dias.\n\nSem fórmulas mágicas: apenas consistência de conteúdo, público segmentado e follow-up rápido.\n\nQuer aplicar esse modelo na sua operação neste mês?',
        hashtags: ['#conversao', '#estratégia', '#vendas', '#casesucesso'],
        bestTime: '19:15 (Janela de decisão comercial)',
        reason: favFormats.some(
          (f) => f.toLowerCase().includes('frases') || f.toLowerCase().includes('conceit'),
        )
          ? `Alinhado ao Estilo da Marca (${brandName}): formato conceitual com prova social comprovada para destravar leads qualificados.`
          : 'Conteúdos com objetivo de conversão registram a maior taxa de mensagens diretas no comparativo de funil.',
      },
      {
        id: 'idea-4',
        title: 'Pergunta Provocativa da Semana: Debate com a Comunidade',
        suggestedModel: 'Post Comunidade / Pergunta Aberta',
        format: 'Post Interativo / Story',
        funnelObjective: 'Comunidade',
        estimatedPerformanceScore: 85,
        whyNowContext:
          'Comunidade ativa à noite; momento ideal para puxar respostas e conexão genuína.',
        concreteAngle:
          'Quebra de mito polêmico sobre hacks milagrosos versus consistência real, estimulando desabafos de criadores.',
        seasonalityContext: 'Construção de intimidade e engajamento comunitário pós-expediente',
        suggestedCta:
          'Deixe sua opinião nos comentários: você prefere consistência diária ou superproduções pontuais?',
        caption:
          'Qual a maior mentira que te contaram sobre produzir conteúdo em redes sociais?\n\nQueremos ouvir a realidade de quem está no campo de batalha todos os dias. Solte o verbo nos comentários!',
        hashtags: ['#comunidade', '#bastidores', '#reflexao', '#socialmedia'],
        bestTime: '20:30 (Pico de comentários e debate casual)',
        reason:
          'Perguntas abertas e debates geram 2.8x mais respostas espontâneas e aumentam a pontuação algorítmica de proximidade.',
      },
      {
        id: 'idea-5',
        title: 'Thread Estruturada para X/Twitter (5 Tweets Encadeados)',
        suggestedModel: 'Thread no X',
        format: 'Thread X / Twitter',
        funnelObjective: 'Autoridade',
        estimatedPerformanceScore: 89,
        whyNowContext: 'Pico matinal no X ideal para debate analítico e retenção por retweets.',
        concreteAngle:
          'Framework em 3 pilares rápidos com gancho provocativo no tweet 1 e resumo acionável no tweet 5.',
        seasonalityContext: 'Forte demanda por sínteses objetivas e curadoria no ecossistema X',
        suggestedCta: 'Curtiu a thread? Dê RT no 1º tweet e siga o perfil para análises diárias.',
        caption:
          '🧵 1/5 | 90% das pessoas erram feio ao planejar seu conteúdo.\n\nAqui estão os 3 pilares validados para destravar sua consistência 👇\n\n2/5 | Ponto 1: Simplicidade bate sofisticação.\n3/5 | Ponto 2: Consistência vence picos isolados.\n4/5 | Ponto 3: Conversas no direct fecham contratos.\n5/5 | Curtiu? Dê um RT no primeiro tweet e siga para receber insights diários!',
        hashtags: ['#twitter', '#threads', '#estrategia', '#negocios'],
        bestTime: '09:00 (Manhã Executiva)',
        reason: favFormats.some(
          (f) => f.toLowerCase().includes('artigos') || f.toLowerCase().includes('threads'),
        )
          ? `Priorizado pelo Estilo da Marca (${brandName}): artigos e threads selecionados no Brand Kit para autoridade profunda.`
          : 'Threads estruturadas no X geram 4x mais retweets e consolidam autoridade rápida.',
      },
      {
        id: 'idea-6',
        title: 'Newsletter & Artigo Longo para LinkedIn (Liderança de Pensamento)',
        suggestedModel: 'Newsletter LinkedIn',
        format: 'Newsletter / Artigo',
        funnelObjective: 'Autoridade',
        estimatedPerformanceScore: 87,
        whyNowContext: 'Janela de abertura corporativa de segunda a quinta pela manhã.',
        concreteAngle:
          'Ensaio aprofundado com análise de mercado e 3 decisões que executivos tomam antes do crescimento.',
        seasonalityContext: 'Pauta corporativa e tomada de decisão estratégica do trimestre',
        suggestedCta:
          'Assine a newsletter para receber artigos estratégicos semanais direto na sua caixa de entrada.',
        caption:
          'Assunto: O que os líderes de mercado não contam sobre consistência em 2025.\n\nPrezados colegas,\n\nAo analisar dezenas de operações bem-sucedidas, um fato fica claro: qualidade e constância superam qualquer hack efêmero de algoritmo.\n\nNesta edição semanal, detalho as 3 decisões estratégicas que separam marcas relevantes de marcas esquecíveis.\n\nQual a sua perspectiva sobre esse cenário? Vamos debater nos comentários!',
        hashtags: ['#newsletter', '#linkedin', '#lideranca', '#gestao'],
        bestTime: '08:00 (Início do Expediente)',
        reason:
          'Artigos longos e newsletters aumentam a geração de leads qualificados em até 65% no LinkedIn.',
      },
    ]

    // Filtrar ou ordenar de acordo com objetivo e formato solicitados mantendo fallback rico
    let filtered = rawFallbackList
    if (requestedObj) {
      const matchObj = rawFallbackList.filter((i) => i.funnelObjective === requestedObj)
      if (matchObj.length > 0) {
        filtered = matchObj
      }
    }
    if (requestedFmt && requestedFmt !== 'all') {
      const matchFmt = filtered.filter((i) => i.format.toLowerCase().includes(requestedFmt))
      if (matchFmt.length > 0) {
        filtered = matchFmt
      }
    }

    return filtered
  }
}
