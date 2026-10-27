import pb from '@/lib/pocketbase/client'
import { generateCaption, generateHashtags } from '@/services/ai'

export const getPosts = (userId: string, sort = '-created') =>
  pb.collection('posts').getFullList({ filter: `user = "${userId}"`, sort, expand: 'brand' })

export const getPost = (id: string) => pb.collection('posts').getOne(id, { expand: 'brand' })

/**
 * Normaliza e sanitiza campos de relação antes de enviar para o PocketBase.
 * Remove IDs vazios (""), "all", ou campos de relation indefinidos para evitar:
 * "Failed to find all relation records with the provided ids."
 */
function sanitizePostPayload(
  data: Record<string, unknown> | FormData,
): Record<string, unknown> | FormData {
  if (data instanceof FormData) {
    const cleaned = new FormData()
    for (const [key, val] of data.entries()) {
      if (typeof val === 'string') {
        const trimmed = val.trim()
        // Campos de relation não podem ser vazios ou 'all'
        if (['brand', 'trend', 'campaign', 'user'].includes(key)) {
          if (!trimmed || trimmed === 'all' || trimmed === 'undefined' || trimmed === 'null') {
            continue
          }
        }
      }
      cleaned.append(key, val)
    }
    return cleaned
  }

  const cleaned: Record<string, unknown> = { ...data }
  const relationKeys = ['brand', 'trend', 'campaign', 'user']

  for (const k of relationKeys) {
    if (k in cleaned) {
      const v = cleaned[k]
      if (
        v === null ||
        v === undefined ||
        v === '' ||
        v === 'all' ||
        v === 'undefined' ||
        v === 'null'
      ) {
        delete cleaned[k]
      }
    }
  }

  return cleaned
}

export const createPost = (data: Record<string, unknown> | FormData) =>
  pb.collection('posts').create(sanitizePostPayload(data))

export const updatePost = (id: string, data: Record<string, unknown> | FormData) =>
  pb.collection('posts').update(id, sanitizePostPayload(data))

export const deletePost = (id: string) => pb.collection('posts').delete(id)

export async function duplicatePost(postId: string, userId: string) {
  const original = await getPost(postId)
  const copyData: Record<string, unknown> = {
    user: userId,
    brand: original.brand || '',
    content: `${original.content || ''} (Cópia)`.trim(),
    caption: original.caption || '',
    platform: original.platform || 'Instagram',
    status: 'draft',
    template_id: original.template_id || '',
    duration: original.duration || 0,
    script_json: original.script_json || '',
    tags: original.tags || '',
    target_networks: original.target_networks || '',
    width: original.width || 1080,
    height: original.height || 1350,
    is_favorite: false,
    is_archived: false,
    revision_count: 1,
    approval_level: 'Nível 1 (Em Revisão)',
  }
  return pb.collection('posts').create(copyData)
}

export async function togglePostFavorite(id: string, isFavorite: boolean) {
  return pb.collection('posts').update(id, { is_favorite: isFavorite })
}

export async function togglePostArchived(id: string, isArchived: boolean) {
  return pb.collection('posts').update(id, { is_archived: isArchived })
}

export async function createPostFromTrend(
  trendId: string,
  trendTitle: string,
  trendDescription: string,
  userId: string,
  brandId: string,
  categoryName?: string,
) {
  const sourceText =
    `${trendTitle}. ${trendDescription || ''}${categoryName ? ` (Categoria: ${categoryName})` : ''}`.trim()

  const captionRes = (await generateCaption(sourceText, 'Instagram')) as { caption: string }
  const caption = captionRes.caption || ''

  let hashtags: string[] = []
  try {
    const hashtagRes = (await generateHashtags(caption || sourceText)) as { hashtags: string[] }
    hashtags = hashtagRes.hashtags || []
  } catch {
    /* ignore hashtag generation errors */
  }

  const fullCaption = hashtags.length > 0 ? `${caption}\n\n${hashtags.join(' ')}`.trim() : caption

  const record = await pb.collection('posts').create({
    user: userId,
    brand: brandId,
    content: trendDescription || trendTitle,
    caption: fullCaption,
    platform: 'Instagram',
    status: 'draft',
    trend: trendId,
  })

  return record
}

export async function bulkUpdatePostsStatus(
  ids: string[],
  status: 'draft' | 'scheduled' | 'published' | 'approved',
) {
  return Promise.all(ids.map((id) => pb.collection('posts').update(id, { status })))
}

export async function bulkTogglePostsArchived(ids: string[], is_archived: boolean) {
  return Promise.all(ids.map((id) => pb.collection('posts').update(id, { is_archived })))
}

export async function bulkTogglePostsFavorite(ids: string[], is_favorite: boolean) {
  return Promise.all(ids.map((id) => pb.collection('posts').update(id, { is_favorite })))
}

export async function togglePostReviewed(id: string, isReviewed: boolean, reviewNotes?: string) {
  const payload: Record<string, unknown> = {
    is_reviewed: isReviewed,
    approval_level: isReviewed ? 'Nível 2 (Aprovado)' : 'Nível 1 (Em Revisão)',
  }
  if (reviewNotes !== undefined) {
    payload.review_notes = reviewNotes
  }
  return pb.collection('posts').update(id, payload)
}

export async function bulkDeletePosts(ids: string[]) {
  return Promise.all(ids.map((id) => pb.collection('posts').delete(id)))
}
