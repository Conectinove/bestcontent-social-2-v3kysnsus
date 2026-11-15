import pb from '@/lib/pocketbase/client'

/** Artigo do Blog do Labs (coleção labs_blog_posts, migration 0124). */
export interface LabsBlogPost {
  id: string
  user: string
  brand: string
  title: string
  cover_url: string
  content: string
  /** 'draft' | 'published' — valores do select na migration 0124. */
  status: LabsBlogStatus
  created?: string
  updated?: string
}

export type LabsBlogStatus = 'draft' | 'published'

const COLLECTION = 'labs_blog_posts'

/** Lista os artigos do usuário (meus artigos), mais recentes primeiro. */
export async function listLabsBlogPosts(userId: string): Promise<LabsBlogPost[]> {
  const recs = await pb.collection(COLLECTION).getFullList({
    filter: `user = "${userId}"`,
    sort: '-updated',
  })
  return recs.map(mapPost)
}

/** Cria ou atualiza um artigo. `id` vazio = novo artigo. */
export async function saveLabsBlogPost(data: {
  id?: string
  user: string
  brand: string
  title: string
  cover_url: string
  content: string
  status: LabsBlogStatus
}): Promise<LabsBlogPost> {
  const payload = {
    user: data.user,
    brand: data.brand,
    title: data.title.trim().slice(0, 200),
    cover_url: data.cover_url || '',
    content: data.content || '',
    status: data.status,
  }
  const rec = data.id
    ? await pb.collection(COLLECTION).update(data.id, payload)
    : await pb.collection(COLLECTION).create(payload)
  return mapPost(rec)
}

/** Publica (ou despublica de volta a rascunho) um artigo existente. */
export async function setLabsBlogPostStatus(id: string, status: LabsBlogStatus) {
  const rec = await pb.collection(COLLECTION).update(id, { status })
  return mapPost(rec)
}

export async function deleteLabsBlogPost(id: string) {
  return pb.collection(COLLECTION).delete(id)
}

function mapPost(rec: Record<string, unknown>): LabsBlogPost {
  return {
    id: String(rec.id || ''),
    user: String(rec.user || ''),
    brand: String(rec.brand || ''),
    title: String(rec.title || ''),
    cover_url: String(rec.cover_url || ''),
    content: String(rec.content || ''),
    status: (rec.status === 'published' ? 'published' : 'draft') as LabsBlogStatus,
    created: String(rec.created || ''),
    updated: String(rec.updated || ''),
  }
}
