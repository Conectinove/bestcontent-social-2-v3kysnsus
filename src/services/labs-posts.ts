import pb from '@/lib/pocketbase/client'

/** Registro de post social criado pelo app (coleção `posts`). */
export interface PostRecord {
  id: string
  user: string
  brand: string
  content: string
  caption: string
  platform: string
  media_url: string
  status: string
  created?: string
}

interface CreatePostInput {
  user: string
  brand: string
  content: string
  caption?: string
  /** Select obrigatório da coleção: Instagram | TikTok | YouTube | Facebook | LinkedIn | Twitter/X */
  platform: string
  /** Só 'feed' | 'story' — guarda no target_networks (json), já que não há campo network. */
  template_type: 'feed' | 'story'
  /** URL pública da imagem gerada pela Edição Avançada (vai no campo text `media_url` extraível via studio_metadata). */
  media_url?: string
  /** Formato da mídia (ex: 1:1, 9:16) para reconstrução no editor. */
  aspect_ratio?: string
}

/**
 * Cria um post social (coleção `posts`) direto do Labs.
 * Campos de relação (user/brand) passam limpos; template/rede ficam em target_networks (json)
 * e a URL da mídia em studio_metadata.media_url, pois a coleção não tem network/media_url nativos.
 */
export async function createPost(input: CreatePostInput): Promise<PostRecord> {
  const payload: Record<string, unknown> = {
    user: input.user,
    brand: input.brand,
    content: input.content,
    caption: input.caption || input.content,
    platform: input.platform,
    status: 'draft',
    target_networks: { template_type: input.template_type, network: input.template_type },
    studio_metadata: {
      media_url: input.media_url || '',
      aspect_ratio: input.aspect_ratio || '',
      origin: 'labs',
    },
  }
  const rec = await pb.collection('posts').create(payload)
  return mapPost(rec)
}

/** Lista os posts criados pelo Labs, mais recentes primeiro. */
export async function listPosts(userId: string, limit = 20): Promise<PostRecord[]> {
  const recs = await pb.collection('posts').getList(1, limit, {
    filter: `user = "${userId}"`,
    sort: '-created',
  })
  return recs.items.map(mapPost)
}

function mapPost(rec: Record<string, unknown>): PostRecord {
  const meta = (
    rec.studio_metadata && typeof rec.studio_metadata === 'object'
      ? (rec.studio_metadata as Record<string, unknown>)
      : {}
  ) as Record<string, unknown>
  const networks = (
    rec.target_networks && typeof rec.target_networks === 'object'
      ? (rec.target_networks as Record<string, unknown>)
      : {}
  ) as Record<string, unknown>
  return {
    id: String(rec.id || ''),
    user: String(rec.user || ''),
    brand: String(rec.brand || ''),
    content: String(rec.content || ''),
    caption: String(rec.caption || ''),
    platform: String(rec.platform || ''),
    media_url: String(meta.media_url || ''),
    status: String(rec.status || ''),
    created: String(rec.created || ''),
  }
}
