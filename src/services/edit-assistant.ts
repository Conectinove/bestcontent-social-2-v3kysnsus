/**
 * Serviço do "Assistente de Edição" — agente NATIVO do Skip Cloud
 * (edit-assistant-agent, migration 0104). Analisa o estado atual da Edição
 * Avançada e sugere melhorias concretas (advice + suggestedSettings).
 * O fallback determinístico vive no hook (sempre há resposta aplicável).
 */
import pb from '@/lib/pocketbase/client'

export interface EditAssistantSuggestion {
  success: boolean
  source: 'agent' | 'fallback'
  summary: string
  advice: string[]
  suggestedSettings: Record<string, number> | null
}

export async function askEditAssistant(input: {
  mediaTitle?: string
  mediaPrompt?: string
  network?: string
  aspectRatio?: string
  question?: string
  settings: unknown
}): Promise<EditAssistantSuggestion> {
  try {
    const res = await pb.send<EditAssistantSuggestion>('/backend/v1/ai/edit-assistant', {
      method: 'POST',
      body: {
        mediaTitle: input.mediaTitle || '',
        mediaPrompt: input.mediaPrompt || '',
        network: input.network || '',
        aspectRatio: input.aspectRatio || '',
        question: input.question || '',
        settings: input.settings,
      },
    })
    return {
      success: !!res?.success,
      source: res?.source === 'agent' ? 'agent' : 'fallback',
      summary: res?.summary || '',
      advice: Array.isArray(res?.advice) ? res.advice : [],
      suggestedSettings: res?.suggestedSettings || null,
    }
  } catch {
    return {
      success: false,
      source: 'fallback',
      summary: 'Assistente indisponível agora — tente novamente em instantes.',
      advice: [],
      suggestedSettings: null,
    }
  }
}
