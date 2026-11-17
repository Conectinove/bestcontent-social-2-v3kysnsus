import { useCallback, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { listEditComments, subscribeEditComments } from '@/services/studio-edit-comments'
import type { StudioEditComment } from '@/services/studio-edit-comments'

export interface LiveCollabUser {
  userId: string
  name: string
  lastActivity: string
}

const PRESENCE_TTL_MS = 90_000

/**
 * Colaboração ao vivo por material (target_key): agrega atividade recente de
 * comentários (coleção studio_edit_comments, migration 0108) via realtime
 * PocketBase. Registros chegando por realtime são objetos PLANOS — acesso
 * direto a propriedade, NUNCA .get() (TypeError 'rec.get is not a function').
 * Best-effort: nunca quebra a página.
 */
export function useLiveEditCollaboration(targetKey: string | null) {
  const myUserId = (pb.authStore.record?.id as string | undefined) || ''
  const [users, setUsers] = useState<LiveCollabUser[]>([])
  const [commentCount, setCommentCount] = useState(0)

  const recompute = useCallback(
    (list: StudioEditComment[]) => {
      const cutoff = Date.now() - PRESENCE_TTL_MS
      const byUser = new Map<string, LiveCollabUser>()
      let count = 0
      for (const c of list) {
        count++
        if (!c.userId || !c.created) continue
        const t = new Date(c.created).getTime()
        if (Number.isNaN(t) || t < cutoff) continue
        const name = c.authorName || 'Colaborador'
        const prev = byUser.get(c.userId)
        if (!prev || (prev.lastActivity || '') < (c.created || '')) {
          byUser.set(c.userId, { userId: c.userId, name, lastActivity: c.created })
        }
      }
      const arr = Array.from(byUser.values()).sort((a, b) =>
        a.userId === myUserId ? -1 : b.userId === myUserId ? 1 : a.name.localeCompare(b.name),
      )
      setUsers(arr)
      setCommentCount(count)
    },
    [myUserId],
  )

  const refresh = useCallback(async () => {
    if (!targetKey) {
      setUsers([])
      setCommentCount(0)
      return
    }
    try {
      recompute(await listEditComments(targetKey, 50))
    } catch {
      /* best-effort */
    }
  }, [targetKey, recompute])

  useEffect(() => {
    if (!targetKey) {
      setUsers([])
      setCommentCount(0)
      return
    }
    let cancelled = false
    refresh()
    const unsubscribe = subscribeEditComments(targetKey, () => {
      if (!cancelled) refresh()
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [targetKey, refresh])

  return { users, commentCount }
}

export default useLiveEditCollaboration
