import { pb } from '@/lib/pocketbase/client'

export interface StudioPromptTemplate {
  id: string
  user: string
  brand?: string
  name: string
  description?: string
  category: 'video' | 'image' | 'audio' | 'geral'
  template_text: string
  default_model_id?: string
  placeholders?: string[] // Ex: ["tema", "produto", "tom", "publico"]
  is_favorite?: boolean
  usage_count?: number
  created?: string
  updated?: string
}

export interface CreatePromptTemplateInput {
  userId: string
  brandId?: string
  name: string
  description?: string
  category: 'video' | 'image' | 'audio' | 'geral'
  template_text: string
  default_model_id?: string
  is_favorite?: boolean
}

// Extrai placeholders no formato {placeholder} ou {tema}
export function extractPlaceholders(templateText: string): string[] {
  const matches = templateText.match(/\{([a-zA-Z0-9_\-\u00C0-\u00FF]+)\}/g)
  if (!matches) return []
  const unique = Array.from(new Set(matches.map((m) => m.slice(1, -1).trim())))
  return unique.filter((u) => u.length > 0)
}

// Preenche template com os valores fornecidos
export function fillPromptTemplate(templateText: string, values: Record<string, string>): string {
  let result = templateText
  Object.entries(values).forEach(([key, val]) => {
    const reg = new RegExp(`\\{${key}\\}`, 'gi')
    result = result.replace(reg, val)
  })
  return result
}

// Templates padrão para início imediato se a lista estiver vazia
export const DEFAULT_STUDIO_TEMPLATES: Omit<StudioPromptTemplate, 'id' | 'user'>[] = [
  {
    name: 'Anúncio de Alta Conversão com Gancho 3s',
    description: 'Roteiro de vídeo focado em retenção nos primeiros 3 segundos e CTA incisivo.',
    category: 'video',
    template_text:
      'Câmera dinâmica revelando {produto} com iluminação volumétrica. Gancho visual nos primeiros 3s quebrando a objeção sobre {tema}. Tom {tom} com transições rápidas e chamada final para ação clara.',
    default_model_id: 'kling-v4-turbo',
    placeholders: ['produto', 'tema', 'tom'],
    is_favorite: true,
    usage_count: 14,
  },
  {
    name: 'Banner Editorial High Impact Neon',
    description: 'Composição visual para feed e carrossel com tipografia marcante.',
    category: 'image',
    template_text:
      'Banner publicitário moderno destacando {produto}, atmosfera neon com paleta {tom}, tipografia flutuante em Archivo Black sobre {tema}, iluminação de estúdio profissional 8k.',
    default_model_id: 'nano-banana-2-flash',
    placeholders: ['produto', 'tom', 'tema'],
    is_favorite: true,
    usage_count: 22,
  },
  {
    name: 'Locução Promocional com Prosódia Natural',
    description: 'Narração de 15s para reels, stories ou vinheta de podcast.',
    category: 'audio',
    template_text:
      'Locução dinâmica e envolvente em português brasileiro para {produto}: "Você já parou para pensar em como {tema} pode transformar sua rotina? Descubra o método definitivo agora mesmo."',
    default_model_id: 'gemini-3-8-flash-tts',
    placeholders: ['produto', 'tema'],
    is_favorite: true,
    usage_count: 18,
  },
  {
    name: 'Jingle Comercial & Assinatura Sonora',
    description: 'Roteiro sonoro rítmico com gancho marcante e tagline cantada.',
    category: 'audio',
    template_text:
      'Jingle comercial contagiante e memorável para {produto}. Ritmo {ritmo}, tom {tom}. Letra curta focada no benefício de {tema}, finalizando com o slogan de 3 segundos em alta energia.',
    default_model_id: 'gemini-3-8-flash-tts',
    placeholders: ['produto', 'ritmo', 'tom', 'tema'],
    is_favorite: true,
    usage_count: 15,
  },
  {
    name: 'Narrativa Documental / Storytelling Intimista',
    description: 'Voz profunda e cadenciada para vídeos reflexivos e institucionais.',
    category: 'audio',
    template_text:
      'Locução em tom confessional e cinematográfico sobre {tema}. Respiração suave, pausas dramáticas para ressaltar o impacto de {produto}. Ambiente sonoro envolvente no tom {tom}.',
    default_model_id: 'gemini-3-8-flash-tts',
    placeholders: ['tema', 'produto', 'tom'],
    is_favorite: false,
    usage_count: 12,
  },
  {
    name: 'Anúncio Falado de Venda Rápida (Direct Response)',
    description: 'Spot de áudio de 30s com estrutura Dor → Solução → Oferta Urgente.',
    category: 'audio',
    template_text:
      'Spot publicitário em áudio para rádio e streaming. Locutor dinâmico no tom {tom}: "Cansado de perder tempo com {problema}? Apresentamos {produto}, a forma mais rápida de dominar {tema}. Acesse o link agora."',
    default_model_id: 'gemini-3-8-flash-tts',
    placeholders: ['problema', 'produto', 'tema', 'tom'],
    is_favorite: false,
    usage_count: 14,
  },
  {
    name: 'Vinheta de Abertura / Podcast Intro',
    description: 'Intro energética com apresentação do host, tema do episódio e patrocinador.',
    category: 'audio',
    template_text:
      'Abertura curta e profissional de podcast: "Seja muito bem-vindo ao podcast oficial! Hoje desvendamos os segredos de {tema} com o apoio especial de {produto}. Prepare-se para insights práticos no tom {tom}."',
    default_model_id: 'gemini-3-8-flash-tts',
    placeholders: ['tema', 'produto', 'tom'],
    is_favorite: false,
    usage_count: 10,
  },
  {
    name: 'Reels / TikTok Viral Dinâmico (UGC Hook)',
    description:
      'Abertura em primeira pessoa com gancho em 3 segundos, cortes rápidos e chamada direta.',
    category: 'video',
    template_text:
      'Vídeo vertical 9:16 de alta energia para {nicho}. Criador segura {produto} em primeiro plano com iluminação de estúdio natural. Gancho magnético nos primeiros 3s: "{gancho}". Edição dinâmica com cortes a cada 1.5s, legendas cinéticas flutuantes e encerramento com CTA: "{cta}".',
    default_model_id: 'runway-gen3-alpha-turbo',
    placeholders: ['nicho', 'produto', 'gancho', 'cta'],
    is_favorite: true,
    usage_count: 32,
  },
  {
    name: 'Comercial Cinematográfico de Produto (Macro Glow)',
    description:
      'Cenas em câmera lenta 60fps com iluminação volumétrica e transição fluida para branding premium.',
    category: 'video',
    template_text:
      'Comercial cinematográfico de 15 segundos para {produto}. Câmera com lente anamórfica em movimento slow-motion circular suave revelando textura, reflexos sofisticados e atmosfera {estilo}. Iluminação volumétrica em tons {paleta}, partículas no ar e transição final para logo minimalista.',
    default_model_id: 'sora-2-pro',
    placeholders: ['produto', 'estilo', 'paleta'],
    is_favorite: true,
    usage_count: 27,
  },
  {
    name: 'Tutorial Passo a Passo em 3 Atos',
    description:
      'Estrutura didática Dor → Solução Rápida → Resultado Prático, perfeita para autoridade.',
    category: 'video',
    template_text:
      'Vídeo explicativo e didático sobre {tema}. Ato 1: demonstrar o erro comum que causa {dor}. Ato 2: tela dividida mostrando o método correto com {ferramenta} em 3 passos simples. Ato 3: tela com o resultado final e convite para salvar o conteúdo.',
    default_model_id: 'luma-dream-machine',
    placeholders: ['tema', 'dor', 'ferramenta'],
    is_favorite: false,
    usage_count: 19,
  },
  {
    name: 'Vlog Pessoal / Storytelling de Bastidores',
    description:
      'Tom documental autêntico, câmera na mão e estética natural de rotina de criador/agência.',
    category: 'video',
    template_text:
      'Vídeo no estilo vlog de bastidores em {ambiente}. Câmera na mão com leve tremor orgânico e ângulo documental. O criador compartilha a rotina de produção de {projeto}, alternando entre tela de trabalho e reflexão sincera em tom {tom}.',
    default_model_id: 'kling-1-5-pro',
    placeholders: ['ambiente', 'projeto', 'tom'],
    is_favorite: false,
    usage_count: 15,
  },
  {
    name: 'Anúncio de Impacto para Tráfego Pago (Direct Response)',
    description:
      'Gancho de quebra de padrão nos primeiros 2s, demonstração de valor e CTA urgente.',
    category: 'video',
    template_text:
      'Criativo de anúncio de alta conversão para {publico_alvo}. Tela com gancho visual disruptivo: "{problema_urgente}". Transição ágil para demonstração dos 3 benefícios de {oferta}, texto de apoio em alto contraste e botão de ação pulsante: "{cta_final}".',
    default_model_id: 'runway-gen3-alpha-turbo',
    placeholders: ['publico_alvo', 'problema_urgente', 'oferta', 'cta_final'],
    is_favorite: false,
    usage_count: 22,
  },
  {
    name: 'Demonstração de Produto / Unboxing',
    description: 'Vídeo cinematográfico focado em detalhes e textura do produto.',
    category: 'video',
    template_text:
      'Close-up detalhado de {produto} em mesa minimalista, transição de foco suave, ressaltando os benefícios de {tema}. Estética {tom} com acabamento cinematográfico 4K.',
    default_model_id: 'seedance-draft',
    placeholders: ['produto', 'tema', 'tom'],
    is_favorite: false,
    usage_count: 6,
  },
  {
    name: 'Capa de Carrossel de Dicas Estratégicas',
    description: 'Design de alto impacto para carrossel educativo no Instagram ou LinkedIn.',
    category: 'image',
    template_text:
      'Arte geométrica e elegante para post sobre {tema}. Destaque central para o conceito de {produto}, fundo contrastante {tom}, layout diagramado para alta taxa de salvamento.',
    default_model_id: 'gpt-image-2-5',
    placeholders: ['tema', 'produto', 'tom'],
    is_favorite: false,
    usage_count: 11,
  },
]

/**
 * Busca templates salvos do usuário ou da marca
 */
export async function getStudioPromptTemplates(
  userId?: string,
  category?: 'video' | 'image' | 'audio' | 'geral',
): Promise<StudioPromptTemplate[]> {
  try {
    const filters: string[] = []
    if (userId) filters.push(`user = '${userId}'`)
    if (category && category !== 'geral')
      filters.push(`(category = '${category}' || category = 'geral')`)

    const res = await pb.collection('studio_prompt_templates').getList(1, 50, {
      filter: filters.length > 0 ? filters.join(' && ') : undefined,
      sort: '-is_favorite,-usage_count,-created',
    })

    if (res.items.length > 0) {
      return res.items.map((item: any) => ({
        id: item.id,
        user: item.user,
        brand: item.brand,
        name: item.name,
        description: item.description,
        category: item.category,
        template_text: item.template_text,
        default_model_id: item.default_model_id,
        placeholders: Array.isArray(item.placeholders)
          ? item.placeholders
          : extractPlaceholders(item.template_text || ''),
        is_favorite: Boolean(item.is_favorite),
        usage_count: item.usage_count || 0,
        created: item.created,
        updated: item.updated,
      }))
    }
  } catch (err) {
    console.warn('Não foi possível buscar studio_prompt_templates do banco, usando defaults:', err)
  }

  // Fallback com templates padrão filtrados
  const filtered =
    category && category !== 'geral'
      ? DEFAULT_STUDIO_TEMPLATES.filter((t) => t.category === category || t.category === 'geral')
      : DEFAULT_STUDIO_TEMPLATES

  return filtered.map((t, idx) => ({
    ...t,
    id: `default-${idx}`,
    user: userId || 'demo-user',
    created: new Date().toISOString(),
  }))
}

/**
 * Salva novo template de prompt
 */
export async function createStudioPromptTemplate(
  input: CreatePromptTemplateInput,
): Promise<StudioPromptTemplate> {
  const placeholders = extractPlaceholders(input.template_text)

  try {
    const record = await pb.collection('studio_prompt_templates').create({
      user: input.userId,
      brand: input.brandId || null,
      name: input.name.trim(),
      description: (input.description || '').trim(),
      category: input.category,
      template_text: input.template_text.trim(),
      default_model_id: input.default_model_id || null,
      placeholders,
      is_favorite: Boolean(input.is_favorite),
      usage_count: 0,
    })

    return {
      id: record.id,
      user: record.user,
      brand: record.brand,
      name: record.name,
      description: record.description,
      category: record.category,
      template_text: record.template_text,
      default_model_id: record.default_model_id,
      placeholders,
      is_favorite: Boolean(record.is_favorite),
      usage_count: record.usage_count || 0,
      created: record.created,
      updated: record.updated,
    }
  } catch (err) {
    console.warn('Falha ao criar template de prompt no banco, usando objeto local:', err)
    return {
      id: `local-template-${Date.now()}`,
      user: input.userId,
      brand: input.brandId,
      name: input.name,
      description: input.description,
      category: input.category,
      template_text: input.template_text,
      default_model_id: input.default_model_id,
      placeholders,
      is_favorite: Boolean(input.is_favorite),
      usage_count: 0,
      created: new Date().toISOString(),
    }
  }
}

/**
 * Atualiza template existente
 */
export async function updateStudioPromptTemplate(
  templateId: string,
  updates: Partial<StudioPromptTemplate>,
): Promise<StudioPromptTemplate> {
  const payload: any = { ...updates }
  if (updates.template_text) {
    payload.placeholders = extractPlaceholders(updates.template_text)
  }

  try {
    const record = await pb.collection('studio_prompt_templates').update(templateId, payload)
    return {
      id: record.id,
      user: record.user,
      brand: record.brand,
      name: record.name,
      description: record.description,
      category: record.category,
      template_text: record.template_text,
      default_model_id: record.default_model_id,
      placeholders: record.placeholders || extractPlaceholders(record.template_text),
      is_favorite: Boolean(record.is_favorite),
      usage_count: record.usage_count || 0,
      created: record.created,
      updated: record.updated,
    }
  } catch (err) {
    console.warn('Falha ao atualizar template no banco:', err)
    return {
      id: templateId,
      user: updates.user || 'demo-user',
      name: updates.name || 'Template',
      category: updates.category || 'geral',
      template_text: updates.template_text || '',
      placeholders: extractPlaceholders(updates.template_text || ''),
      ...updates,
    } as StudioPromptTemplate
  }
}

/**
 * Exclui template de prompt
 */
export async function deleteStudioPromptTemplate(templateId: string): Promise<boolean> {
  try {
    await pb.collection('studio_prompt_templates').delete(templateId)
    return true
  } catch (err) {
    console.warn('Falha ao excluir template do banco:', err)
    return false
  }
}

/**
 * Incrementa contagem de uso do template
 */
export async function incrementTemplateUsage(templateId: string, currentCount = 0): Promise<void> {
  if (templateId.startsWith('default-') || templateId.startsWith('local-')) return
  try {
    await pb.collection('studio_prompt_templates').update(templateId, {
      usage_count: currentCount + 1,
    })
  } catch {
    /* intentionally ignored */
  }
}
