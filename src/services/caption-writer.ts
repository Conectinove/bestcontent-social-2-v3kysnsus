/**
 * Serviço do "Redator de Legendas" — agente NATIVO do Skip Cloud
 * (caption-writer-agent, migration 0106). Recebe o texto/tema do post, a rede
 * e o tom de voz e devolve legenda pronta + variantes. O fallback
 * determinístico vive no hook (sempre há resposta aplicável).
 */
import pb from '@/lib/pocketbase/client'

export interface CaptionWriterResult {
  success: boolean
  source: 'agent' | 'fallback'
  caption: string
  hook: string
  cta: string
  hashtags: string[]
  variants: string[]
  summary: string
}

export async function generateCaption(input: {
  content: string
  network?: string
  tone?: string
  goal?: string
  hashtagsCount?: number
}): Promise<CaptionWriterResult> {
  try {
    const res = await pb.send<CaptionWriterResult>('/backend/v1/ai/caption-writer', {
      method: 'POST',
      body: {
        content: input.content || '',
        network: input.network || 'Instagram',
        tone: input.tone || '',
        goal: input.goal || 'engajar',
        hashtagsCount: input.hashtagsCount || 5,
      },
    })
    return {
      success: !!res?.success,
      source: res?.source === 'agent' ? 'agent' : 'fallback',
      caption: res?.caption || '',
      hook: res?.hook || '',
      cta: res?.cta || '',
      hashtags: Array.isArray(res?.hashtags) ? res.hashtags : [],
      variants: Array.isArray(res?.variants) ? res.variants : [],
      summary: res?.summary || '',
    }
  } catch {
    return {
      success: false,
      source: 'fallback',
      caption: '',
      hook: '',
      cta: '',
      hashtags: [],
      variants: [],
      summary: 'Redator de legendas indisponível agora — tente novamente em instantes.',
    }
  }
}
