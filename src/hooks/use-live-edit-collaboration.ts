import { useEffect, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'

export interface LiveEditEvent<T = unknown> {
  id: string
  userName: string
  title: string
  created: string
  /** Payload remoto — tipado por quem usa o hook (settings / patch do doc / post). */
  payload: T | null
}

/** Configuração de uma colaboração por coleção/campo. */
export interface LiveEditCollaborationConfig<T = unknown> {
  /** Coleção PocketBase observada (ex.: 'studio_edit_versions', 'posts', 'second_brain_docs'). */
  collection: string
  /** Campo que identifica o material compartilhado (ex.: 'target_key', 'id', 'doc_id'). */
  keyField?: string
  /** Campo com o nome de quem salvou (ex.: 'user_name'); cai em 'user' expandido. */
  userNameField?: string
  /** Campo com o rótulo do material (ex.: 'title', 'content'). */
  titleField?: string
  /** Campo com o payload aplicável (ex.: 'settings', 'content'). */
  payloadField?: string
  /** Mapeia o record remoto para o payload tipado usado pela tela. */
  mapRecord?: (record: UnsubscribeRecord, payload: unknown) => T | null
  /** Filtra a linha de base / eventos recebidos (opcional). */
  accepts?: (record: UnsubscribeRecord) => boolean
}

/** Forma mínima de record usada no subscribe (PocketBaseRecord). */
type UnsubscribeRecord = {
  id: string
  get: (field: string) => unknown
  expand?: Record<string, { name?: string; first_name?: string; email?: string }>
}

/**
 * Colaboração em tempo real generalizada (padrão studio_themes /
 * studio_theme_network_map): assina uma coleção PocketBase pelo mesmo
 * campo-chave (mídia, post, doc) e avisa quando OUTRA pessoa da mesma
 * organização salva o mesmo material — sem sobrescrever o trabalho local:
 * quem está com o material aberto vê um aviso e escolhe atualizar.
 * Best-effort: falha de subscription/lista nunca bloqueia o save.
 */
export function useLiveEditCollaboration<T = AdvancedCustomizationState>(
  targetKey: string | null,
  enabled: boolean,
  config?: LiveEditCollaborationConfig<T>,
) {
  const collectionName = config?.collection || 'studio_edit_versions'
  const keyField = config?.keyField || 'target_key'
  const userNameField = config?.userNameField || 'user_name'
  const titleField = config?.titleField || 'title'
  const payloadField = config?.payloadField || 'settings'

  const [remoteEdit, setRemoteEdit] = useState<LiveEditEvent<T> | null>(null)
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const lastLocalId = useRef<string | null>(null)

  // O id do registro criado pelo próprio usuário local não deve disparar o aviso.
  const registerOwnSave = (recordId: string) => {
    lastLocalId.current = recordId
    setRemoteEdit(null)
  }

  useEffect(() => {
    if (!targetKey || !enabled) return
    setRemoteEdit(null)
    setDismissedId(null)

    const collection = pb.collection(collectionName)
    let cancelled = false

    // Marca o registro mais recente como "linha de base" para não avisar
    // sobre edições que já existiam antes de abrir a tela.
    const loadLatest = async () => {
      try {
        const latest = await collection.getList(1, 1, {
          filter: pb.filter(`${keyField} = {:key}`, { key: targetKey }),
          sort: '-created',
        })
        if (!cancelled && latest.items.length > 0) {
          lastLocalId.current = latest.items[0].id
        }
      } catch {
        /* histórico é best-effort */
      }
    }
    loadLatest()

    const buildEvent = (rec: UnsubscribeRecord): LiveEditEvent<T> | null => {
      const rawPayload = rec.get(payloadField)
      const payload = config?.mapRecord
        ? config.mapRecord(rec, rawPayload)
        : ((rawPayload ?? null) as T | null)
      const author = rec.expand?.user
      const fallbackName = author?.name || author?.first_name || author?.email || 'Outra pessoa'
      return {
        id: rec.id,
        userName: String(rec.get(userNameField) || fallbackName),
        title: String(rec.get(titleField) || 'Material'),
        created: String(rec.get('created') || ''),
        payload,
      }
    }

    const unsub = collection.subscribe('*', (e) => {
      if (cancelled) return
      if (e.action === 'delete') return
      const rec = e.record as unknown as UnsubscribeRecord
      if (rec.get(keyField) !== targetKey) return
      if (config?.accepts && !config.accepts(rec)) return
      if (rec.id === lastLocalId.current) return // salvamento próprio: ignora
      if (rec.id === dismissedId) return
      const ev = buildEvent(rec)
      if (ev) setRemoteEdit(ev)
    })

    return () => {
      cancelled = true
      unsub.then((fn) => fn?.()).catch(() => {})
    }
  }, [
    targetKey,
    enabled,
    dismissedId,
    collectionName,
    keyField,
    userNameField,
    titleField,
    payloadField,
    config?.mapRecord,
    config?.accepts,
  ])

  const dismissRemoteEdit = () => setDismissedId(remoteEdit?.id ?? null)
  const clearRemoteEdit = () => setRemoteEdit(null)

  return { remoteEdit, dismissRemoteEdit, clearRemoteEdit, registerOwnSave }
}

export default useLiveEditCollaboration
