import pb from '@/lib/pocketbase/client'

// ============================================================
// Notificações persistidas do fluxo de aprovação (migration 0073).
// Sempre tolerante a falhas: nenhuma função deve quebrar o header.
// ============================================================

export type AppNotificationType = 'reviewer_assigned' | 'change_requested' | 'info'

export interface AppNotification {
  id: string
  user?: string
  type?: AppNotificationType | string
  post?: string
  post_title?: string
  message?: string
  actor_name?: string
  read?: boolean
  created?: string
  updated?: string
}

export interface CreateNotificationInput {
  user?: string
  type?: AppNotificationType | string
  post?: string
  post_title?: string
  message?: string
  actor_name?: string
  read?: boolean
}

const COLLECTION = 'notifications'

export async function createNotification(
  input: CreateNotificationInput,
): Promise<AppNotification | null> {
  try {
    const record = await pb.collection(COLLECTION).create({
      user: input.user || undefined,
      type: input.type || 'info',
      post: input.post || '',
      post_title: (input.post_title || '').slice(0, 300),
      message: (input.message || '').slice(0, 600),
      actor_name: (input.actor_name || 'Equipe').slice(0, 120),
      read: input.read ?? false,
    })
    return record as unknown as AppNotification
  } catch (err) {
    console.warn('Falha ao criar notificação:', err)
    return null
  }
}

export async function getMyNotifications(userId?: string, limit = 30): Promise<AppNotification[]> {
  if (!userId) return []
  try {
    const records = await pb.collection(COLLECTION).getList(1, limit, {
      filter: `user = "${userId}"`,
      sort: '-created',
      requestKey: null,
    })
    return (records?.items || []) as unknown as AppNotification[]
  } catch (err) {
    console.warn('Falha ao listar notificações:', err)
    return []
  }
}

export async function getUnreadNotificationsCount(userId?: string): Promise<number> {
  if (!userId) return 0
  try {
    const res = await pb.collection(COLLECTION).getList(1, 1, {
      filter: `user = "${userId}" && read = false`,
      requestKey: null,
    })
    return res?.totalItems || 0
  } catch {
    return 0
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await pb.collection(COLLECTION).update(id, { read: true })
  } catch (err) {
    console.warn('Falha ao marcar notificação como lida:', err)
  }
}

export async function markAllNotificationsRead(userId?: string): Promise<void> {
  if (!userId) return
  try {
    const unread = await getMyNotifications(userId, 60)
    const pendentes = (unread || []).filter((n) => !n.read)
    await Promise.all(pendentes.map((n) => pb.collection(COLLECTION).update(n.id, { read: true })))
  } catch (err) {
    console.warn('Falha ao marcar todas as notificações como lidas:', err)
  }
}

/** Rótulo amigável do tipo de notificação (padrão da casa, pt-BR). */
export function notificationTypeLabel(type?: string): string {
  switch (type) {
    case 'reviewer_assigned':
      return 'Revisor atribuído'
    case 'change_requested':
      return 'Mudança solicitada'
    default:
      return 'Aviso'
  }
}
