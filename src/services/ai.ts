import pb from '@/lib/pocketbase/client'

export interface CaptionVariation {
  title: string
  text: string
  cta?: string
}

export interface GenerateCaptionOptions {
  content: string
  platform?: string
  objective?: string
  approach?: string
  brandName?: string
  brandVoice?: string
  tone?: string
  formatName?: string
  headline?: string
  variations?: boolean
}

export const generateCaption = (
  contentOrOptions: string | GenerateCaptionOptions,
  legacyPlatform?: string,
) => {
  const payload =
    typeof contentOrOptions === 'string'
      ? { content: contentOrOptions, platform: legacyPlatform || 'Instagram' }
      : contentOrOptions

  return pb.send('/backend/v1/ai/caption', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

export interface GenerateHashtagsOptions {
  content: string
  platform?: string
  objective?: string
  category?: string
}

export interface NetworkHashtagConfig {
  id: string
  name: string
  range: string
  styleDescription: string
  suggestedCount: number
}

export const NETWORK_HASHTAG_SPECS: Record<string, NetworkHashtagConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    range: '8–12 tags',
    styleDescription: 'Nicho + termos locais/comunidade para alcance orgânico',
    suggestedCount: 10,
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    range: '4–6 tags',
    styleDescription: 'Trends virais, desafios e termos de busca rápida',
    suggestedCount: 5,
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    range: '3–5 tags',
    styleDescription: 'Foco profissional, B2B, liderança e carreira',
    suggestedCount: 4,
  },
  twitter: {
    id: 'twitter',
    name: 'X / Twitter',
    range: '2–4 tags',
    styleDescription: 'Concisas e oportunas para economizar caracteres',
    suggestedCount: 3,
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    range: '3–5 tags',
    styleDescription: 'Palavras-chave de busca (SEO) e termos de retenção',
    suggestedCount: 4,
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    range: '2–4 tags',
    styleDescription: 'Amplas, comunitárias e focadas em grupos',
    suggestedCount: 3,
  },
}

export const generateHashtags = async (
  contentOrOptions: string | GenerateHashtagsOptions,
  legacyPlatform?: string,
): Promise<{ hashtags: string[]; platform?: string; count?: number }> => {
  const payload =
    typeof contentOrOptions === 'string'
      ? { content: contentOrOptions, platform: legacyPlatform }
      : contentOrOptions

  try {
    const res = await pb.send('/backend/v1/ai/hashtags', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })
    return res || { hashtags: [] }
  } catch (err: any) {
    // Fallback inteligente caso offline respeitando a rede
    const plat = (payload.platform || 'Instagram').toLowerCase()
    const words = (payload.content || '')
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u00FF]/gi, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 4)

    let tags = words.map((w: string) => `#${w}`)
    if (plat.includes('tik')) {
      tags = [...tags.slice(0, 3), '#fyp', '#viral', '#foryou']
      return { hashtags: Array.from(new Set(tags)).slice(0, 5), platform: 'tiktok' }
    }
    if (plat.includes('link')) {
      tags = [...tags.slice(0, 3), '#carreira', '#negocios', '#gestao']
      return { hashtags: Array.from(new Set(tags)).slice(0, 4), platform: 'linkedin' }
    }
    if (plat.includes('you')) {
      tags = [...tags.slice(0, 3), '#shorts', '#tutorial', '#dicas']
      return { hashtags: Array.from(new Set(tags)).slice(0, 4), platform: 'youtube' }
    }
    if (plat.includes('twit') || plat === 'x') {
      tags = [...tags.slice(0, 2), '#novidades', '#tech']
      return { hashtags: Array.from(new Set(tags)).slice(0, 3), platform: 'twitter' }
    }
    if (plat.includes('face')) {
      tags = [...tags.slice(0, 2), '#comunidade', '#compartilhe']
      return { hashtags: Array.from(new Set(tags)).slice(0, 3), platform: 'facebook' }
    }

    tags = [...tags, '#marketingdigital', '#conteudo', '#estrategia', '#brasil']
    return { hashtags: Array.from(new Set(tags)).slice(0, 10), platform: 'instagram' }
  }
}

export interface ImproveTextOptions {
  text: string
  instruction?: string
  tone?: string
}

export const improveText = async (
  input: string | ImproveTextOptions,
): Promise<{ improvedText?: string; content?: string }> => {
  const content =
    typeof input === 'string'
      ? input
      : `${input.instruction ? input.instruction + '\n\n' : ''}${input.text}`
  const tone = typeof input === 'object' ? input.tone : undefined

  try {
    const res = await pb.send('/backend/v1/ai/improve', {
      method: 'POST',
      body: JSON.stringify({ content, tone }),
      headers: { 'Content-Type': 'application/json' },
    })
    return {
      improvedText: res?.improvedText || res?.content || res?.result || content,
      content: res?.content || content,
    }
  } catch {
    return {
      improvedText: content,
      content,
    }
  }
}

export interface VideoScriptBeat {
  time: string
  title: string
  narration: string
  visual: string
  tip?: string
}

export interface VideoScriptResult {
  hook: string
  development: string
  cta: string
  beats: VideoScriptBeat[]
}

export interface TwitterThreadResult {
  tweets: string[]
  total_tweets: number
}

export interface CarouselSlide {
  slide_number: number
  title: string
  text: string
  design_note?: string
}

export interface CarouselResult {
  cover_title: string
  subtitle: string
  slides: CarouselSlide[]
}

export interface NewsletterResult {
  subject_lines: string[]
  preview_text: string
  headline: string
  body: string
  cta: string
  reading_time_minutes: number
}

export interface MultiFormatContentResult {
  format: 'image_caption' | 'video_script' | 'twitter_thread' | 'carousel' | 'newsletter_linkedin'
  title: string
  caption?: string
  video_script?: VideoScriptResult
  twitter_thread?: TwitterThreadResult
  carousel?: CarouselResult
  newsletter_linkedin?: NewsletterResult
}

export const generateVideoScript = (data: {
  prompt: string
  duration: number
  brandName?: string
  objective?: string
}) =>
  pb.send('/backend/v1/ai/script', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })

export const generateMultiFormatContent = async (params: {
  topic: string
  format: 'image_caption' | 'video_script' | 'twitter_thread' | 'carousel' | 'newsletter_linkedin'
  brandName?: string
  tone?: string
}): Promise<MultiFormatContentResult> => {
  const { topic, format, brandName = 'Sua Marca', tone = 'profissional e magnético' } = params

  try {
    const res = await pb.send('/backend/v1/ai/multi-format', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res && res.format) return res
  } catch (_) {
    // Continua para o gerador estruturado inteligente offline/fallback
  }

  // Gerador robusto nativo em TypeScript para cada formato
  if (format === 'video_script') {
    return {
      format: 'video_script',
      title: `Roteiro: ${topic}`,
      video_script: {
        hook: `Pare de cometer esse erro com ${topic}! Você provavelmente está perdendo tempo sem saber.`,
        development: `A maioria das pessoas foca no método tradicional, mas na verdade o segredo está em 3 etapas práticas que aceleram os seus resultados com consistência e menor esforço.`,
        cta: `Comente "EU QUERO" para receber o nosso guia completo no direct e salve para consultar depois!`,
        beats: [
          {
            time: '0:00 - 0:03',
            title: 'Gancho Magnético (Stop Scrolling)',
            narration: `Se você trabalha com ${topic}, pare tudo o que você está fazendo agora por 20 segundos!`,
            visual:
              'Pessoa olhando fixo para a câmera com texto em caixa alta na tela e corte rápido.',
            tip: 'Mantenha o olhar direto na lente nos primeiros 2 segundos.',
          },
          {
            time: '0:03 - 0:15',
            title: 'Desenvolvimento: O Problema & A Virada',
            narration: `Todo mundo tenta resolver ${topic} pelo caminho mais longo. Mas existe um atalho validado que economiza horas da sua rotina diária.`,
            visual: 'Demonstração em tela dividida: Erro comum vs Solução inteligente.',
            tip: 'Insira um efeito sonoro de "ding" ao revelar a solução.',
          },
          {
            time: '0:15 - 0:25',
            title: 'Aplicação Prática com a Marca',
            narration: `É exatamente isso que aplicamos aqui na ${brandName}: automação, clareza e resultados mensuráveis.`,
            visual: 'Corte b-roll mostrando a plataforma em funcionamento ou o produto.',
            tip: 'Adicione legendas dinâmicas coloridas.',
          },
          {
            time: '0:25 - 0:30',
            title: 'CTA Direto e Envolvente',
            narration: `Curtiu? Salve este vídeo para não perder e siga nosso perfil para receber o próximo conteúdo amanhã!`,
            visual: 'Apontar para o botão de salvar no canto inferior da tela com animação.',
            tip: 'CTA simples de apenas uma ação.',
          },
        ],
      },
    }
  }

  if (format === 'twitter_thread') {
    return {
      format: 'twitter_thread',
      title: `Thread no X: ${topic}`,
      twitter_thread: {
        total_tweets: 5,
        tweets: [
          `🧵 1/5 | 90% das pessoas erram feio ao lidar com ${topic}.\n\nAqui estão os 4 princípios que aprendemos na ${brandName} após dezenas de testes práticos:\n\n👇 Segue o fio`,
          `2/5 | Ponto 1: Clareza acima de complexidade.\n\nNão tente inventar fórmulas mirabolantes para ${topic}. O simples executado com disciplina diária vence qualquer estratégia perfeita nunca postada.`,
          `3/5 | Ponto 2: Consistência bate genialidade.\n\nQuem ganha o jogo do algoritmo é quem publica com previsibilidade e métricas claras. Monitore seu engajamento semana a semana.`,
          `4/5 | Ponto 3: Conexão real com a audiência.\n\nResponda cada comentário nos primeiros 30 minutos. É ali que o algoritmo decide expandir seu alcance ou deixar o post morrer.`,
          `5/5 | Resumo:\n• Simplifique sua mensagem\n• Tenha frequência inegociável\n• Interaja como humano\n\nCurtiu? Dá um RT no tweet 1 e siga @${brandName.toLowerCase().replace(/\s+/g, '')} para mais insights diários! 🚀`,
        ],
      },
    }
  }

  if (format === 'carousel') {
    return {
      format: 'carousel',
      title: `Carrossel: Guia Prático de ${topic}`,
      carousel: {
        cover_title: `O Guia Definitivo de ${topic}`,
        subtitle: `Deslize para o lado para dominar o passo a passo com a ${brandName} 👉`,
        slides: [
          {
            slide_number: 1,
            title: `Capa: O Guia Definitivo de ${topic}`,
            text: `Tudo o que você precisa saber para transformar seus resultados hoje mesmo.`,
            design_note:
              'Fundo escuro contrastante, título grande em negrito, seta indicando o swipe.',
          },
          {
            slide_number: 2,
            title: `Slide 2: O Diagnóstico`,
            text: `Por que tantas estratégias de ${topic} falham logo na primeira semana? Falta de método e dependência de inspiração passageira.`,
            design_note: 'Ícone de alerta em lilás e texto curto com espaçamento generoso.',
          },
          {
            slide_number: 3,
            title: `Slide 3: O Passo 1`,
            text: `Defina seu público e o objetivo central antes de criar a primeira linha. Conteúdo sem direção não gera venda nem conversão.`,
            design_note: 'Destaque para o número 01 com badge roxo.',
          },
          {
            slide_number: 4,
            title: `Slide 4: O Passo 2`,
            text: `Use ferramentas e modelos validados para produzir 3x mais rápido sem abrir mão da qualidade editorial da sua marca.`,
            design_note: 'Demonstração de produtividade com checklist visual.',
          },
          {
            slide_number: 5,
            title: `Slide 5: Chamada para Ação`,
            text: `Gostou deste conteúdo?\n\n📌 Salve para consultar sempre que for produzir.\n💬 Compartilhe com alguém que precisa ver isso hoje!`,
            design_note: 'Logotipo da marca em destaque e ícones de salvar e compartilhar.',
          },
        ],
      },
    }
  }

  if (format === 'newsletter_linkedin') {
    return {
      format: 'newsletter_linkedin',
      title: `Artigo/Newsletter: As Novas Regras de ${topic}`,
      newsletter_linkedin: {
        subject_lines: [
          `Por que ${topic} mudou completamente em 2025 (e como se adaptar)`,
          `O segredo por trás do sucesso em ${topic}: um relato prático`,
          `[Estratégia] O que ninguém está te contando sobre ${topic}`,
        ],
        preview_text: `Descubra os pilares fundamentais que separam as marcas medianas dos líderes de mercado.`,
        headline: `As Novas Regras de ${topic}: Lições Práticas para Líderes e Criadores`,
        reading_time_minutes: 3,
        body: `Olá, profissionais e criadores!\n\nNa última semana, estive analisando os principais cases de sucesso da ${brandName} e percebi um padrão fascinante em torno de ${topic}.\n\nO mercado está saturado de conselhos superficiais. O que realmente move o ponteiro dos negócios e da autoridade não é a quantidade de posts, mas a relevância cirúrgica da mensagem.\n\nAqui estão os três aprendizados que você pode aplicar ainda hoje:\n\n1. Profundidade sobre ruído: Um conteúdo memorável por semana gera mais oportunidades qualificadas do que cinco posts genéricos esquecíveis.\n\n2. Métricas de vaidade vs. Métricas de negócio: Deixe as curtidas para quem busca validação. Foque em salvamentos, respostas no direct e conversões reais.\n\n3. Construção contínua de ecossistema: Suas redes sociais devem funcionar como uma porta de entrada para um relacionamento duradouro com seu cliente.\n\nQual desses pontos mais ressoa com o seu momento atual? Responda a esta publicação com a sua perspectiva.`,
        cta: `Gostou da leitura? Assine a nossa newsletter semanal para não perder os próximos ensaios exclusivos de estratégia e posicionamento.`,
      },
    }
  }

  // Fallback: post de imagem padrão
  return {
    format: 'image_caption',
    title: topic,
    caption: `✨ O segredo de ${topic} que ninguém te contou!\n\nQuando entendemos que a consistência é a chave para a autoridade, tudo muda. Na ${brandName}, acreditamos que um bom conteúdo inspira, educa e converte.\n\n👉 Deixe nos comentários: qual o seu maior desafio com esse tema hoje?\n\n#${topic.replace(/\s+/g, '')} #estrategia #marketing #conteudo`,
  }
}
