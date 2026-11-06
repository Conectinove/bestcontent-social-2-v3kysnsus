import { pb } from '@/lib/pocketbase/client'

export interface StudioExternalMediaStatus {
  configured: boolean
  openaiConfigured?: boolean
  imageGenerationReady?: boolean
  audioTtsReady?: boolean
  videoGenerationReady?: boolean
  hasApiKey: boolean
  provider: string
  badge: 'Dados Oficiais (API Externa)' | 'Estimativa Calibrada (Modo Local)'
  message: string
}

export type ExternalMediaApiStatus = StudioExternalMediaStatus

export interface GeneratedExternalMediaResult {
  success: boolean
  isExternalApi: boolean
  apiProvider: string
  previewUrl?: string
  revisedPrompt?: string
  notes: string
}

/**
 * Consulta status das integrações de mídia externas no backend
 */
export async function getStudioExternalMediaStatus(): Promise<StudioExternalMediaStatus> {
  try {
    const res = await pb.send('/backend/v1/studio/external-media-status', {
      method: 'GET',
    })
    const isReady = Boolean(res?.openai_configured)
    return {
      configured: isReady,
      openaiConfigured: isReady,
      hasApiKey: isReady,
      provider: 'OpenAI (DALL·E 3 / TTS-1)',
      imageGenerationReady: Boolean(res?.image_generation_ready),
      audioTtsReady: Boolean(res?.audio_tts_ready),
      videoGenerationReady: Boolean(res?.video_generation_ready),
      badge:
        res?.badge ||
        (isReady ? 'Dados Oficiais (API Externa)' : 'Estimativa Calibrada (Modo Local)'),
      message:
        res?.message ||
        (isReady
          ? 'API OpenAI ativa para imagens e áudio.'
          : 'Modo local ativo com fallback calibrado.'),
    }
  } catch (err) {
    return {
      configured: false,
      openaiConfigured: false,
      hasApiKey: false,
      provider: 'OpenAI (DALL·E 3 / TTS-1)',
      imageGenerationReady: false,
      audioTtsReady: false,
      videoGenerationReady: false,
      badge: 'Estimativa Calibrada (Modo Local)',
      message: 'Modo local calibrado ativo (sem chave OpenAI configurada).',
    }
  }
}

// Alias para compatibilidade
export const checkExternalMediaApiStatus = getStudioExternalMediaStatus

/**
 * Solicita geração externa ou fallback no endpoint do backend
 */
export async function requestExternalMediaGeneration(params: {
  prompt: string
  type: 'image' | 'audio' | 'video'
  modelId?: string
  style?: string
}): Promise<GeneratedExternalMediaResult> {
  try {
    const res = await pb.send('/backend/v1/studio/generate-media', {
      method: 'POST',
      body: JSON.stringify({
        prompt: params.prompt,
        type: params.type,
        model_id: params.modelId,
        style: params.style,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    return {
      success: Boolean(res?.success),
      isExternalApi: Boolean(res?.is_external_api),
      apiProvider: res?.api_provider || 'Local Calibrated Studio',
      previewUrl: res?.preview_url,
      revisedPrompt: res?.revised_prompt,
      notes: res?.notes || 'Processado pelo estúdio.',
    }
  } catch (err: any) {
    return {
      success: false,
      isExternalApi: false,
      apiProvider: 'Local Calibrated Studio',
      notes: err?.message || 'Falha na requisição, utilizando fallback local.',
    }
  }
}
