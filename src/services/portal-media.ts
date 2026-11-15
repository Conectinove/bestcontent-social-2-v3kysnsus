import pb, { pb as pbNamed } from '@/lib/pocketbase/client'
// GUARDA: manter o duplo export (default + nomeado pb) — regressão já ocorreu 17+ vezes.
void pbNamed
const client = pbNamed || pb

import type { PortalBlock } from '@/services/portal-pages'

/** Limite de tamanho do upload de vídeo próprio (50 MB). */
export const PORTAL_VIDEO_MAX_BYTES = 50 * 1024 * 1024

export interface PortalMediaRecord {
  id: string
  file: string
  url: string
  size: number
  created: string
}

/**
 * Envia um vídeo próprio do usuário (pedido "permitir upload de video proprio").
 * Cria um record em portal_media com o arquivo (FormData, padrão do upload de logo).
 * Lança erro com mensagem amigável se o arquivo passar do limite.
 */
export async function uploadPortalVideo(
  userId: string,
  brandId: string,
  file: File,
): Promise<PortalMediaRecord> {
  if (file.size > PORTAL_VIDEO_MAX_BYTES) {
    throw new Error(
      `Vídeo muito grande (${(file.size / (1024 * 1024)).toFixed(1)} MB). O limite é 50 MB — compacte o arquivo ou use um link do YouTube/Vimeo.`,
    )
  }
  const form = new FormData()
  form.append('user', userId)
  form.append('brand', brandId)
  form.append('file', file)
  const rec = (await client.collection('portal_media').create(form)) as Record<string, unknown>
  return mapMedia(rec)
}

/** Lista os vídeos próprios enviados pela marca (para reusar em blocos). */
export async function listPortalVideos(brandId: string): Promise<PortalMediaRecord[]> {
  const recs = (await client.collection('portal_media').getFullList({
    filter: `brand = "${brandId}"`,
    sort: '-created',
  })) as unknown as Record<string, unknown>[]
  return recs.map(mapMedia)
}

/** Remove o record do vídeo (o arquivo sai do storage junto). */
export async function deletePortalVideo(mediaId: string) {
  await client.collection('portal_media').delete(mediaId)
}

function mapMedia(rec: Record<string, unknown>): PortalMediaRecord {
  const id = String(rec.id || '')
  const file = String(rec.file || '')
  return {
    id,
    file,
    url: file
      ? `${import.meta.env.VITE_POCKETBASE_URL || ''}/api/files/portal_media/${id}/${file}`
      : '',
    size: Number(rec.size || 0),
    created: String(rec.created || ''),
  }
}

/** Type guard: o bloco é um vídeo próprio (tem mediaId). */
export function isOwnVideoBlock(block: PortalBlock): boolean {
  return block.type === 'video' && Boolean(block.mediaId)
}
