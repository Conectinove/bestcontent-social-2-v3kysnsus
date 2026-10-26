import pb from '@/lib/pocketbase/client'

export type SocialNetwork = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'facebook' | 'twitter'

export interface SeoAnalysisResult {
  score: number // 0 a 100
  breakdown: {
    hook: { score: number; status: 'good' | 'warning' | 'bad'; feedback: string }
    length: {
      score: number
      status: 'good' | 'warning' | 'bad'
      feedback: string
      charCount: number
      wordCount: number
    }
    cta: { score: number; status: 'good' | 'warning' | 'bad'; feedback: string }
    readability: { score: number; status: 'good' | 'warning' | 'bad'; feedback: string }
    hashtags: { score: number; status: 'good' | 'warning' | 'bad'; feedback: string; count: number }
  }
  recommendations: string[]
  suggestedKeywords: Array<{
    keyword: string
    volume: string
    difficulty: 'Fácil' | 'Médio' | 'Alto'
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
): SeoAnalysisResult {
  const text = (caption || '').trim()
  const charCount = text.length
  const words = text ? text.split(/\s+/).filter(Boolean) : []
  const wordCount = words.length

  // Hashtags
  const hashtagMatches = text.match(/#[a-zA-Z0-9_\u00C0-\u017F]+/g) || []
  const hashtagCount = hashtagMatches.length

  // Análise de Hook (Primeira linha / Primeiras palavras)
  const firstLine = text.split('\n')[0] || ''
  const hookWords = firstLine.split(/\s+/).filter(Boolean).length
  const hasHookTrigger =
    /como|por que|o segredo|3 dicas|5 passos|você sabia|pare de|atenção|guia|erro|segredo|\?|!/i.test(
      firstLine,
    )

  let hookScore = 50
  let hookFeedback = 'Adicione uma pergunta instigante ou promessa clara logo na 1ª linha.'
  if (hookWords >= 4 && hookWords <= 12 && hasHookTrigger) {
    hookScore = 100
    hookFeedback = 'Gancho excelente! Estimula o leitor a clicar em "...mais".'
  } else if (hasHookTrigger || hookWords >= 4) {
    hookScore = 75
    hookFeedback = 'Bom gancho inicial. Considere torná-lo ainda mais específico.'
  }

  // Análise de Tamanho por Rede
  let lengthScore = 50
  let lengthFeedback = 'Tamanho razoável.'
  if (network === 'instagram') {
    if (charCount >= 150 && charCount <= 1200) {
      lengthScore = 100
      lengthFeedback = 'Extensão perfeita para engajamento e retenção no feed/Reels.'
    } else if (charCount < 80) {
      lengthScore = 45
      lengthFeedback =
        'Legenda muito curta. O algoritmo se beneficia de mais contexto e palavras-chave.'
    } else {
      lengthScore = 70
      lengthFeedback =
        'Texto longo. Divida em parágrafos curtos para facilitar a leitura no mobile.'
    }
  } else if (network === 'tiktok') {
    if (charCount >= 100 && charCount <= 500) {
      lengthScore = 100
      lengthFeedback = 'Ideal para a barra de busca do TikTok (100 a 500 caracteres).'
    } else {
      lengthScore = 65
      lengthFeedback =
        'Para TikTok SEO, prefira entre 100 e 500 caracteres ricos em termos de busca.'
    }
  } else {
    lengthScore = charCount >= 80 ? 90 : 60
    lengthFeedback = 'Tamanho adequado para a rede.'
  }

  // Análise de CTA (Chamada para Ação)
  const hasCta =
    /comente|salve|compartilhe|clique no link|link na bio|me conta|qual sua opinião|deixe seu|salva esse|marca|envie|comenta/i.test(
      text,
    )
  let ctaScore = hasCta ? 100 : 40
  let ctaFeedback = hasCta
    ? 'CTA identificada com clareza no texto!'
    : 'Falta uma Chamada para Ação direta (ex: "Salve para consultar", "Comente o que achou").'

  // Análise de Legibilidade (parágrafos, quebras de linha, emojis moderados)
  const lineBreaks = (text.match(/\n/g) || []).length
  let readabilityScore = 70
  let readabilityFeedback = 'Boa formatação visual.'
  if (charCount > 200 && lineBreaks < 2) {
    readabilityScore = 50
    readabilityFeedback = 'Adicione quebras de parágrafo para não formar um bloco denso de texto.'
  } else if (lineBreaks >= 2) {
    readabilityScore = 100
    readabilityFeedback = 'Ótima distribuição de parágrafos e respiro visual.'
  }

  // Análise de Hashtags
  let hashtagScore = 70
  let hashtagFeedback = 'Número adequado.'
  if (network === 'instagram' || network === 'tiktok') {
    if (hashtagCount >= 3 && hashtagCount <= 6) {
      hashtagScore = 100
      hashtagFeedback = `Perfeito: ${hashtagCount} hashtags focadas no nicho (evita penalidade de spam).`
    } else if (hashtagCount === 0) {
      hashtagScore = 40
      hashtagFeedback = 'Inclua de 3 a 5 hashtags com temas específicos do seu nicho.'
    } else if (hashtagCount > 10) {
      hashtagScore = 55
      hashtagFeedback = 'Muitas hashtags podem diluir o foco semântico do post perante o algoritmo.'
    }
  } else {
    hashtagScore = hashtagCount <= 3 ? 90 : 60
    hashtagFeedback = 'Hashtags moderadas conforme recomendado na rede.'
  }

  // Score consolidado ponderado (0 a 100)
  const totalScore = Math.round(
    hookScore * 0.25 +
      lengthScore * 0.2 +
      ctaScore * 0.25 +
      readabilityScore * 0.15 +
      hashtagScore * 0.15,
  )

  const recommendations: string[] = []
  if (hookScore < 80)
    recommendations.push(
      'Fortaleça a 1ª linha com um benefício imediato ou pergunta que gere curiosidade.',
    )
  if (ctaScore < 80)
    recommendations.push(
      'Finalize convidando a audiência a salvar a publicação ou deixar uma opinião nos comentários.',
    )
  if (readabilityScore < 80)
    recommendations.push('Dê mais respiro entre ideias usando linhas em branco.')
  if (hashtagCount < 3)
    recommendations.push(
      'Adicione 3 hashtags específicas que o seu cliente ideal costuma pesquisar.',
    )

  // Sugestões de palavras-chave locais/estimadas
  const suggestedKeywords = [
    {
      keyword: words[0] ? `#${words[0].toLowerCase().replace(/[^a-z0-9]/g, '')}` : '#dicasdigitais',
      volume: '18.4k buscas/mês',
      difficulty: 'Médio' as const,
    },
    {
      keyword: words[1] ? `${words[1].toLowerCase()} prático` : 'estratégia de conteúdo',
      volume: '34.2k buscas/mês',
      difficulty: 'Fácil' as const,
    },
    {
      keyword: 'como crescer no instagram',
      volume: '62.0k buscas/mês',
      difficulty: 'Alto' as const,
    },
    {
      keyword: 'criação de conteúdo com ia',
      volume: '22.8k buscas/mês',
      difficulty: 'Fácil' as const,
    },
  ]

  return {
    score: totalScore,
    breakdown: {
      hook: {
        score: hookScore,
        status: hookScore >= 80 ? 'good' : hookScore >= 60 ? 'warning' : 'bad',
        feedback: hookFeedback,
      },
      length: {
        score: lengthScore,
        status: lengthScore >= 80 ? 'good' : lengthScore >= 60 ? 'warning' : 'bad',
        feedback: lengthFeedback,
        charCount,
        wordCount,
      },
      cta: {
        score: ctaScore,
        status: ctaScore >= 80 ? 'good' : ctaScore >= 60 ? 'warning' : 'bad',
        feedback: ctaFeedback,
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
