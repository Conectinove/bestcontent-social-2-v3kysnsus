import pb from '@/lib/pocketbase/client'

/** Coleção única de favoritos de mídia do Segundo Cérebro (migration 0127). */
export type SecondBrainFavoriteSource =
  | 'doc'
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
  title: string
  thumbnail_url: string
  meta: Record<string, unknown>
  created: string
}

const COLLECTION = 'second_brain_favorites'

const toFavorite = (rec: Record<string, unknown>): SecondBrainFavorite => ({
  id: String(rec.id),
  source: (rec.source as SecondBrainFavoriteSource) || 'doc',
  media_id: String(rec.media_id || ''),
  title: String(rec.title || ''),
  thumbnail_url: String(rec.thumbnail_url || ''),
  meta: (rec.meta as Record<string, unknown>) || {},
  created: String(rec.created || ''),
})

/** Lista todos os favoritos do usuário logado. */
export async function listSecondBrainFavorites(): Promise<SecondBrainFavorite[]> {
  const userId = pb.authStore.record?.id
  if (!userId) return []
  const recs = await pb.collection(COLLECTION).getFullList({
    filter: `user = "${userId}"`,
    sort: '-created',
  })
  return recs.map((r) => toFavorite(r as unknown as Record<string, unknown>))
}

/** Verifica se uma mídia já é favorita. */
export function isFavorite(
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
  title: string
  thumbnailUrl: string
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
    title: params.title,
    thumbnail_url: params.thumbnailUrl,
    meta: params.meta || {},
  })
  return { favorited: true }
}
