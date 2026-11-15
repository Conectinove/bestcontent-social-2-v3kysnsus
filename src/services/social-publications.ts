// Fila de publicação automática — client da coleção social_publications.
// Contas de CADA usuário (per-user): o cron no backend usa $connectors.executeAsUser
// com o userId do registro; aqui o app só cria/lê os registros do próprio usuário.
import { pb } from '@/lib/pocketbase/client'

export type PublicationStatus = 'pending' | 'published' | 'failed'
export type PublicationNetwork = 'instagram' | 'facebook'

export interface SocialPublication {
  id: string
  user: string
  post: string
  scheduled_post?: string
  network: PublicationNetwork
  target_account_id?: string
  status: PublicationStatus
  scheduled_at: string
  published_at?: string
  error_message?: string
  attempts?: number
  external_post_id?: string
  created?: string
  expand?: {
    post?: any
    scheduled_post?: any
  }
}

export async function createSocialPublication(data: {
  post: string
  network: PublicationNetwork
  scheduled_at: string
  scheduled_post?: string
  target_account_id?: string
}): Promise<SocialPublication> {
  const user = pb.authStore.record?.id
  if (!user) throw new Error('Sessão expirada: faça login para agendar publicação automática.')
  return await pb.collection('social_publications').create<SocialPublication>({
    user,
    status: 'pending',
    attempts: 0,
    ...data,
  })
}

export async function listSocialPublications(userId: string): Promise<SocialPublication[]> {
  return await pb
    .collection('social_publications')
    .getList<SocialPublication>(1, 100, {
      filter: pb.filter('user = {:userId}', { userId }),
      sort: '-scheduled_at',
      expand: 'post,scheduled_post',
    })
    .then((r) => r.items)
}

export async function deleteSocialPublication(id: string): Promise<void> {
  await pb.collection('social_publications').delete(id)
}

/** Reagendar (voltar para pending) um disparo que falhou ou pendente. */
export async function retrySocialPublication(
  id: string,
  newScheduledAt: string,
): Promise<SocialPublication> {
  return await pb.collection('social_publications').update<SocialPublication>(id, {
    status: 'pending',
    attempts: 0,
    error_message: '',
    scheduled_at: newScheduledAt,
  })
}
