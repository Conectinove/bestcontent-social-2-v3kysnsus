/**
 * Serviço do mapa rede→tema compartilhado (coleção studio_theme_network_map).
 *
 * Cada equipe (company) tem UM mapa compartilhado rede→{themeId, accent}.
 * O record é sempre criado com o `user` do autor (regra da casa: todo record
 * exige user), e a leitura é por company — todos da mesma equipe veem o mesmo
 * mapa, que sobrevive ao navegador (o localStorage é só fallback).
 */
import pb from '@/lib/pocketbase/client'

export interface StudioThemeNetworkMapRecord {
  id: string
  user: string
  company: string
  theme_map: Record<string, { themeId: string; accent?: string }>
  updated: string
}

const COLLECTION = 'studio_theme_network_map'

/** Lê o mapa compartilhado da company (null sem company/sem rede). */
export async function fetchStudioThemeNetworkMap(
  company: string,
): Promise<StudioThemeNetworkMapRecord | null> {
  if (!pb.authStore.isValid || !company) return null
  try {
    const rec = await pb
      .collection(COLLECTION)
      .getFirstListItem(`company="${company.replace(/"/g, '\\"')}"`)
    return {
      id: rec.id,
      user: rec.user,
      company: rec.company,
      theme_map: (rec.theme_map || {}) as StudioThemeNetworkMapRecord['theme_map'],
      updated: rec.updated,
    }
  } catch {
    return null
  }
}

/**
 * Cria ou atualiza o mapa da company (upsert por company). Em caso de empate
 * de escrita (409/403 de concorrência), tenta re-ler e re-aplicar uma vez.
 */
export async function upsertStudioThemeNetworkMap(
  company: string,
  map: Record<string, { themeId: string; accent?: string }>,
): Promise<StudioThemeNetworkMapRecord | null> {
  if (!pb.authStore.isValid || !company) return null
  const userId = pb.authStore.record?.id as string | undefined
  if (!userId) return null

  try {
    const existing = await fetchStudioThemeNetworkMap(company)
    if (existing) {
      await pb.collection(COLLECTION).update(existing.id, { theme_map: map })
      return { ...existing, theme_map: map }
    }
    const created = await pb.collection(COLLECTION).create({
      user: userId,
      company,
      theme_map: map,
    })
    return {
      id: created.id,
      user: created.user,
      company: created.company,
      theme_map: map,
      updated: created.updated,
    }
  } catch {
    // Conflito (outro membro criou ao mesmo tempo) ou sem permissão: mantém local.
    return null
  }
}
