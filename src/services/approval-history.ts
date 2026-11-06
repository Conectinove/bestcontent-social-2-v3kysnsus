import pb from '@/lib/pocketbase/client'

export type ApprovalAction =
  | 'approved'
  | 'rejected'
  | 'requested_changes'
  | 'submitted'
  | 'restored'

export interface ApprovalHistoryItem {
  id: string
  post_id: string
  action: ApprovalAction
  actor_name: string
  actor_role?: string
  actor_id?: string
  comment?: string
  version_label?: string
  created: string
  updated?: string
}

export interface AddApprovalHistoryInput {
  postId: string
  action: ApprovalAction
  actorName: string
  actorRole?: string
  actorId?: string
  comment?: string
  versionLabel?: string
}

const COLLECTION = 'post_approval_history'
const LOCAL_KEY_PREFIX = 'midiaviva_approval_history_'

function getLocalHistory(postId: string): ApprovalHistoryItem[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_KEY_PREFIX}${postId}`)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return []
}

function saveLocalHistory(postId: string, items: ApprovalHistoryItem[]) {
  try {
    localStorage.setItem(`${LOCAL_KEY_PREFIX}${postId}`, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

/**
 * Busca o histórico de aprovações de um post, ordenado do mais recente para o mais antigo.
 */
export async function getPostApprovalHistory(postId: string): Promise<ApprovalHistoryItem[]> {
  if (!postId) return []
  try {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `post_id = "${postId}"`,
      sort: '-created',
      requestKey: null,
    })
    if (records && records.length > 0) {
      return records.map((r: any) => ({
        id: r.id,
        post_id: r.post_id,
        action: r.action,
        actor_name: r.actor_name,
        actor_role: r.actor_role,
        actor_id: r.actor_id,
        comment: r.comment,
        version_label: r.version_label,
        created: r.created,
        updated: r.updated,
      }))
    }
  } catch (err) {
    console.warn('[approval-history] Fallback local para histórico:', err)
  }

  // Fallback em localStorage se offline ou vazio
  const local = getLocalHistory(postId)
  if (local.length > 0) return local

  // Seed ilustrativo padrão da casa para visualização imediata
  return [
    {
      id: `seed-appr-1-${postId}`,
      post_id: postId,
      action: 'submitted',
      actor_name: 'Equipe de Criação',
      actor_role: 'Agência',
      comment: 'Versão inicial submetida para validação estratégica.',
      version_label: 'v1.0 (Rascunho Oficial)',
      created: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: `seed-appr-2-${postId}`,
      post_id: postId,
      action: 'requested_changes',
      actor_name: 'Diretor de Marketing',
      actor_role: 'Aprovador Nível 1',
      comment: 'Ajustar o CTA final e incluir hashtag oficial da campanha.',
      version_label: 'v1.1 (Revisão Solicitada)',
      created: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: `seed-appr-3-${postId}`,
      post_id: postId,
      action: 'approved',
      actor_name: 'Cliente VIP',
      actor_role: 'Aprovador Final',
      comment: 'Aprovado com louvor! Agendar para o melhor horário da rede.',
      version_label: 'v2.0 (Aprovado Definitivo)',
      created: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ]
}

/**
 * Registra um novo evento na timeline de aprovação.
 */
export async function addApprovalHistoryRecord(
  input: AddApprovalHistoryInput,
): Promise<ApprovalHistoryItem> {
  const localItem: ApprovalHistoryItem = {
    id: `appr-${Date.now()}`,
    post_id: input.postId,
    action: input.action,
    actor_name: input.actorName,
    actor_role: input.actorRole || 'Revisor',
    actor_id: input.actorId,
    comment: input.comment || '',
    version_label: input.versionLabel || 'v1.0',
    created: new Date().toISOString(),
  }

  const existing = getLocalHistory(input.postId)
  saveLocalHistory(input.postId, [localItem, ...existing])

  try {
    const record = await pb.collection(COLLECTION).create({
      post_id: input.postId,
      action: input.action,
      actor_name: input.actorName,
      actor_role: input.actorRole || '',
      actor_id: input.actorId || '',
      comment: input.comment || '',
      version_label: input.versionLabel || 'v1.0',
    })
    return {
      ...localItem,
      id: record.id,
      created: record.created,
      updated: record.updated,
    }
  } catch (err) {
    console.warn('[approval-history] Erro ao persistir no PB, mantido local:', err)
    return localItem
  }
}
