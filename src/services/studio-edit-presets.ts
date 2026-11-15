import pb from '@/lib/pocketbase/client'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'

export interface StudioEditPreset {
  id: string
  name: string
  settings: AdvancedCustomizationState
  /** Compartilhado com a equipe da mesma empresa (migration 0112). */
  is_shared: boolean
  /** Dono do preset (relation users). */
  user: string
  created: string
  updated: string
}

/**
 * CRUD de presets de edição avançada do usuário logado
 * (coleção studio_edit_presets, migration 0101).
 * Todas as funções têm fallback gracioso: se a coleção falhar
 * (offline, regra, coleção ausente), lançam erro para o chamador tratar.
 */

const COLLECTION = 'studio_edit_presets'

function mapRecord(r: any): StudioEditPreset {
  let settings: AdvancedCustomizationState | null = null
  try {
    const raw = typeof r.settings === 'string' ? JSON.parse(r.settings) : r.settings
    if (raw && typeof raw === 'object') settings = raw as AdvancedCustomizationState
  } catch (_) {
    settings = null
  }
  return {
    id: r.id,
    name: r.name || 'Preset sem nome',
    settings: settings || ({} as AdvancedCustomizationState),
    is_shared: Boolean(r.is_shared),
    user: r.user || '',
    created: r.created,
    updated: r.updated,
  }
}

export async function listEditPresets(): Promise<StudioEditPreset[]> {
  const userId = pb.authStore.model?.id
  if (!userId) return []
  // Migration 0112: a regra da coleção já libera os próprios presets OU os
  // compartilhados por membros da mesma company — um único fetch basta.
  const records = await pb.collection(COLLECTION).getList(1, 60, {
    sort: '-updated',
  })
  return (records.items || []).map(mapRecord)
}

export async function saveEditPreset(
  name: string,
  settings: AdvancedCustomizationState,
): Promise<StudioEditPreset> {
  const userId = pb.authStore.model?.id
  if (!userId) throw new Error('Usuário não autenticado')
  const record = await pb.collection(COLLECTION).create({
    name: name.trim(),
    settings: JSON.parse(JSON.stringify(settings)),
    user: userId,
    is_shared: false,
  })
  return mapRecord(record)
}

/** Liga/desliga o compartilhamento com a equipe (migration 0112). */
export async function setEditPresetShared(id: string, isShared: boolean): Promise<void> {
  await pb.collection(COLLECTION).update(id, { is_shared: isShared })
}

export async function deleteEditPreset(id: string): Promise<void> {
  await pb.collection(COLLECTION).delete(id)
}
