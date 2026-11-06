import pb from '@/lib/pocketbase/client'
import { generateCaption, generateHashtags } from '@/services/ai'
import { createNotification } from '@/services/notifications'

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

// ============================================================
// WORKFLOW "EM REVISÃO" — comentários da equipe no post
// Persistidos de verdade na coleção `review_comments` (migration 0071)
// ============================================================

export type ReviewCommentKind = 'comentario' | 'ajuste_solicitado' | 'aprovacao'

export interface ReviewCommentRecord {
  id: string
  post: string
  user: string
  author_id: string
  author_name: string
  text: string
  iteration: number
  kind: ReviewCommentKind
  status: 'aberto' | 'resolvido'
  created: string
  updated: string
}

export async function addReviewComment(input: {
  postId: string
  userId?: string
  authorName: string
  text: string
  kind?: ReviewCommentKind
}): Promise<ReviewCommentRecord> {
  if (!input.postId) throw new Error('Post inválido para comentário de revisão.')
  const text = (input.text || '').trim()
  if (!text) throw new Error('Escreva o comentário antes de enviar.')

  // Iteração atual do post (quantas revisões já aconteceram)
  let iteration = 1
  try {
    const post = await pb.collection('posts').getOne(input.postId)
    iteration = Math.max(1, Number(post?.revision_count) || 1)
  } catch {
    /* usa iteração padrão */
  }

  const record = await pb.collection('review_comments').create({
    post: input.postId,
    user: input.userId || undefined,
    author_id: input.userId || '',
    author_name: input.authorName || 'Equipe',
    text,
    iteration,
    kind: input.kind || 'comentario',
    status: input.kind === 'aprovacao' ? 'resolvido' : 'aberto',
  })

  // Incrementa o contador de revisões do post
  try {
    const post = await pb.collection('posts').getOne(input.postId)
    await pb.collection('posts').update(input.postId, {
      revision_count: (Number(post?.revision_count) || 0) + 1,
    })
  } catch {
    /* não bloqueia o comentário se o contador falhar */
  }

  return record as unknown as ReviewCommentRecord
}

export async function getReviewComments(postId: string): Promise<ReviewCommentRecord[]> {
  if (!postId) return []
  try {
    const records = await pb.collection('review_comments').getFullList({
      filter: `post = "${postId}"`,
      sort: 'created',
      requestKey: null,
    })
    return records as unknown as ReviewCommentRecord[]
  } catch (err) {
    console.warn('Falha ao carregar comentários de revisão:', err)
    return []
  }
}

/**
 * Transição de status do workflow de aprovação.
 * Em Revisão (em_revisao) → Aprovado (approved) e também os outros caminhos.
 */
export async function setPostReviewStatus(
  postId: string,
  status: 'draft' | 'scheduled' | 'published' | 'approved' | 'em_revisao',
) {
  const payload: Record<string, unknown> = { status }
  if (status === 'approved') {
    payload.approval_level = 'Nível 2 (Aprovado)'
    payload.is_reviewed = true
  }
  if (status === 'em_revisao') {
    payload.approval_level = 'Nível 1 (Em Revisão)'
    payload.is_reviewed = false
  }
  return pb.collection('posts').update(postId, payload)
}

// ============================================================
// WORKFLOW DE APROVAÇÃO — aprofundamento (migration 0072):
// pendências de revisão, atribuição de revisor e solicitação de mudança.
// ============================================================

export interface PendingReviewPost {
  id: string
  caption: string
  content: string
  platform: string
  status: string
  reviewer?: string
  reviewer_name?: string
  review_requested?: boolean
  revision_count?: number
  created?: string
  updated?: string
  expand?: {
    reviewer?: { id: string; name?: string; email?: string }
  }
}

/** Posts aguardando revisão (status em_revisao), com revisor expandido. */
export async function getPendingReviewPosts(userId?: string): Promise<PendingReviewPost[]> {
  const filter = userId ? `user = "${userId}" && status = "em_revisao"` : 'status = "em_revisao"'
  try {
    const records = await pb.collection('posts').getFullList({
      filter,
      sort: '-created',
      expand: 'reviewer',
      requestKey: null,
    })
    return records as unknown as PendingReviewPost[]
  } catch (err) {
    console.warn('Falha ao listar posts pendentes de revisão:', err)
    return []
  }
}

/** Atribui (ou troca) o revisor do post — por relação ou por nome livre. */
export async function assignPostReviewer(
  postId: string,
  reviewerId?: string,
  reviewerName?: string,
) {
  const payload: Record<string, unknown> = {}
  if (reviewerId) {
    payload.reviewer = reviewerId
  }
  if (reviewerName && reviewerName.trim()) {
    payload.reviewer_name = reviewerName.trim()
  }
  const updated = await pb.collection('posts').update(postId, payload)

  // Notifica o revisor atribuído (fluxo de aprovação, migration 0073).
  try {
    if (reviewerId) {
      await createNotification({
        user: reviewerId,
        type: 'review_assigned',
        post: postId,
        actor_name: reviewerName || 'Equipe',
        message: `Você foi atribuído como revisor do post: ${truncatePostRef(updated)}.`,
      })
    } else if (reviewerName) {
      // Revisor externo (sem conta): notifica o autor do post.
      const post = await pb.collection('posts').getOne(postId)
      const ownerId = String((post as unknown as { user?: string }).user || '')
      if (ownerId) {
        await createNotification({
          user: ownerId,
          type: 'review_assigned',
          post: postId,
          actor_name: reviewerName,
          message: `${reviewerName} foi atribuído como revisor do post: ${truncatePostRef(updated)}.`,
        })
      }
    }
  } catch (err) {
    console.warn('Falha ao notificar revisor atribuído:', err)
  }

  return updated
}

function truncatePostRef(record: unknown): string {
  const r = record as { caption?: string; content?: string } | null
  const text = (r?.caption || r?.content || '').trim().slice(0, 80)
  return text || 'post sem título'
}

/**
 * Solicita mudança: comentário 'ajuste_solicitado' registrado na timeline,
 * status volta para rascunho e o post é marcado como revisão solicitada.
 */
export async function requestPostChanges(input: {
  postId: string
  authorName: string
  text: string
  userId?: string
}) {
  const comment = await addReviewComment({
    postId: input.postId,
    userId: input.userId,
    authorName: input.authorName,
    text: input.text,
    kind: 'ajuste_solicitado',
  })

  // Notifica o dono do post sobre a mudança solicitada (antes de trocar o status).
  try {
    const post = await pb.collection('posts').getOne(input.postId)
    const ownerId = String((post as unknown as { user?: string }).user || '')
    if (ownerId) {
      await createNotification({
        user: ownerId,
        type: 'change_requested',
        post: input.postId,
        actor_name: input.authorName || 'Equipe',
        message: `Mudança solicitada em "${truncatePostRef(post)}": ${input.text.slice(0, 180)}`,
      })
    }
  } catch (err) {
    console.warn('Falha ao notificar mudança solicitada:', err)
  }

  await pb.collection('posts').update(input.postId, {
    status: 'draft',
    approval_level: 'Nível 1 (Rascunho)',
    is_reviewed: false,
    review_requested: true,
  })
  return comment
}

/** Lista de usuários disponíveis para atribuição de revisão. */
export async function getReviewerCandidates() {
  try {
    const records = await pb.collection('users').getFullList({
      sort: 'name',
      requestKey: null,
    })
    return records as unknown as { id: string; name?: string; email?: string }[]
  } catch (err) {
    console.warn('Falha ao listar revisores candidatos:', err)
    return []
  }
}
