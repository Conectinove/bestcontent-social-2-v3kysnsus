/**
 * Serviço do histórico de edições (coleção studio_edit_versions — migration
 * 0103): a cada salvamento da Edição Avançada é gravada uma versão
 * (snapshot) e é possível listar e restaurar qualquer versão anterior.
 *
 * Padrão da casa: todo record exige `user` (relation users); membros da
 * mesma company também leem (colaboração).
 */
import pb from '@/lib/pocketbase/client'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'

export interface TextLayer {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  fontWeight?: string
  align?: string
  [key: string]: unknown
}

export interface StudioEditVersionRecord {
  id: string
  user: string
  user_name: string
  target_key: string
  title: string
  settings: AdvancedCustomizationState | null
  text_layers: TextLayer[] | null
  aspect_ratio: string
  preview_url: string
  result_url: string
  company: string
  created: string
  updated: string
}

const COLLECTION = 'studio_edit_versions'

/** Chave estável da mídia/post sendo editado (mesma em todas as abas). */
export function buildTargetKey(kind: 'creation' | 'media' | 'post', ref: string): string {
  const clean = (ref || '').trim()
  if (!clean) return ''
  return `${kind}:${clean}`
}

function mapRecord(rec: any): StudioEditVersionRecord {
  return {
    id: rec.id,
    user: rec.user,
    user_name: rec.user_name || '',
    target_key: rec.target_key || '',
    title: rec.title || '',
    settings: (rec.settings || null) as AdvancedCustomizationState | null,
    text_layers: (rec.text_layers || null) as TextLayer[] | null,
    aspect_ratio: rec.aspect_ratio || '',
    preview_url: rec.preview_url || '',
    result_url: rec.result_url || '',
    company: rec.company || '',
    created: rec.created,
    updated: rec.updated,
  }
}

/** Lista as versões mais recentes de uma mídia/post (ou todas do usuário). */
export async function listEditVersions(
  targetKey: string,
  limit = 30,
): Promise<StudioEditVersionRecord[]> {
  if (!pb.authStore.isValid) return []
  const filter = targetKey
    ? `target_key="${targetKey.replace(/"/g, '\\"')}"`
    : `user="${(pb.authStore.record?.id as string) || ''}"`
  const recs = await pb.collection(COLLECTION).getList(1, limit, {
    filter,
    sort: '-created',
  })
  return recs.items.map(mapRecord)
}

/** Grava uma versão (snapshot) do estado atual da edição. */
export async function saveEditVersion(input: {
  targetKey: string
  title: string
  settings: AdvancedCustomizationState
  textLayers?: TextLayer[]
  aspectRatio?: string
  previewUrl?: string
  resultUrl?: string
  company?: string
}): Promise<StudioEditVersionRecord | null> {
  const userId = pb.authStore.record?.id as string | undefined
  if (!pb.authStore.isValid || !userId || !input.targetKey) return null
  try {
    const rec = await pb.collection(COLLECTION).create({
      user: userId,
      user_name:
        (pb.authStore.record?.name as string) || (pb.authStore.record?.email as string) || 'Você',
      target_key: input.targetKey,
      title: (input.title || '').slice(0, 255),
      settings: input.settings,
      text_layers: input.textLayers || [],
      aspect_ratio: input.aspectRatio || '',
      // data URLs de imagem ficam de fora: só referências leves vão no snapshot
      preview_url: (input.previewUrl || '').startsWith('data:')
        ? ''
        : (input.previewUrl || '').slice(0, 2000),
      result_url: (input.resultUrl || '').startsWith('data:')
        ? ''
        : (input.resultUrl || '').slice(0, 2000),
      company: input.company || '',
    })
    return mapRecord(rec)
  } catch {
    return null // histórico é best-effort: nunca bloqueia o salvamento
  }
}

/** Apaga todas as versões de uma mídia/post (usado ao restaurar/excluir). */
export async function deleteEditVersions(targetKey: string): Promise<void> {
  if (!pb.authStore.isValid || !targetKey) return
  try {
    const recs = await pb.collection(COLLECTION).getFullList({
      filter: `target_key="${targetKey.replace(/"/g, '\\"')}"`,
    })
    await Promise.all(recs.map((rec) => pb.collection(COLLECTION).delete(rec.id)))
  } catch {
    // best-effort
  }
}
