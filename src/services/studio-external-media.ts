import { pb } from '@/lib/pocketbase/client'

export interface StudioExternalMediaStatus {
  configured: boolean
  openaiConfigured?: boolean
  lumaConfigured?: boolean
  runwayConfigured?: boolean
  imageGenerationReady?: boolean
  audioTtsReady?: boolean
  videoGenerationReady?: boolean
  videoProvider?: string
  videoTech?: 'luma' | 'runway' | 'openai' | 'local'
  hasApiKey: boolean
  provider: string
  secrets?: Record<string, string>
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
    const hasAny = Boolean(
      res?.openai_configured ||
      res?.luma_configured ||
      res?.runway_configured ||
      res?.video_generation_ready,
    )
    return {
      configured: hasAny,
      openaiConfigured: Boolean(res?.openai_configured),
      lumaConfigured: Boolean(res?.luma_configured),
      runwayConfigured: Boolean(res?.runway_configured),
      hasApiKey: hasAny,
      provider: res?.video_provider || 'OpenAI / Luma / Runway',
      imageGenerationReady: Boolean(res?.image_generation_ready),
      audioTtsReady: Boolean(res?.audio_tts_ready),
      videoGenerationReady: Boolean(res?.video_generation_ready),
      videoProvider: res?.video_provider,
      videoTech: res?.video_tech || 'local',
      secrets: res?.secrets,
      badge:
        res?.badge ||
        (hasAny ? 'Dados Oficiais (API Externa)' : 'Estimativa Calibrada (Modo Local)'),
      message:
        res?.message ||
        (hasAny ? 'APIs de mídia externas ativas.' : 'Modo local ativo com fallback calibrado.'),
    }
  } catch (err) {
    return {
      configured: false,
      openaiConfigured: false,
      lumaConfigured: false,
      runwayConfigured: false,
      hasApiKey: false,
      provider: 'OpenAI / Luma / Runway',
      imageGenerationReady: false,
      audioTtsReady: false,
      videoGenerationReady: false,
      videoProvider: 'Estimativa Calibrada (Modo Local)',
      videoTech: 'local',
      badge: 'Estimativa Calibrada (Modo Local)',
      message: 'Modo local calibrado ativo (sem chaves de API externas configuradas).',
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
