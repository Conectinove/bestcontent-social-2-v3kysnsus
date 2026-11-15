/**
 * Serviço do "Assistente de Edição" — agente NATIVO do Skip Cloud
 * (edit-assistant-agent, migrations 0104/0105; rota POST
 * /backend/v1/ai/edit-assistant em pocketbase/hooks/ai_edit_assistant.js).
 * Recebe o estado atual da Edição Avançada + contexto da mídia e devolve
 * sugestões concretas e aplicáveis. O fallback determinístico vive no hook
 * (sempre há resposta utilizável, mesmo sem IA configurada).
 */
import pb from '@/lib/pocketbase/client'

export interface EditAssistantResult {
  success: boolean
  source: 'agent' | 'fallback'
  advice: string[]
  suggestedSettings: Record<string, number> | null
  summary: string
}

export async function askEditAssistant(input: {
  mediaTitle?: string
  mediaPrompt?: string
  network?: string
  aspectRatio?: string
  question?: string
  settings: unknown
}): Promise<EditAssistantResult> {
  try {
    const res = await pb.send<EditAssistantResult>('/backend/v1/ai/edit-assistant', {
      method: 'POST',
      body: {
        mediaTitle: input.mediaTitle || '',
        mediaPrompt: input.mediaPrompt || '',
        network: input.network || 'Instagram',
        aspectRatio: input.aspectRatio || '16:9',
        question: input.question || '',
        settings: input.settings,
      },
    })
    return {
      success: !!res?.success,
      source: res?.source === 'agent' ? 'agent' : 'fallback',
      advice: Array.isArray(res?.advice) ? res.advice : [],
      suggestedSettings:
        res?.suggestedSettings && typeof res.suggestedSettings === 'object'
          ? res.suggestedSettings
          : null,
      summary: res?.summary || '',
    }
  } catch {
    return {
      success: false,
      source: 'fallback',
      advice: [],
      suggestedSettings: null,
      summary: 'Assistente de edição indisponível agora — tente novamente em instantes.',
    }
  }
}
