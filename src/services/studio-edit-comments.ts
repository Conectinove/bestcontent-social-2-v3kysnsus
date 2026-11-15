/**
 * Serviço dos comentários da colaboração em tempo real (coleção
 * studio_edit_comments — migration 0108).
 *
 * Enquanto duas pessoas editam a mesma mídia/post/doc (useLiveEditCollaboration),
 * podem trocar comentários ancorados no material via target_key (mesma chave do
 * histórico de versões). Assinatura realtime para chegarem ao vivo; gravação é
 * best-effort (nunca bloqueia o editor).
 */
import pb from '@/lib/pocketbase/client'

export interface StudioEditComment {
  id: string
  targetKey: string
  body: string
  authorName: string
  userId: string
  parentId: string
  company: string
  created: string
}

const COLLECTION = 'studio_edit_comments'

function mapRecord(rec: any): StudioEditComment {
  const parent = rec.parent
  const parentRaw = Array.isArray(parent) ? parent[0] : parent
  return {
    id: rec.id,
    targetKey: rec.target_key || '',
    body: rec.body || '',
    authorName: rec.author_name || '',
    userId: Array.isArray(rec.user) ? rec.user[0] || '' : rec.user || '',
    parentId: typeof parentRaw === 'string' ? parentRaw : (parentRaw?.id ?? ''),
    company: rec.company || '',
    created: rec.created,
  }
}

/** Lista os comentários de um material (mais recentes primeiro). */
export async function listEditComments(
  targetKey: string,
  limit = 50,
): Promise<StudioEditComment[]> {
  if (!pb.authStore.isValid || !targetKey) return []
  try {
    const recs = await pb.collection(COLLECTION).getFullList({
      filter: `target_key="${targetKey.replace(/"/g, '\\"')}"`,
      sort: '-created',
      fields: 'id,target_key,body,author_name,user,parent,company,created',
      batch: 200,
      requestKey: null,
    })
    return recs.slice(0, limit).map(mapRecord)
  } catch {
    return [] // best-effort: comentários nunca bloqueiam o editor
  }
}

/** Cria um comentário (ou uma resposta, quando parentId vem preenchido). */
export async function createEditComment(input: {
  targetKey: string
  body: string
  parentId?: string
  company?: string
}): Promise<StudioEditComment | null> {
  const userId = pb.authStore.record?.id as string | undefined
  if (!pb.authStore.isValid || !userId || !input.targetKey || !input.body.trim()) return null
  try {
    const rec = await pb.collection(COLLECTION).create({
      user: userId,
      author_name:
        (pb.authStore.record?.name as string) || (pb.authStore.record?.email as string) || 'Você',
      target_key: input.targetKey,
      body: input.body.trim().slice(0, 2000),
      parent: input.parentId || '',
      company: input.company || '',
    })
    return mapRecord(rec)
  } catch {
    return null
  }
}

/** Apaga um comentário próprio (best-effort). */
export async function deleteEditComment(id: string): Promise<void> {
  if (!pb.authStore.isValid || !id) return
  try {
    await pb.collection(COLLECTION).delete(id)
  } catch {
    // best-effort
  }
}

/**
 * Assina os comentários de um material em tempo real. Devolve a função de
 * cancelamento (idempotente). Erros de subscription são silenciosos: o feed
 * continua funcionando com recarga manual.
 */
export function subscribeEditComments(
  targetKey: string,
  onCommentsChanged: () => void,
): () => void {
  let cancelled = false
  let unsub: (() => void) | null = null

  pb.collection(COLLECTION)
    .subscribe('*', (e) => {
      const rec = e.record as unknown as { get: (f: string) => unknown }
      if (rec?.get?.('target_key') === targetKey) onCommentsChanged()
    })
    .then((fn) => {
      if (cancelled) {
        try {
          fn()
        } catch {
          /* já cancelado */
        }
        return
      }
      unsub = fn
    })
    .catch(() => {})

  return () => {
    cancelled = true
    if (unsub) {
      try {
        unsub()
      } catch {
        /* best-effort */
      }
      unsub = null
    }
  }
}
