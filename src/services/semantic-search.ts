/**
 * Serviço de Busca Semântica e Inteligente por Ideias
 * Normaliza termos (acentos, pontuação, caixa baixa)
 * Expande intenções (ex.: 'vender mais' -> conversão, vendas, cta, oferta)
 * Ranqueia por relevância com justificativa contextual (ex.: "relacionado a: Conversão / Vendas")
 */

export interface SemanticMatchResult {
  isMatch: boolean
  score: number
  matchedIntentLabel?: string
  matchReason?: string
  additionalBadge?: string
  matchedHashtags?: string[]
}

// Mapa de sinônimos e intenções semânticas de marketing e mídias sociais
interface IntentCategory {
  id: string
  label: string
  canonicalBadge: string
  keywords: string[]
  funnelTargets: string[]
}

const INTENT_DICTIONARY: IntentCategory[] = [
  {
    id: 'conversao_vendas',
    label: 'Conversão & Vendas',
    canonicalBadge: 'relacionado a: Conversão',
    keywords: [
      'vender',
      'venda',
      'vendas',
      'vender mais',
      'fazer vendas',
      'conversao',
      'converter',
      'fechar clientes',
      'oferta',
      'ofertas',
      'preco',
      'desconto',
      'comprar',
      'lead',
      'leads',
      'captacao',
      'fechamento',
      'cliente',
      'clientes',
      'contrato',
      'faturamento',
      'lucro',
      'lucrar',
      'cta',
      'direct',
      'monetizar',
      'monetizacao',
      'proposta',
      'checkout',
      'ticket',
      'alta conversao',
    ],
    funnelTargets: ['conversão', 'conversao'],
  },
  {
    id: 'autoridade_posicionamento',
    label: 'Autoridade & Especialista',
    canonicalBadge: 'relacionado a: Autoridade',
    keywords: [
      'autoridade',
      'fazer autoridade',
      'criar autoridade',
      'ganhar autoridade',
      'especialista',
      'posicionamento',
      'se posicionar',
      'credibilidade',
      'confianca',
      'lideranca',
      'estudo de caso',
      'case',
      'prova social',
      'depoimento',
      'expertise',
      'tutorial',
      'educativo',
      'ensinar',
      'artigo',
      'newsletter',
      'metodo',
      'passo a passo',
      'guia',
      'mentoria',
      'referencia',
      'benchmark',
    ],
    funnelTargets: ['autoridade'],
  },
  {
    id: 'atracao_viral',
    label: 'Atração & Alcance',
    canonicalBadge: 'relacionado a: Atração / Alcance',
    keywords: [
      'atracao',
      'atrair',
      'atrair pessoas',
      'atrair publico',
      'viral',
      'viralizar',
      'alcance',
      'gancho',
      'hook',
      'primeiros 3s',
      'reels',
      'shorts',
      'tiktok',
      'novos seguidores',
      'crescer',
      'crescimento',
      'curiosidade',
      'visibilidade',
      'descobrir',
      'explorar',
      'bater meta',
      'topo de funil',
      'distribuicao',
    ],
    funnelTargets: ['atração', 'atracao'],
  },
  {
    id: 'comunidade_engajamento',
    label: 'Comunidade & Interação',
    canonicalBadge: 'relacionado a: Engajamento / Comunidade',
    keywords: [
      'engajar',
      'engajar mais',
      'aumentar engajamento',
      'mais engajamento',
      'engajamento alto',
      'comunidade',
      'interacao',
      'interagir',
      'conectar',
      'conexao',
      'debate',
      'discussao',
      'pergunta',
      'enquete',
      'caixinha',
      'bastidores',
      'story',
      'stories',
      'relacionamento',
      'proximidade',
      'opniao',
      'opiniao',
      'fidelizar',
      'fidelizacao',
      'comentarios',
    ],
    funnelTargets: ['comunidade'],
  },
  {
    id: 'ia_produtividade',
    label: 'IA & Automação',
    canonicalBadge: 'relacionado a: IA & Produtividade',
    keywords: [
      'ia',
      'ai',
      'inteligencia artificial',
      'automacao',
      'prompt',
      'prompts',
      'produtividade',
      'ferramenta',
      'chatgpt',
      'claude',
      'midjourney',
      'eficiencia',
      'otimizar',
      'escala',
      'escalar conteudo',
      'sem perder tempo',
      'rapido',
    ],
    funnelTargets: ['autoridade', 'atração'],
  },
  {
    id: 'retencao_video',
    label: 'Retenção & Vídeos',
    canonicalBadge: 'relacionado a: Retenção em Vídeo',
    keywords: [
      'retencao',
      'completude',
      'watch time',
      'tempo de tela',
      'video curto',
      'reels retencao',
      'tiktok retencao',
      'gancho 3s',
      'nao passar batido',
      'prender atencao',
      'atencao',
    ],
    funnelTargets: ['atração', 'autoridade'],
  },
]

/**
 * Remove acentos, pontuações e converte para minúsculas
 */
export function normalizeSemanticText(text: string): string {
  if (!text) return ''
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Avalia o texto da busca contra uma ideia (título, descrição, formato, objetivo, categoria, tema)
 * Retorna pontuação de relevância (0 a 100) e o motivo/badge semântico quando houver correspondência
 */
export function evaluateIdeaRelevance(
  searchQuery: string,
  idea: {
    title?: string
    description?: string
    category?: string
    targetTheme?: string
    format?: string
    funnelObjective?: string
    badge?: string
    hashtags?: string[]
  },
): SemanticMatchResult {
  const cleanQuery = normalizeSemanticText(searchQuery)
  if (!cleanQuery) {
    return { isMatch: true, score: 100 }
  }

  const cleanTitle = normalizeSemanticText(idea.title || '')
  const cleanDesc = normalizeSemanticText(idea.description || '')
  const cleanCat = normalizeSemanticText(idea.category || '')
  const cleanTheme = normalizeSemanticText(idea.targetTheme || '')
  const cleanFmt = normalizeSemanticText(idea.format || '')
  const cleanFunnel = normalizeSemanticText(idea.funnelObjective || '')
  const cleanBadge = normalizeSemanticText(idea.badge || '')

  // Tratamento específico de HASHTAG: se o usuário digitou #hashtag ou uma hashtag direta
  const rawQuery = (searchQuery || '').trim()
  const isExplicitHashtagQuery = rawQuery.startsWith('#')
  const tagKeyword = cleanQuery.replace(/^#+/, '').trim()

  const ideaTags = (idea.hashtags || []).map((t) => normalizeSemanticText(t).replace(/^#+/, ''))
  const hasMatchingTag = ideaTags.some(
    (tag) =>
      tag === tagKeyword ||
      (tagKeyword.length > 2 && (tag.includes(tagKeyword) || tagKeyword.includes(tag))),
  )

  if (hasMatchingTag) {
    const matchedTagOriginal = (idea.hashtags || []).find((t) => {
      const norm = normalizeSemanticText(t).replace(/^#+/, '')
      return (
        norm === tagKeyword ||
        (tagKeyword.length > 2 && (norm.includes(tagKeyword) || tagKeyword.includes(norm)))
      )
    })

    return {
      isMatch: true,
      score: isExplicitHashtagQuery ? 100 : 96,
      matchReason: `hashtag: ${matchedTagOriginal ? (matchedTagOriginal.startsWith('#') ? matchedTagOriginal : `#${matchedTagOriginal}`) : `#${tagKeyword}`}`,
      matchedHashtags: idea.hashtags,
    }
  }

  const tagsCorpus = ideaTags.join(' ')
  const fullCorpus = `${cleanTitle} ${cleanDesc} ${cleanCat} ${cleanTheme} ${cleanFmt} ${cleanFunnel} ${cleanBadge} ${tagsCorpus}`

  // 1. Correspondência direta exata da query inteira
  if (cleanTitle.includes(cleanQuery)) {
    return {
      isMatch: true,
      score: 100,
    }
  }

  if (cleanTheme.includes(cleanQuery) || cleanCat.includes(cleanQuery)) {
    return {
      isMatch: true,
      score: 92,
    }
  }

  if (fullCorpus.includes(cleanQuery)) {
    return {
      isMatch: true,
      score: 85,
    }
  }

  // 2. Análise por intenção semântica / sinônimos
  let bestIntent: IntentCategory | null = null
  let secondIntent: IntentCategory | null = null
  let maxIntentScore = 0

  for (const intent of INTENT_DICTIONARY) {
    // Se a busca contém alguma palavra-chave da intenção
    const queryHasIntentWord = intent.keywords.some((kw) => {
      const cleanKw = normalizeSemanticText(kw)
      return cleanQuery === cleanKw || cleanQuery.includes(cleanKw) || cleanKw.includes(cleanQuery)
    })

    if (queryHasIntentWord) {
      // Ponderação refinada: correspondência em Título (peso 35), Tema/Funil (peso 40), Descrição (peso 25)
      const matchesFunnel = intent.funnelTargets.some((target) =>
        cleanFunnel.includes(normalizeSemanticText(target)),
      )

      const titleMatches = intent.keywords.filter((kw) =>
        cleanTitle.includes(normalizeSemanticText(kw)),
      ).length

      const themeMatches = intent.keywords.filter(
        (kw) =>
          cleanTheme.includes(normalizeSemanticText(kw)) ||
          cleanCat.includes(normalizeSemanticText(kw)),
      ).length

      const corpusHasIntentWords = intent.keywords.filter((kw) =>
        fullCorpus.includes(normalizeSemanticText(kw)),
      ).length

      if (matchesFunnel || titleMatches > 0 || themeMatches > 0 || corpusHasIntentWords > 0) {
        let score = matchesFunnel ? 55 : 25
        score += Math.min(titleMatches * 20, 40)
        score += Math.min(themeMatches * 15, 30)
        score += Math.min(corpusHasIntentWords * 5, 20)

        if (score > maxIntentScore) {
          secondIntent = bestIntent
          maxIntentScore = score
          bestIntent = intent
        } else if (!secondIntent && intent.id !== bestIntent?.id) {
          secondIntent = intent
        }
      }
    }
  }

  if (bestIntent && maxIntentScore >= 35) {
    return {
      isMatch: true,
      score: Math.min(maxIntentScore, 95),
      matchedIntentLabel: bestIntent.label,
      matchReason: bestIntent.canonicalBadge,
      additionalBadge:
        secondIntent && secondIntent.id !== bestIntent.id ? secondIntent.canonicalBadge : undefined,
    }
  }

  // 3. Correspondência token a token (todas ou a maioria das palavras presentes)
  const queryTokens = cleanQuery.split(' ').filter((t) => t.length > 2)
  if (queryTokens.length > 0) {
    const matchedTokens = queryTokens.filter((token) => fullCorpus.includes(token))
    const ratio = matchedTokens.length / queryTokens.length
    if (ratio >= 0.5) {
      return {
        isMatch: true,
        score: Math.round(ratio * 70),
      }
    }
  }

  return { isMatch: false, score: 0 }
}
