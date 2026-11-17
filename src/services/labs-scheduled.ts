import { pb } from '@/lib/pocketbase/client'

/** Post social agendado (coleção posts, status 'scheduled') para o dashboard do Labs. */
export interface LabsScheduledPost {
  id: string
  caption: string
  content: string
  platform: string
  status: string
  scheduled_date: string
  created: string
}

/**
 * Lista os posts do dashboard de agendamento do Labs.
 * Sem filtro rígido de status: o dashboard busca draft/scheduled/published
 * (com data marcada) e o seletor de status na UI filtra o que exibir.
 */
export async function listScheduledPosts(userId: string, limit = 50): Promise<LabsScheduledPost[]> {
  const recs = await pb.collection('posts').getList(1, limit, {
    filter: `user = "${userId}" && scheduled_date != ""`,
    sort: 'scheduled_date',
  })
  return recs.items.map(mapScheduled)
}

/** Remarca a data de publicação de um post agendado. */
export async function reschedulePost(id: string, scheduledDate: string) {
  return pb.collection('posts').update(id, {
    scheduled_date: new Date(scheduledDate).toISOString(),
  })
}

/** Cancela o agendamento: post volta para rascunho, sem data. */
export async function cancelSchedule(id: string) {
  return pb.collection('posts').update(id, {
    status: 'draft',
    scheduled_date: '',
  })
}

/** Remove um post definitivamente. */
export async function deletePost(id: string) {
  return pb.collection('posts').delete(id)
}

/** Atualiza o texto/legenda de um post. */
export async function updatePostContent(id: string, caption: string) {
  return pb.collection('posts').update(id, {
    content: caption,
    caption,
  })
}

function mapScheduled(rec: Record<string, unknown>): LabsScheduledPost {
  return {
    id: String(rec.id || ''),
    caption: String(rec.caption || ''),
    content: String(rec.content || ''),
    platform: String(rec.platform || ''),
    status: String(rec.status || ''),
    scheduled_date: String(rec.scheduled_date || ''),
    created: String(rec.created || ''),
  }
}
