import pb from '@/lib/pocketbase/client'

export type SocialNetwork = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'facebook' | 'twitter'

export interface SeoAnalysisResult {
  score: number // 0 a 100
  breakdown: {
    hook: {
      score: number
      status: 'good' | 'warning' | 'bad'
      feedback: string
      suggestedAlternatives?: string[]
    }
    length: {
      score: number
      status: 'good' | 'warning' | 'bad'
      feedback: string
      charCount: number
      wordCount: number
      recommendedRange: string
    }
    cta: {
      score: number
      status: 'good' | 'warning' | 'bad'
      feedback: string
      suggestedCtas?: string[]
    }
    readability: { score: number; status: 'good' | 'warning' | 'bad'; feedback: string }
    hashtags: {
      score: number
      status: 'good' | 'warning' | 'bad'
      feedback: string
      count: number
      nicheSuggestions?: string[]
    }
  }
  recommendations: string[]
  suggestedKeywords: Array<{
    keyword: string
    volume: string
    difficulty: 'Fácil' | 'Médio' | 'Alto'
    intent?: string
  }>
}

export interface NetworkOptimizationChecklist {
  network: SocialNetwork
  title: string
  items: Array<{
    id: string
    label: string
    description: string
    impact: 'Alto' | 'Médio' | 'Crítico'
  }>
}

export const NETWORK_CHECKLISTS: Record<SocialNetwork, NetworkOptimizationChecklist> = {
  instagram: {
    network: 'instagram',
    title: 'Checklist de SEO para Instagram (Reels & Feed)',
    items: [
      {
        id: 'hook_line',
        label: 'Primeira Linha de Impacto (Hook)',
        description: 'Primeiras 4 a 6 palavras devem prender a atenção antes do botão "...mais".',
        impact: 'Crítico',
      },
      {
        id: 'alt_text',
        label: 'Texto Alternativo (Alt Text Acessível)',
        description:
          'Descreva a imagem/vídeo usando palavras-chave semânticas nas configurações avançadas.',
        impact: 'Alto',
      },
      {
        id: 'hashtags_targeted',
        label: 'Hashtags Estratégicas (3 a 5 nichadas)',
        description:
          'O algoritmo do Instagram prioriza de 3 a 5 tags hiper-específicas em vez de 30 genéricas.',
        impact: 'Médio',
      },
      {
        id: 'audio_trending',
        label: 'Áudio Relevante ou em Alta',
        description:
          'Utilize trilhas que correspondam ao clima do Reels para indexação em páginas de áudio.',
        impact: 'Alto',
      },
      {
        id: 'cta_engagement',
        label: 'CTA Claro de Salvar ou Compartilhar',
        description:
          'Salvar e compartilhar têm peso 3x maior que curtidas simples no ranqueamento do Explore.',
        impact: 'Crítico',
      },
    ],
  },
  tiktok: {
    network: 'tiktok',
    title: 'Checklist de SEO para TikTok (Search Engine)',
    items: [
      {
        id: 'text_on_screen',
        label: 'Texto Falado e na Tela (Transcrições)',
        description:
          'O bot do TikTok transcreve fala e OCR do vídeo. Diga a palavra-chave nos primeiros 3s.',
        impact: 'Crítico',
      },
      {
        id: 'cover_title',
        label: 'Capa com Título Claro',
        description:
          'O título na capa orienta os cliques quando o vídeo aparece na barra de pesquisa.',
        impact: 'Alto',
      },
      {
        id: 'caption_keywords',
        label: 'Legenda Rica em Consultas de Busca',
        description: 'Escreva como as pessoas pesquisam: "Como fazer X passo a passo".',
        impact: 'Crítico',
      },
      {
        id: 'search_bar_check',
        label: 'Validação da Barra de Pesquisa',
        description: 'Confira se o termo exato aparece no autocomplete de busca da plataforma.',
        impact: 'Médio',
      },
    ],
  },
  youtube: {
    network: 'youtube',
    title: 'Checklist de SEO para YouTube (Shorts & Vídeos)',
    items: [
      {
        id: 'title_tag',
        label: 'Título com Palavra-Chave Primária',
        description: 'Posicione a palavra mais buscada nos primeiros 45 caracteres do título.',
        impact: 'Crítico',
      },
      {
        id: 'first_lines',
        label: 'Primeiros 200 Caracteres da Descrição',
        description: 'Aparecem no snippet de busca do Google e YouTube. Inclua resumo conciso.',
        impact: 'Crítico',
      },
      {
        id: 'thumbnail_contrast',
        label: 'Thumbnail de Alto Contraste',
        description: 'Garante CTR elevado, sinal essencial para o algoritmo expandir o alcance.',
        impact: 'Alto',
      },
      {
        id: 'timestamps',
        label: 'Capítulos e Timestamps',
        description: 'Facilita a indexação de trechos em momentos-chave no Google Search.',
        impact: 'Alto',
      },
    ],
  },
  linkedin: {
    network: 'linkedin',
    title: 'Checklist de SEO para LinkedIn',
    items: [
      {
        id: 'opening_hook',
        label: 'Gancho Inicial sem Links Externos',
        description:
          'Coloque links externos no primeiro comentário para não sofrer penalização de alcance.',
        impact: 'Crítico',
      },
      {
        id: 'document_format',
        label: 'Carrossel em PDF (Documento)',
        description:
          'O formato carrossel em PDF gera o maior tempo de retenção médio na plataforma.',
        impact: 'Alto',
      },
      {
        id: 'hashtags_linkedin',
        label: '3 Hashtags Oficiais',
        description: 'Hashtags seguidas por comunidades (ex: #marketing, #tecnologia).',
        impact: 'Médio',
      },
      {
        id: 'opinion_question',
        label: 'Pergunta de Opinião Profissional',
        description: 'Estimule especialistas da área a deixarem suas impressões nos comentários.',
        impact: 'Alto',
      },
    ],
  },
  facebook: {
    network: 'facebook',
    title: 'Checklist de SEO para Facebook',
    items: [
      {
        id: 'direct_video',
        label: 'Vídeo Nativo sem Link de Saída',
        description: 'Prioridade absoluta para uploads nativos na plataforma.',
        impact: 'Crítico',
      },
      {
        id: 'engagement_seed',
        label: 'Compartilhamento em Grupos Relevantes',
        description: 'Alavanca a distribuição para comunidades com interesses em comum.',
        impact: 'Alto',
      },
      {
        id: 'short_caption',
        label: 'Legenda Concisa e Direta',
        description:
          'No feed do Facebook, textos entre 50 e 80 palavras têm taxa superior de clique.',
        impact: 'Médio',
      },
    ],
  },
  twitter: {
    network: 'twitter',
    title: 'Checklist de SEO para X / Twitter',
    items: [
      {
        id: 'hook_tweet',
        label: 'Tweet de Abertura com Dado ou Opinião Forte',
        description: 'Define se a pessoa abrirá a thread ou dará retweet.',
        impact: 'Crítico',
      },
      {
        id: 'minimal_tags',
        label: 'No máximo 1 a 2 Hashtags',
        description: 'Excesso de tags no X é visto como spam pelo algoritmo de recomendações.',
        impact: 'Alto',
      },
      {
        id: 'media_alt',
        label: 'Descrição de Imagem (Alt Text)',
        description: 'Acessibilidade e indexação semântica.',
        impact: 'Médio',
      },
    ],
  },
}

export function analyzeCaptionSeo(
  caption: string,
  network: SocialNetwork = 'instagram',
  niche?: string,
): SeoAnalysisResult {
  const text = (caption || '').trim()
  const charCount = text.length
  const words = text ? text.split(/\s+/).filter(Boolean) : []
  const wordCount = words.length

  // Hashtags existentes
  const hashtagMatches = text.match(/#[a-zA-Z0-9_\u00C0-\u017F]+/g) || []
  const hashtagCount = hashtagMatches.length

  // Análise de Hook (Primeira linha)
  const firstLine = text.split('\n')[0] || ''
  const hookWords = firstLine.split(/\s+/).filter(Boolean).length
  const hasHookTrigger =
    /como|por que|o segredo|3 dicas|5 passos|você sabia|pare de|atenção|guia|erro|segredo|\?|!/i.test(
      firstLine,
    )

  // Alternativas concretas para a primeira linha
  const baseKeyword = words[0] || niche || 'Conteúdo'
  const suggestedAlternatives = [
    `Pare de cometer esse erro com ${baseKeyword}: o segredo que ninguém te conta.`,
    `Você sabia que 90% das pessoas erram em ${baseKeyword}? Veja como resolver:`,
    `3 passos práticos para dominar ${baseKeyword} ainda hoje (salve para não esquecer).`,
  ]

  let hookScore = 45
  let hookFeedback = '1ª linha fraca. Adicione uma pergunta instigante ou promessa clara.'
  if (hookWords >= 4 && hookWords <= 14 && hasHookTrigger) {
    hookScore = 100
    hookFeedback = 'Gancho magnético! Estimula o leitor a clicar em "...mais" antes do corte.'
  } else if (hasHookTrigger || hookWords >= 4) {
    hookScore = 75
    hookFeedback = 'Bom gancho inicial. Torne-o mais específico e prometa um benefício imediato.'
  }

  // Análise de Tamanho por Rede
  let lengthScore = 50
  let lengthFeedback = 'Tamanho razoável.'
  let recommendedRange = '150 - 1.200 caracteres'
  if (network === 'instagram') {
    recommendedRange = '150 - 1.200 caracteres'
    if (charCount >= 150 && charCount <= 1200) {
      lengthScore = 100
      lengthFeedback = `Extensão ideal (${charCount} carac.). Otimizado para retenção no feed/Reels.`
    } else if (charCount < 80) {
      lengthScore = 40
      lengthFeedback = `Muito curta (${charCount} carac.). Adicione mais contexto e termos de busca.`
    } else {
      lengthScore = 70
      lengthFeedback = `Extensa (${charCount} carac.). Quebre em blocos curtos para leitura mobile.`
    }
  } else if (network === 'tiktok') {
    recommendedRange = '100 - 500 caracteres'
    if (charCount >= 100 && charCount <= 500) {
      lengthScore = 100
      lengthFeedback = `Ideal para a barra de busca do TikTok (${charCount} carac.).`
    } else {
      lengthScore = 65
      lengthFeedback = `Para TikTok SEO, prefira entre 100 e 500 carac. (atual: ${charCount}).`
    }
  } else if (network === 'linkedin') {
    recommendedRange = '500 - 1.800 caracteres'
    if (charCount >= 400 && charCount <= 1800) {
      lengthScore = 100
      lengthFeedback = `Perfeito para o algoritmo do LinkedIn (${charCount} carac.).`
    } else {
      lengthScore = 65
      lengthFeedback = `No LinkedIn, textos aprofundados (400-1800 carac.) têm maior alcance.`
    }
  } else if (network === 'twitter') {
    recommendedRange = '70 - 280 caracteres'
    if (charCount >= 70 && charCount <= 280) {
      lengthScore = 100
      lengthFeedback = `Tamanho perfeito para tweet único (${charCount}/280 carac.).`
    } else if (charCount > 280) {
      lengthScore = 70
      lengthFeedback = `Passou de 280 caracteres (${charCount}). Converta em thread.`
    } else {
      lengthScore = 60
      lengthFeedback = `Muito curto (${charCount} carac.). Adicione mais substância.`
    }
  } else {
    recommendedRange = '100 - 800 caracteres'
    lengthScore = charCount >= 80 ? 90 : 60
    lengthFeedback = 'Extensão adequada para a rede selecionada.'
  }

  // Análise de CTA (Chamada para Ação)
  const hasCta =
    /comente|salve|compartilhe|clique no link|link na bio|me conta|qual sua opinião|deixe seu|salva esse|marca|envie|comenta|cadastre-se|garanta sua/i.test(
      text,
    )
  const suggestedCtas = [
    '📌 Salve este post para consultar no seu próximo planejamento!',
    '💬 Qual foi o maior insight para você? Comente aqui embaixo!',
    '🚀 Compartilhe no direct com um amigo que precisa ver isso hoje.',
    '🔗 Acesse o link oficial na bio para garantir sua vaga.',
  ]

  let ctaScore = hasCta ? 100 : 35
  let ctaFeedback = hasCta
    ? 'CTA clara identificada com sucesso!'
    : 'Falta uma Chamada para Ação (CTA). O algoritmo valoriza posts que geram salvamento e compartilhamento.'

  // Análise de Legibilidade (parágrafos e quebras)
  const lineBreaks = (text.match(/\n/g) || []).length
  let readabilityScore = 70
  let readabilityFeedback = 'Boa formatação visual.'
  if (charCount > 200 && lineBreaks < 2) {
    readabilityScore = 45
    readabilityFeedback = 'Adicione linhas em branco entre ideias para não formar bloco denso.'
  } else if (lineBreaks >= 2) {
    readabilityScore = 100
    readabilityFeedback = 'Excelente respiro visual e divisão por parágrafos no mobile.'
  }

  // Análise de Hashtags com sugestões por nicho
  const cleanNiche = (niche || 'conteudo').toLowerCase().replace(/[^a-z0-9]/g, '')
  const nicheSuggestions = [
    `#${cleanNiche}`,
    `#${cleanNiche}brasil`,
    `#dicasde${cleanNiche}`,
    '#estrategiadigital',
    '#criacaodeconteudo',
  ]

  let hashtagScore = 70
  let hashtagFeedback = 'Número adequado.'
  if (network === 'instagram' || network === 'tiktok') {
    if (hashtagCount >= 3 && hashtagCount <= 6) {
      hashtagScore = 100
      hashtagFeedback = `Perfeito: ${hashtagCount} tags focadas no nicho (sem risco de shadowban).`
    } else if (hashtagCount === 0) {
      hashtagScore = 35
      hashtagFeedback = 'Nenhuma hashtag detectada. Adicione de 3 a 5 tags nichadas.'
    } else if (hashtagCount > 8) {
      hashtagScore = 55
      hashtagFeedback = `Muitas tags (${hashtagCount}). O algoritmo atual prefere 3 a 5 específicas.`
    }
  } else if (network === 'twitter') {
    hashtagScore = hashtagCount <= 2 ? 100 : 50
    hashtagFeedback =
      hashtagCount <= 2
        ? 'Hashtags moderadas ideais para X.'
        : 'Excesso de tags no X reduz alcance.'
  } else {
    hashtagScore = hashtagCount <= 4 ? 90 : 65
    hashtagFeedback = 'Quantidade de tags dentro do padrão da rede.'
  }

  // Score ponderado consolidado
  const totalScore = Math.round(
    hookScore * 0.25 +
      lengthScore * 0.2 +
      ctaScore * 0.25 +
      readabilityScore * 0.15 +
      hashtagScore * 0.15,
  )

  const recommendations: string[] = []
  if (hookScore < 80) {
    recommendations.push(
      'Troque a 1ª linha por um gancho magnético com pergunta ou promessa direta.',
    )
  }
  if (ctaScore < 80) {
    recommendations.push(
      'Inclua um CTA claro no final incentivando a salvar ou compartilhar a publicação.',
    )
  }
  if (readabilityScore < 80) {
    recommendations.push('Dê mais respiro inserindo linhas em branco entre os parágrafos.')
  }
  if (hashtagCount < 3) {
    recommendations.push(`Adicione 3 a 5 hashtags focadas em seu nicho (${cleanNiche}).`)
  }

  // Palavras-chave sugeridas com volume e intenção
  const suggestedKeywords = [
    {
      keyword: `#${cleanNiche}`,
      volume: '84.5k buscas/mês',
      difficulty: 'Médio' as const,
      intent: 'Autoridade & Nicho',
    },
    {
      keyword: `como fazer ${cleanNiche}`,
      volume: '52.1k buscas/mês',
      difficulty: 'Fácil' as const,
      intent: 'Educacional',
    },
    {
      keyword: `estratégia de ${cleanNiche}`,
      volume: '29.3k buscas/mês',
      difficulty: 'Fácil' as const,
      intent: 'Profissional',
    },
    {
      keyword: 'criação de conteúdo com ia',
      volume: '63.8k buscas/mês',
      difficulty: 'Médio' as const,
      intent: 'Tecnologia',
    },
  ]

  return {
    score: totalScore,
    breakdown: {
      hook: {
        score: hookScore,
        status: hookScore >= 80 ? 'good' : hookScore >= 60 ? 'warning' : 'bad',
        feedback: hookFeedback,
        suggestedAlternatives,
      },
      length: {
        score: lengthScore,
        status: lengthScore >= 80 ? 'good' : lengthScore >= 60 ? 'warning' : 'bad',
        feedback: lengthFeedback,
        charCount,
        wordCount,
        recommendedRange,
      },
      cta: {
        score: ctaScore,
        status: ctaScore >= 80 ? 'good' : ctaScore >= 60 ? 'warning' : 'bad',
        feedback: ctaFeedback,
        suggestedCtas,
      },
      readability: {
        score: readabilityScore,
        status: readabilityScore >= 80 ? 'good' : readabilityScore >= 60 ? 'warning' : 'bad',
        feedback: readabilityFeedback,
      },
      hashtags: {
        score: hashtagScore,
        status: hashtagScore >= 80 ? 'good' : hashtagScore >= 60 ? 'warning' : 'bad',
        feedback: hashtagFeedback,
        count: hashtagCount,
        nicheSuggestions,
      },
    },
    recommendations,
    suggestedKeywords,
  }
}

export async function saveSeoAudit(data: {
  brandId?: string
  postId?: string
  network: SocialNetwork
  niche?: string
  titleOrHook?: string
  caption: string
  score: number
  breakdown: any
  recommendations: any
  suggestedKeywords: any
}) {
  try {
    const authRecord = pb.authStore.record
    if (!authRecord) return null

    return await pb.collection('seo_audits').create({
      user: authRecord.id,
      brand: data.brandId || null,
      post: data.postId || null,
      network: data.network,
      niche: data.niche || '',
      title_or_hook: data.titleOrHook || '',
      caption: data.caption,
      score: data.score,
      breakdown: data.breakdown,
      recommendations: data.recommendations,
      suggested_keywords: data.suggestedKeywords,
    })
  } catch (err) {
    console.error('Erro ao salvar auditoria de SEO:', err)
    return null
  }
}

export async function getUserSeoAudits() {
  try {
    return await pb.collection('seo_audits').getFullList({
      sort: '-created',
    })
  } catch {
    return []
  }
}
