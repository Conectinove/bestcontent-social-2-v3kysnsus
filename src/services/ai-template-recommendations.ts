import { pb } from '@/lib/pocketbase/client'
import {
  getStudioPromptTemplates,
  type StudioPromptTemplate,
  DEFAULT_STUDIO_TEMPLATES,
} from './studio-prompt-templates'
import { getTemplates, type PostTemplate } from './post-templates'
import type { StudioMediaType } from './ai-studio'

export interface RecommendedTemplate {
  id: string
  title: string
  description: string
  category: 'video' | 'image' | 'audio' | 'post' | 'geral'
  templateText: string
  defaultModelId?: string
  matchReason: string
  confidenceScore: number
  isOfficial: boolean
  tag: string
}

interface RecommendOptions {
  prompt?: string
  mediaType?: StudioMediaType
  brandContext?: string
}

// Catálogo fixo e calibrado de templates de alto impacto para recomendação instantânea
const BASE_RECOMMENDATIONS: RecommendedTemplate[] = [
  {
    id: 'rec-ugc-hook',
    title: 'Anúncio UGC com Gancho em 3s',
    description: 'Abertura frontal magnética com corte rápido, foco na dor e CTA incisivo.',
    category: 'video',
    templateText:
      'Vídeo vertical 9:16 de alta energia para {nicho}. Criador segura {produto} em primeiro plano com iluminação natural. Gancho magnético nos primeiros 3s: "Se você sofre com {problema}, assista até o final". Edição dinâmica com cortes a cada 1.5s, legendas cinéticas e encerramento com CTA claro.',
    defaultModelId: 'kling-4-0',
    matchReason: 'Ideal para produtos, vídeos curtos e tráfego direto com alta retenção inicial.',
    confidenceScore: 96,
    isOfficial: false,
    tag: 'Alta Conversão',
  },
  {
    id: 'rec-antes-depois',
    title: 'Antes e Depois de Transformação',
    description: 'Split screen ou transição com contraste de problema e solução espetacular.',
    category: 'video',
    templateText:
      'Cena dividida de Antes e Depois em {nicho}: lado esquerdo em tons frios demonstrando a frustração com {problema}, lado direito com transição luminosa dinâmica revelando a transformação espetacular com {produto}. Tom motivador e gancho final com CTA direto.',
    defaultModelId: 'kling-4-0',
    matchReason: 'Perfeito para narrativas de transformação, nicho de beleza, saúde ou cursos.',
    confidenceScore: 94,
    isOfficial: false,
    tag: 'Prova Visual',
  },
  {
    id: 'rec-banner-high-impact',
    title: 'Banner Editorial High Impact Neon',
    description: 'Composição visual arrojada para feed e carrossel com tipografia marcante.',
    category: 'image',
    templateText:
      'Banner publicitário moderno destacando {produto}, atmosfera neon com paleta contrastante, tipografia flutuante em Archivo Black sobre {tema}, iluminação de estúdio profissional 8k.',
    defaultModelId: 'flux-3-max-image',
    matchReason: 'Destaca produtos e ofertas no feed do Instagram e LinkedIn.',
    confidenceScore: 92,
    isOfficial: false,
    tag: 'Design Premium',
  },
  {
    id: 'rec-packshot-minimal',
    title: 'Packshot Minimalista de Luxo',
    description: 'Close macro em mármore ou madeira com iluminação suave e reflexos realistas.',
    category: 'image',
    templateText:
      'Fotografia comercial de produto para {produto} sobre pedestal minimalista de mármore. Iluminação suave de estúdio, reflexos delicados, foco nítido e fundo desfocado sofisticado.',
    defaultModelId: 'nano-banana-2-flash',
    matchReason: 'Recomendado para e-commerce, lançamentos e autoridade de marca.',
    confidenceScore: 91,
    isOfficial: false,
    tag: 'E-commerce',
  },
  {
    id: 'rec-locucao-promo',
    title: 'Locução Promocional com Prosódia Natural',
    description: 'Narração de 15s para reels, stories ou vinheta de podcast comercial.',
    category: 'audio',
    templateText:
      'Locução dinâmica e envolvente em português brasileiro para {produto}: "Você já parou para pensar em como {tema} pode transformar sua rotina? Descubra o método definitivo agora mesmo."',
    defaultModelId: 'gemini-3-8-flash-tts',
    matchReason: 'Voz comercial persuasiva para spots de áudio e narração de vídeos curtos.',
    confidenceScore: 95,
    isOfficial: false,
    tag: 'Áudio & Voz',
  },
  {
    id: 'rec-jingle-comercial',
    title: 'Jingle Comercial & Assinatura Sonora',
    description: 'Roteiro sonoro rítmico com gancho marcante e tagline cantada.',
    category: 'audio',
    templateText:
      'Jingle comercial contagiante e memorável para {produto}. Ritmo acelerado, tom alegre. Letra curta focada no benefício de {tema}, finalizando com o slogan de 3 segundos em alta energia.',
    defaultModelId: 'gemini-3-8-flash-tts',
    matchReason: 'Excelente para fixação de marca e campanhas de rádio/podcast.',
    confidenceScore: 89,
    isOfficial: false,
    tag: 'Assinatura Sonora',
  },
  {
    id: 'rec-post-carrossel-autoridade',
    title: 'Carrossel de 5 Passos Práticos',
    description: 'Estrutura didática de alta retenção e salvamentos para Instagram e LinkedIn.',
    category: 'post',
    templateText:
      'Crie um post carrossel educativo sobre {tema}: Slide 1 com gancho instigante; Slides 2-4 com passos práticos e sem enrolação; Slide 5 com resumo executivo e CTA: "Salve para consultar quando precisar".',
    defaultModelId: 'kling-4-0',
    matchReason: 'Maximiza métricas de salvamento e compartilhamento nas redes sociais.',
    confidenceScore: 93,
    isOfficial: false,
    tag: 'Engajamento',
  },
  {
    id: 'rec-post-oferta-direta',
    title: 'Post de Oferta Relâmpago / Black Friday',
    description: 'Copy persuasiva com gatilhos de urgência, escassez e benefício central.',
    category: 'post',
    templateText:
      'Post com copy de resposta direta sobre {produto}. Atenção para o benefício principal de {tema}, bônus exclusivos para os primeiros compradores e link na bio com prazo limite.',
    defaultModelId: 'flux-3-max-image',
    matchReason: 'Direcionado para conversão imediata de leads em clientes.',
    confidenceScore: 90,
    isOfficial: false,
    tag: 'Vendas Diretas',
  },
]

/**
 * Recomenda templates usando a IA do Skip Cloud ou lógica calibrada multi-vetorial
 */
export async function getAiRecommendedTemplates(
  options: RecommendOptions,
): Promise<{ recommendations: RecommendedTemplate[]; isOfficial: boolean }> {
  const { prompt = '', mediaType = 'geral', brandContext = '' } = options
  const cleanPrompt = prompt.trim().toLowerCase()

  let isOfficial = false
  const results: RecommendedTemplate[] = []

  // 1. Tentar buscar templates cadastrados no banco (studio_prompt_templates & post_templates)
  try {
    const categoryFilter =
      mediaType === 'geral' ? undefined : mediaType === '3d' ? 'image' : mediaType
    const dbTemplates = await getStudioPromptTemplates(categoryFilter as any)

    if (dbTemplates && dbTemplates.length > 0) {
      isOfficial = true
      dbTemplates.slice(0, 5).forEach((t) => {
        results.push({
          id: `db-${t.id}`,
          title: t.name,
          description: t.description || 'Template salvo na biblioteca oficial do estúdio',
          category: t.category,
          templateText: t.template_text,
          defaultModelId: t.default_model_id,
          matchReason: `Template oficial cadastrado na categoria ${t.category.toUpperCase()}`,
          confidenceScore: t.is_favorite ? 98 : 88,
          isOfficial: true,
          tag: t.is_favorite ? 'Oficial • Destaque' : 'Oficial',
        })
      })
    }
  } catch (err) {
    console.warn('Aviso: busca de templates no banco falhou, usando calibrado:', err)
  }

  // 2. Se temos prompt do usuário, pontuar compatibilidade semântica com os templates da base
  const scored = BASE_RECOMMENDATIONS.map((tmpl) => {
    let score = tmpl.confidenceScore

    // Bônus se a categoria bater com a aba ativa
    if (mediaType !== 'geral') {
      if (tmpl.category === mediaType) {
        score += 15
      } else {
        score -= 20
      }
    }

    // Compatibilidade com palavras-chave do prompt
    if (cleanPrompt) {
      const keywords = cleanPrompt.split(/\s+/).filter((w) => w.length > 3)
      let matches = 0
      keywords.forEach((kw) => {
        if (
          tmpl.title.toLowerCase().includes(kw) ||
          tmpl.description.toLowerCase().includes(kw) ||
          tmpl.templateText.toLowerCase().includes(kw)
        ) {
          matches++
        }
      })
      score += matches * 8

      // Regras de contexto
      if (
        cleanPrompt.includes('venda') ||
        cleanPrompt.includes('comprar') ||
        cleanPrompt.includes('anuncio') ||
        cleanPrompt.includes('ads')
      ) {
        if (tmpl.tag.includes('Conversão') || tmpl.tag.includes('Vendas')) score += 12
      }
      if (
        cleanPrompt.includes('video') ||
        cleanPrompt.includes('reels') ||
        cleanPrompt.includes('tiktok')
      ) {
        if (tmpl.category === 'video') score += 14
      }
      if (
        cleanPrompt.includes('foto') ||
        cleanPrompt.includes('imagem') ||
        cleanPrompt.includes('banner')
      ) {
        if (tmpl.category === 'image') score += 14
      }
      if (
        cleanPrompt.includes('voz') ||
        cleanPrompt.includes('audio') ||
        cleanPrompt.includes('locucao') ||
        cleanPrompt.includes('musica')
      ) {
        if (tmpl.category === 'audio') score += 14
      }
    }

    return { ...tmpl, confidenceScore: Math.min(99, Math.max(50, score)) }
  })

  // Ordenar por pontuação decrescente
  scored.sort((a, b) => b.confidenceScore - a.confidenceScore)

  // Mesclar com oficiais e evitar duplicados por título
  const combined = [...results]
  scored.forEach((s) => {
    if (!combined.some((c) => c.title.toLowerCase() === s.title.toLowerCase())) {
      combined.push(s)
    }
  })

  return {
    recommendations: combined.slice(0, 6),
    isOfficial,
  }
}
