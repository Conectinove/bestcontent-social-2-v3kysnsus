import { pb } from '@/lib/pocketbase/client'
import type { StudioMediaType, StudioQualityTier } from './ai-studio'

export interface StudioPromptHistoryItem {
  id: string
  user?: string
  prompt: string
  media_type: StudioMediaType
  model_id?: string
  model_name?: string
  quality_tier?: StudioQualityTier
  relative_cost?: number
  aspect_ratio?: string
  created?: string
}

export interface RecordPromptHistoryParams {
  userId?: string
  prompt: string
  mediaType: StudioMediaType
  modelId?: string
  modelName?: string
  qualityTier?: StudioQualityTier
  relativeCost?: number
  aspectRatio?: string
}

const LOCAL_STORAGE_KEY = 'midiaviva_studio_prompt_history'

function getLocalHistory(): StudioPromptHistoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fallback */
  }
  return [
    {
      id: 'local-hist-1',
      prompt:
        'Kling 4.0 comercial com iluminação volumétrica, close em produto e transição orbital fluida',
      media_type: 'video',
      model_id: 'kling-4-0',
      model_name: 'Kling 4.0',
      quality_tier: 'padrao',
      relative_cost: 0.71,
      created: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'local-hist-2',
      prompt: 'Banner editorial neon High Impact com tipografia flutuante e paleta roxa/magenta',
      media_type: 'image',
      model_id: 'flux-3-max-image',
      model_name: 'FLUX 3 Max Ultra',
      quality_tier: 'ultra',
      relative_cost: 0.76,
      created: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'local-hist-3',
      prompt:
        'Locução comercial em português com entonação de autoridade e trilha sub-grave em fade-in',
      media_type: 'audio',
      model_id: 'gemini-voice-tts',
      model_name: 'Gemini Omni Voice TTS',
      quality_tier: 'padrao',
      relative_cost: 0.45,
      created: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ]
}

function saveLocalHistory(list: StudioPromptHistoryItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list.slice(0, 50)))
  } catch {
    /* ignore */
  }
}

/**
 * Registra um prompt enviado na coleção studio_prompt_history
 */
export async function recordStudioPromptHistory(
  params: RecordPromptHistoryParams,
): Promise<StudioPromptHistoryItem> {
  const localItem: StudioPromptHistoryItem = {
    id: `hist-${Date.now()}`,
    user: params.userId,
    prompt: params.prompt.trim(),
    media_type: params.mediaType,
    model_id: params.modelId,
    model_name: params.modelName,
    quality_tier: params.qualityTier,
    relative_cost: params.relativeCost,
    aspect_ratio: params.aspectRatio,
    created: new Date().toISOString(),
  }

  // Atualiza cache local imediatamente
  const localList = getLocalHistory().filter((h) => h.prompt !== localItem.prompt)
  saveLocalHistory([localItem, ...localList])

  try {
    const record = await pb.collection('studio_prompt_history').create({
      user: params.userId || null,
      prompt: params.prompt.trim(),
      media_type: params.mediaType,
      model_id: params.modelId || null,
      model_name: params.modelName || null,
      quality_tier: params.qualityTier || null,
      relative_cost: params.relativeCost || null,
      aspect_ratio: params.aspectRatio || null,
    })

    return {
      id: record.id,
      user: record.user,
      prompt: record.prompt,
      media_type: record.media_type as StudioMediaType,
      model_id: record.model_id,
      model_name: record.model_name,
      quality_tier: record.quality_tier as StudioQualityTier,
      relative_cost: record.relative_cost,
      aspect_ratio: record.aspect_ratio,
      created: record.created,
    }
  } catch (err) {
    console.warn('Falha ao persistir prompt history no PocketBase, usando cache local:', err)
    return localItem
  }
}

/**
 * Lista histórico de prompts do usuário
 */
export async function getStudioPromptHistory(
  userId?: string,
  mediaType?: StudioMediaType,
): Promise<StudioPromptHistoryItem[]> {
  try {
    const filters: string[] = []
    if (userId) filters.push(`user = '${userId}'`)
    if (mediaType && mediaType !== 'geral') filters.push(`media_type = '${mediaType}'`)

    const records = await pb.collection('studio_prompt_history').getFullList({
      filter: filters.length > 0 ? filters.join(' && ') : undefined,
      sort: '-created',
      requestKey: null,
    })

    if (records.length > 0) {
      return records.map((r: any) => ({
        id: r.id,
        user: r.user,
        prompt: r.prompt,
        media_type: (r.media_type as StudioMediaType) || 'geral',
        model_id: r.model_id,
        model_name: r.model_name,
        quality_tier: r.quality_tier as StudioQualityTier,
        relative_cost: r.relative_cost,
        aspect_ratio: r.aspect_ratio,
        created: r.created,
      }))
    }
  } catch (err) {
    console.warn('Aviso ao carregar prompt history do PocketBase, usando cache local:', err)
  }

  const local = getLocalHistory()
  if (mediaType && mediaType !== 'geral') {
    return local.filter((h) => h.media_type === mediaType)
  }
  return local
}

/**
 * Exclui um item do histórico
 */
export async function deleteStudioPromptHistoryItem(id: string): Promise<boolean> {
  const current = getLocalHistory()
  saveLocalHistory(current.filter((item) => item.id !== id))

  if (!id.startsWith('hist-') && !id.startsWith('local-')) {
    try {
      await pb.collection('studio_prompt_history').delete(id)
      return true
    } catch {
      /* ignore */
    }
  }
  return true
}
