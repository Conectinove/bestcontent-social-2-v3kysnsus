import { useCallback, useEffect, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { listEditComments, subscribeEditComments } from '@/services/studio-edit-comments'
import type { StudioEditComment } from '@/services/studio-edit-comments'

export interface LiveCollabUser {
  userId: string
  name: string
  lastActivity: string
}

/** Aviso de edição remota: outra sessão salvou o mesmo material. */
export interface RemoteEditNotice<T = unknown> {
  userName: string
  payload: T | null
  updatedAt: string
}

export interface LiveCollabOptions {
  /** Coleção PocketBase observada via realtime. */
  collection?: string
  /** Campo do record que deve casar com o targetKey (default: 'target_key'). */
  keyField?: string
  /** Campo do record com o id do autor (para ignorar os próprios saves). */
  userField?: string
  /** Campo do record com o nome de exibição do autor. */
  userNameField?: string
  /** Campo do record carregado como payload do aviso. */
  payloadField?: string
  /** Campo do record com o título/resumo da edição. */
  titleField?: string
  /** Transforma o record no payload entregue ao consumidor. */
  mapRecord?: (rec: Record<string, unknown>, payload: unknown) => unknown
}

const PRESENCE_TTL_MS = 90_000

const DEFAULT_OPTIONS: Required<Omit<LiveCollabOptions, 'mapRecord'>> = {
  collection: 'studio_edit_versions',
  keyField: 'target_key',
  userField: 'user',
  userNameField: 'user_name',
  payloadField: 'settings',
  titleField: 'title',
}

function readField(rec: unknown, field: string): unknown {
  if (!rec || typeof rec !== 'object') return undefined
  return (rec as Record<string, unknown>)[field]
}

/**
 * Colaboração ao vivo por material (target_key). Duas frentes, ambas
 * best-effort (nunca quebram a página):
 *
 * 1. PRESENÇA + COMENTÁRIOS: agrega atividade recente de comentários
 *    (coleção studio_edit_comments, migration 0108) via realtime PocketBase.
 *    Registros chegando por realtime são objetos PLANOS — acesso direto a
 *    propriedade, NUNCA .get() (TypeError 'rec.get is not a function').
 *
 * 2. AVISO DE EDIÇÃO REMOTA: assina a coleção do material (genérica via
 *    options) e, quando outra pessoa salva o MESMO alvo, expõe remoteEdit —
 *    nunca sobrescreve silenciosamente; o consumidor decide aplicar ou
 *    manter o trabalho local (dismissRemoteEdit). registerOwnSave marca os
 *    ids gravados por esta sessão para não gerar aviso próprio.
 */
export function useLiveEditCollaboration<T = unknown>(
  targetKey: string | null,
  enabled: boolean = true,
  options: LiveCollabOptions = {},
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const myUserId = (pb.authStore.record?.id as string | undefined) || ''
  const [users, setUsers] = useState<LiveCollabUser[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [remoteEdit, setRemoteEdit] = useState<RemoteEditNotice<T> | null>(null)
  const ownSaveIdsRef = useRef<Set<string>>(new Set())

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

  // Assinatura realtime da coleção do material (aviso de edição remota).
  useEffect(() => {
    if (!enabled || !targetKey) {
      setRemoteEdit(null)
      return
    }
    let cancelled = false
    let unsub: (() => void) | null = null

    pb.collection(opts.collection)
      .subscribe('*', (e: any) => {
        if (cancelled) return
        // Record de realtime é objeto PLANO — acesso direto, nunca .get().
        const rec = (e?.record ?? {}) as Record<string, unknown>
        const recKey = readField(rec, opts.keyField)
        if (recKey !== targetKey) return

        // Echo do próprio save: id marcado em registerOwnSave OU autor sou eu.
        const recId = readField(rec, 'id')
        const recUser = readField(rec, opts.userField)
        const recUserId = Array.isArray(recUser) ? recUser[0] : recUser
        if (typeof recId === 'string' && ownSaveIdsRef.current.has(recId)) return
        if (recUserId && recUserId === myUserId) return

        const rawPayload = readField(rec, opts.payloadField)
        const payload = opts.mapRecord
          ? opts.mapRecord(rec, rawPayload)
          : ((rawPayload ?? null) as unknown)
        setRemoteEdit({
          userName: (readField(rec, opts.userNameField) as string | undefined) || 'Outra pessoa',
          payload: (payload ?? null) as T | null,
          updatedAt: (readField(rec, 'updated') as string) || '',
        })
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
      .catch(() => {
        /* best-effort: subscription nunca quebra a página */
      })

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
  }, [
    enabled,
    targetKey,
    myUserId,
    opts.collection,
    opts.keyField,
    opts.userField,
    opts.userNameField,
    opts.payloadField,
    opts.mapRecord,
  ])

  const dismissRemoteEdit = useCallback(() => setRemoteEdit(null), [])

  const registerOwnSave = useCallback((recordId?: string) => {
    if (recordId) {
      ownSaveIdsRef.current.add(recordId)
      // Limita o crescimento do conjunto (suficiente para a sessão).
      if (ownSaveIdsRef.current.size > 200) {
        ownSaveIdsRef.current = new Set(Array.from(ownSaveIdsRef.current).slice(-100))
      }
    }
    setRemoteEdit(null)
  }, [])

  return { users, commentCount, remoteEdit, dismissRemoteEdit, registerOwnSave }
}

export default useLiveEditCollaboration
