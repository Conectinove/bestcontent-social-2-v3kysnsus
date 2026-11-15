import pb, { pb as pbNamed } from '@/lib/pocketbase/client'
// GUARDA: manter o duplo export (default + nomeado pb) — regressão já ocorreu 17+ vezes.
void pbNamed
const client = pbNamed || pb

import type { PortalPageContent } from '@/services/portal-pages'

/** Uma versão salva da página (snapshot de content no momento do salvamento). */
export interface PortalPageVersion {
  id: string
  page: string
  version: number
  title: string
  content: PortalPageContent
  note: string
  created: string
}

/** Lista o histórico de versões de uma página (mais recentes primeiro, máx. 50). */
export async function listPageVersions(pageId: string): Promise<PortalPageVersion[]> {
  const recs = (await client.collection('portal_page_versions').getFullList({
    filter: `page = "${pageId}"`,
    sort: '-version',
  })) as unknown as Record<string, unknown>[]
  return recs.map(mapVersion)
}

/**
 * Restaura uma versão anterior: grava o content do snapshot de volta na página.
 * O hook onRecordUpdateRequest cria um novo snapshot da versão atual antes,
 * então a versão substituída nunca se perde.
 */
/** Salva (ou atualiza) a nota/anotação de uma versão (migration 0122: note text). */
export async function savePageVersionNote(versionId: string, note: string) {
  return client.collection('portal_page_versions').update(versionId, { note })
}

export async function restorePageVersion(pageId: string, version: PortalPageVersion) {
  return client.collection('portal_pages').update(pageId, {
    content: version.content,
    title: version.title,
  })
}

function mapVersion(rec: Record<string, unknown>): PortalPageVersion {
  let content: PortalPageContent = {}
  const raw = rec.content
  if (typeof raw === 'string') {
    try {
      content = JSON.parse(raw) as PortalPageContent
    } catch {
      content = { text: raw }
    }
  } else if (raw && typeof raw === 'object') {
    content = raw as PortalPageContent
  }
  return {
    id: String(rec.id || ''),
    page: String(rec.page || ''),
    version: Number(rec.version || 0),
    title: String(rec.title || ''),
    content,
    note: String(rec.note || ''),
    created: String(rec.created || ''),
  }
}
