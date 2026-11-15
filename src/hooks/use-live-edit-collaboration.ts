import { useEffect, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'

export interface LiveEditEvent {
  id: string
  userName: string
  title: string
  created: string
  settings: AdvancedCustomizationState | null
}

/**
 * Colaboração em tempo real (padrão studio_themes / studio_theme_network_map):
 * assina a coleção studio_edit_versions pelo mesmo target_key (mídia/post).
 * Quando OUTRA pessoa da mesma organização salva uma edição avançada do
 * mesmo material, o evento chega ao vivo — sem sobrescrever o trabalho local:
 * quem está com o material aberto vê um aviso e escolhe atualizar.
 */
export function useLiveEditCollaboration(targetKey: string | null, enabled: boolean) {
  const [remoteEdit, setRemoteEdit] = useState<LiveEditEvent | null>(null)
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const lastLocalId = useRef<string | null>(null)

  // O id da versão criada pelo próprio usuário local não deve disparar o aviso.
  const registerOwnSave = (versionId: string) => {
    lastLocalId.current = versionId
    setRemoteEdit(null)
  }

  useEffect(() => {
    if (!targetKey || !enabled) return
    setRemoteEdit(null)
    setDismissedId(null)

    const collection = pb.collection('studio_edit_versions')
    let cancelled = false

    // Marca a versão mais recente como "linha de base" para não avisar sobre
    // edições que já existiam antes de abrir o dialog.
    const loadLatest = async () => {
      try {
        const latest = await collection.getList(1, 1, {
          filter: pb.filter('target_key = {:key}', { key: targetKey }),
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

    const unsub = collection.subscribe('*', (e) => {
      if (cancelled) return
      if (e.action === 'delete') return
      const rec = e.record
      if (rec.get('target_key') !== targetKey) return
      if (rec.id === lastLocalId.current) return // salvamento próprio: ignora
      if (rec.id === dismissedId) return
      setRemoteEdit({
        id: rec.id,
        userName: rec.get('user_name') || 'Outra pessoa',
        title: rec.get('title') || 'Mídia',
        created: rec.get('created') || '',
        settings: (rec.get('settings') || null) as AdvancedCustomizationState | null,
      })
    })

    return () => {
      cancelled = true
      unsub.then((fn) => fn?.()).catch(() => {})
    }
  }, [targetKey, enabled, dismissedId])

  const dismissRemoteEdit = () => setDismissedId(remoteEdit?.id ?? null)
  const clearRemoteEdit = () => setRemoteEdit(null)

  return { remoteEdit, dismissRemoteEdit, clearRemoteEdit, registerOwnSave }
}

export default useLiveEditCollaboration
