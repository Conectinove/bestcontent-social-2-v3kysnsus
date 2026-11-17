import pb from '@/lib/pocketbase/client'

// ============================================================
// Notificações persistidas do fluxo de aprovação (migration 0073).
// Coleção `notifications`: user (relation), type (select:
// review_assigned | change_requested | approval_flow), post (relation
// opcional), message, actor_name, is_read.
// Sempre tolerante a falhas: nenhuma função deve quebrar o header.
// ============================================================

export type AppNotificationType = 'review_assigned' | 'change_requested' | 'approval_flow'

export interface AppNotification {
  id: string
  user?: string
  type?: AppNotificationType | string
  post?: string
  message?: string
  actor_name?: string
  is_read?: boolean
  created?: string
  updated?: string
  expand?: {
    post?: { id: string; caption?: string; content?: string; platform?: string }
  }
}

export interface CreateNotificationInput {
  user: string
  type?: AppNotificationType | string
  post?: string
  message: string
  actor_name?: string
}

const COLLECTION = 'notifications'

export async function createNotification(
  input: CreateNotificationInput,
): Promise<AppNotification | null> {
  if (!input.user || !input.message) return null
  try {
    const payload: Record<string, unknown> = {
      user: input.user,
      type: input.type || 'approval_flow',
      message: (input.message || '').slice(0, 600),
      actor_name: (input.actor_name || 'Equipe').slice(0, 120),
      is_read: false,
    }
    // Relation só quando há id de post válido — relação vazia quebra o create.
    if (input.post) payload.post = input.post
    const record = await pb.collection(COLLECTION).create(payload)
    return record as unknown as AppNotification
  } catch (err) {
    console.warn('Falha ao criar notificação:', err)
    return null
  }
}

/** Lista as notificações do usuário, mais recentes primeiro. */
export async function getMyNotifications(userId?: string, limit = 30): Promise<AppNotification[]> {
  if (!userId) return []
  try {
    const records = await pb.collection(COLLECTION).getList(1, limit, {
      filter: `user = "${userId}"`,
      sort: '-created',
      expand: 'post',
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
      filter: `user = "${userId}" && is_read = false`,
      requestKey: null,
    })
    return res?.totalItems || 0
  } catch {
    return 0
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!id) return
  try {
    await pb.collection(COLLECTION).update(id, { is_read: true })
  } catch (err) {
    console.warn('Falha ao marcar notificação como lida:', err)
  }
}

export async function markAllNotificationsRead(userId?: string): Promise<void> {
  if (!userId) return
  try {
    const unread = await getMyNotifications(userId, 60)
    const pendentes = (unread || []).filter((n) => !n.is_read)
    await Promise.all(
      pendentes.map((n) => pb.collection(COLLECTION).update(n.id, { is_read: true })),
    )
  } catch (err) {
    console.warn('Falha ao marcar todas as notificações como lidas:', err)
  }
}

/** Rótulo amigável do tipo de notificação (padrão da casa, pt-BR). */
export function notificationTypeLabel(type?: string): string {
  switch (type) {
    case 'review_assigned':
      return 'Revisor atribuído'
    case 'change_requested':
      return 'Mudança solicitada'
    case 'page_published':
      return 'Página publicada'
    case 'approval_flow':
      return 'Fluxo de aprovação'
    case 'studio_comment':
      return 'Novo comentário'
    default:
      return 'Aviso'
  }
}
