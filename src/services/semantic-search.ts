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
      'conversao',
      'converter',
      'oferta',
      'preco',
      'desconto',
      'comprar',
      'lead',
      'leads',
      'fechamento',
      'cliente',
      'clientes',
      'contrato',
      'faturamento',
      'lucro',
      'cta',
      'direct',
    ],
    funnelTargets: ['conversão', 'conversao'],
  },
  {
    id: 'autoridade_posicionamento',
    label: 'Autoridade & Especialista',
    canonicalBadge: 'relacionado a: Autoridade',
    keywords: [
      'autoridade',
      'especialista',
      'posicionamento',
      'credibilidade',
      'lideranca',
      'estudo de caso',
      'case',
      'prova social',
      'depoimento',
      'expertise',
      'tutorial',
      'educativo',
      'artigo',
      'newsletter',
      'metodo',
      'passo a passo',
      'guia',
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
      'viral',
      'alcance',
      'gancho',
      'hook',
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
    ],
    funnelTargets: ['atração', 'atracao'],
  },
  {
    id: 'comunidade_engajamento',
    label: 'Comunidade & Interação',
    canonicalBadge: 'relacionado a: Comunidade',
    keywords: [
      'engajar',
      'engajamento',
      'comunidade',
      'interacao',
      'conectar',
      'conexao',
      'debate',
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
      'produtividade',
      'ferramenta',
      'chatgpt',
      'eficiencia',
      'otimizar',
    ],
    funnelTargets: ['autoridade', 'atração'],
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

  const fullCorpus = `${cleanTitle} ${cleanDesc} ${cleanCat} ${cleanTheme} ${cleanFmt} ${cleanFunnel} ${cleanBadge}`

  // 1. Correspondência direta exata da query inteira
  if (cleanTitle.includes(cleanQuery)) {
    return {
      isMatch: true,
      score: 100,
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
  let maxIntentScore = 0

  for (const intent of INTENT_DICTIONARY) {
    // Se a busca contém alguma palavra-chave da intenção
    const queryHasIntentWord = intent.keywords.some((kw) => {
      const cleanKw = normalizeSemanticText(kw)
      return cleanQuery.includes(cleanKw) || cleanKw.includes(cleanQuery)
    })

    if (queryHasIntentWord) {
      // Verificar se a ideia atende a essa intenção
      const matchesFunnel = intent.funnelTargets.some((target) =>
        cleanFunnel.includes(normalizeSemanticText(target)),
      )

      const corpusHasIntentWords = intent.keywords.filter((kw) =>
        fullCorpus.includes(normalizeSemanticText(kw)),
      ).length

      if (matchesFunnel || corpusHasIntentWords > 0) {
        const score = (matchesFunnel ? 60 : 30) + Math.min(corpusHasIntentWords * 10, 30)
        if (score > maxIntentScore) {
          maxIntentScore = score
          bestIntent = intent
        }
      }
    }
  }

  if (bestIntent && maxIntentScore >= 40) {
    return {
      isMatch: true,
      score: maxIntentScore,
      matchedIntentLabel: bestIntent.label,
      matchReason: bestIntent.canonicalBadge,
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
