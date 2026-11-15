import pb from '@/lib/pocketbase/client'

/**
 * Favoritos de mídia do Segundo Cérebro — coleção second_brain_favorites
 * (migration 0127, já aplicada): {user relation obrigatório, source, media_id,
 * name, url, meta json} + índice único (user, media_id) que torna o toggle
 * idempotente. Nomes de campo da coleção real: name / url.
 */
export type SecondBrainFavoriteSource =
  | 'document'
  | 'bank'
  | 'uploads'
  | 'library'
  | 'drive'
  | 'unsplash'
  | 'pexels'

export interface SecondBrainFavorite {
  id: string
  source: SecondBrainFavoriteSource
  media_id: string
  name: string
  url: string
  meta: Record<string, unknown>
  created: string
}

const COLLECTION = 'second_brain_favorites'

const toFavorite = (rec: Record<string, unknown>): SecondBrainFavorite => ({
  id: String(rec.id),
  source: (rec.source as SecondBrainFavoriteSource) || 'document',
  media_id: String(rec.media_id || ''),
  name: String(rec.name || ''),
  url: String(rec.url || ''),
  meta: (rec.meta as Record<string, unknown>) || {},
  created: String(rec.created || ''),
})

/** Lista todos os favoritos do usuário logado (coleção já filtra por regra). */
export async function listSecondBrainFavorites(): Promise<SecondBrainFavorite[]> {
  const userId = pb.authStore.record?.id
  if (!userId) return []
  const recs = await pb.collection(COLLECTION).getFullList({
    filter: `user = "${userId}"`,
    sort: '-created',
  })
  return recs.map((r) => toFavorite(r as unknown as Record<string, unknown>))
}

/** Verifica se uma mídia já é favorita (por source + media_id). */
export function isSecondBrainFavorite(
  favorites: SecondBrainFavorite[],
  source: SecondBrainFavoriteSource,
  mediaId: string,
): boolean {
  return favorites.some((f) => f.source === source && f.media_id === mediaId)
}

/** Alterna o favorito de uma mídia (cria ou remove o registro). */
export async function toggleSecondBrainFavorite(params: {
  source: SecondBrainFavoriteSource
  mediaId: string
  name: string
  url: string
  meta?: Record<string, unknown>
}): Promise<{ favorited: boolean }> {
  const userId = pb.authStore.record?.id
  if (!userId) throw new Error('Usuário não autenticado')
  const existing = await pb.collection(COLLECTION).getList(1, 1, {
    filter: `user = "${userId}" && source = "${params.source}" && media_id = "${params.mediaId}"`,
  })
  if (existing.items.length > 0) {
    await pb.collection(COLLECTION).delete(existing.items[0].id)
    return { favorited: false }
  }
  await pb.collection(COLLECTION).create({
    user: userId,
    source: params.source,
    media_id: params.mediaId,
    name: params.name,
    url: params.url,
    meta: params.meta || {},
  })
  return { favorited: true }
}
