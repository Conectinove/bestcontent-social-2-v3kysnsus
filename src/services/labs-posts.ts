import pb from '@/lib/pocketbase/client'

/** Registro de post social criado pelo app (coleção `posts`). */
export interface PostRecord {
  id: string
  user: string
  brand: string
  content: string
  network: string
  template_type: string
  media_url: string
  status?: string
  created?: string
}

interface CreatePostInput {
  user: string
  brand: string
  content: string
  /** feed | story | reels | shorts | x */
  network: string
  /** Só 'feed' | 'story' — valores válidos do enum post_templates.type. */
  template_type: 'feed' | 'story'
  /** URL da mídia (data URL ou link público) gerada pela Edição Avançada. */
  media_url?: string
}

/**
 * Cria um post social (coleção `posts`).
 * Campos de relação (user/brand) são passados limpos — PocketBase resolve o vínculo.
 */
export async function createPost(input: CreatePostInput): Promise<PostRecord> {
  const payload: Record<string, unknown> = {
    user: input.user,
    brand: input.brand,
    content: input.content,
    network: input.network,
    template_type: input.template_type,
    media_url: input.media_url || '',
    status: 'draft',
  }
  const rec = await pb.collection('posts').create(payload)
  return mapPost(rec)
}

/** Lista os posts do usuário, mais recentes primeiro. */
export async function listPosts(userId: string, limit = 20): Promise<PostRecord[]> {
  const recs = await pb.collection('posts').getList(1, limit, {
    filter: `user = "${userId}"`,
    sort: '-created',
  })
  return recs.items.map(mapPost)
}

function mapPost(rec: Record<string, unknown>): PostRecord {
  return {
    id: String(rec.id || ''),
    user: String(rec.user || ''),
    brand: String(rec.brand || ''),
    content: String(rec.content || ''),
    network: String(rec.network || ''),
    template_type: String(rec.template_type || ''),
    media_url: String(rec.media_url || ''),
    status: String(rec.status || ''),
    created: String(rec.created || ''),
  }
}
