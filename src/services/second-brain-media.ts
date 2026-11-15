/**
 * Camada de serviço da grade Mídias & Anexos do Segundo Cérebro.
 * Agrega fontes (doc, acervo, uploads, biblioteca) e aplica filtros
 * compartilhados: busca de texto + tipo (imagem/vídeo/anexo/link) + período.
 */
import pb from '@/lib/pocketbase/client'

export type SecondBrainMediaType = 'imagem' | 'video' | 'anexo' | 'link'
export type SecondBrainDateFilter = 'all' | '7d' | '30d' | '90d'
export type SecondBrainSourceTab =
  | 'document'
  | 'bank'
  | 'uploads'
  | 'library'
  | 'drive'
  | 'unsplash'
  | 'pexels'
  | 'favorites'

export interface SecondBrainMediaItem {
  id: string
  source: 'document' | 'bank' | 'uploads' | 'library' | 'drive' | 'unsplash' | 'pexels'
  type: SecondBrainMediaType
  name: string
  url: string
  thumbUrl?: string
  createdAt?: string
  tags?: string[]
  meta?: Record<string, unknown>
}

export interface SecondBrainMediaFilters {
  query: string
  type: 'all' | SecondBrainMediaType
  period: SecondBrainDateFilter
}

export const DEFAULT_MEDIA_FILTERS: SecondBrainMediaFilters = {
  query: '',
  type: 'all',
  period: 'all',
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv)$/i

export const mediaTypeFromUrl = (url = '', mime = ''): SecondBrainMediaType => {
  const u = (url || '').toLowerCase()
  if (mime.startsWith('video/') || VIDEO_EXT.test(u)) return 'video'
  if (mime.startsWith('image/') || IMAGE_EXT.test(u)) return 'imagem'
  if (/^https?:\/\//i.test(url) && !IMAGE_EXT.test(u) && !VIDEO_EXT.test(u)) return 'link'
  return 'anexo'
}

/** true quando o item passa pelos filtros ativos (texto + tipo + período). */
export function matchesMediaFilters(
  item: SecondBrainMediaItem,
  f: SecondBrainMediaFilters,
): boolean {
  if (f.type !== 'all' && item.type !== f.type) return false
  if (f.period !== 'all') {
    if (!item.createdAt) return false
    const days = f.period === '7d' ? 7 : f.period === '30d' ? 30 : 90
    const ts = new Date(item.createdAt).getTime()
    if (!Number.isFinite(ts)) return false
    if (Date.now() - ts > days * 24 * 60 * 60 * 1000) return false
  }
  const q = f.query.trim().toLowerCase()
  if (!q) return true
  const haystack = [item.name, item.url, ...(item.tags || [])].join(' ').toLowerCase()
  return q.split(/\s+/).every((part) => haystack.includes(part))
}

/** Aplica os filtros a uma lista já carregada (fontes locais e remotas). */
export function applyMediaFilters(
  items: SecondBrainMediaItem[],
  f: SecondBrainMediaFilters,
): SecondBrainMediaItem[] {
  return items.filter((i) => matchesMediaFilters(i, f))
}

/* ------------------------------- Acervo -------------------------------- */

const fromBankAsset = (r: Record<string, unknown>): SecondBrainMediaItem => ({
  id: String(r.id),
  source: 'bank',
  type: 'imagem',
  name: String(r.name || 'Acervo'),
  url: String(r.preview_url || ''),
  thumbUrl: String(r.preview_url || ''),
  createdAt: typeof r.created === 'string' ? r.created : undefined,
  tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
})

export async function listBankAssets(): Promise<SecondBrainMediaItem[]> {
  try {
    const recs = await pb.collection('image_bank_assets').getFullList({
      filter: `user = "${pb.authStore.record?.id || ''}"`,
      sort: '-created',
    })
    return recs.map((r) => fromBankAsset(r as unknown as Record<string, unknown>))
  } catch {
    return []
  }
}

/* ------------------------------ Uploads -------------------------------- */

const fromPostMedia = (p: Record<string, unknown>): SecondBrainMediaItem[] => {
  const media = Array.isArray(p.media) ? (p.media as string[]) : []
  const base = String(p.created || '')
  const out: SecondBrainMediaItem[] = []
  for (let i = 0; i < media.length; i++) {
    const url = pb.files.getURL(p as unknown as Record<string, unknown>, media[i])
    out.push({
      id: `${p.id}_${i}`,
      source: 'uploads',
      type: mediaTypeFromUrl(url),
      name: media[i].split('/').pop() || 'Upload',
      url,
      thumbUrl: url,
      createdAt: base,
      tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
      meta: { postId: String(p.id) },
    })
  }
  return out
}

export async function listUploadsMedia(): Promise<SecondBrainMediaItem[]> {
  try {
    const recs = await pb.collection('posts').getFullList({
      filter: `user = "${pb.authStore.record?.id || ''}" && media != ""`,
      sort: '-created',
    })
    return recs.flatMap((r) => fromPostMedia(r as unknown as Record<string, unknown>))
  } catch {
    return []
  }
}

/* ----------------------------- Biblioteca ------------------------------ */

const fromLibraryPost = (p: Record<string, unknown>): SecondBrainMediaItem => {
  const imageUrl = String(p.image_url || '')
  const url = imageUrl.startsWith('http')
    ? imageUrl
    : imageUrl
      ? pb.files.getURL(p as unknown as Record<string, unknown>, imageUrl)
      : ''
  return {
    id: String(p.id),
    source: 'library',
    type: url ? mediaTypeFromUrl(url, String(p.media_type || '')) : 'anexo',
    name: String(p.title || 'Sem título'),
    url,
    thumbUrl: url,
    createdAt: typeof p.created === 'string' ? p.created : undefined,
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
  }
}

export async function listLibraryMedia(): Promise<SecondBrainMediaItem[]> {
  try {
    const recs = await pb.collection('posts').getFullList({
      filter: `user = "${pb.authStore.record?.id || ''}" && origin = 'external_asset'`,
      sort: '-created',
    })
    return recs.map((r) => fromLibraryPost(r as unknown as Record<string, unknown>))
  } catch {
    return []
  }
}

/* ------------------------------- Drive --------------------------------- */

const DRIVE_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const DRIVE_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime']

const fromDriveFile = (f: Record<string, unknown>): SecondBrainMediaItem => {
  const id = String(f.id || f.fileId || '')
  const mime = String(f.mimeType || f.mimetype || '')
  const name = String(f.name || f.title || 'Arquivo')
  const type = DRIVE_IMAGE_MIMES.includes(mime)
    ? 'imagem'
    : DRIVE_VIDEO_MIMES.includes(mime)
      ? 'video'
      : 'anexo'
  return {
    id: `drive_${id}`,
    source: 'drive',
    type,
    name,
    url: `https://drive.google.com/uc?export=view&id=${id}`,
    thumbUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w400`,
    createdAt: typeof f.createdTime === 'string' ? f.createdTime : undefined,
    tags: ['drive'],
    meta: { driveFileId: id, mimeType: mime },
  }
}

/** Lista arquivos de imagem/vídeo do Drive do usuário conectado (conectores). */
export async function listDriveMedia(
  query = '',
): Promise<{ items: SecondBrainMediaItem[]; error: string | null }> {
  try {
    const { execute } = await import('@/lib/skipConnectors')
    const args: Record<string, unknown> = {
      pageSize: 40,
      orderBy: 'folder desc, modifiedTime desc',
      fields: 'files(id,name,mimeType,thumbnailLink,iconLink,createdTime)',
      spaces: 'drive',
    }
    if (query.trim()) args.q = `name contains '${query.trim().replace(/'/g, "\\'")}'`
    const res = await execute('GOOGLEDRIVE_LIST_FILES', args)
    if (!res.successful) {
      return { items: [], error: res.error || 'Falha ao listar o Google Drive.' }
    }
    const data = res.data as { files?: unknown } | undefined
    const files = Array.isArray(data?.files) ? (data.files as Record<string, unknown>[]) : []
    const mediaFiles = files.filter((f) => {
      const mime = String(f.mimeType || '')
      return (
        DRIVE_IMAGE_MIMES.includes(mime) ||
        DRIVE_VIDEO_MIMES.includes(mime) ||
        mime.startsWith('image/')
      )
    })
    return { items: mediaFiles.map(fromDriveFile), error: null }
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : 'Falha ao listar o Google Drive.' }
  }
}

/* --------------------------- Unsplash / Pexels ------------------------- */

export interface StockSearchResult {
  id: string
  title: string
  thumb_url?: string
  url: string
  width?: number
  height?: number
  author?: string
  author_url?: string
  source: 'unsplash' | 'pexels'
}

export interface StockSearchState {
  loading: boolean
  configured: boolean | null
  message: string | null
  results: StockSearchResult[]
}

export async function searchStockProvider(
  provider: 'unsplash' | 'pexels',
  q: string,
): Promise<StockSearchState> {
  if (!q.trim()) {
    return { loading: false, configured: true, message: null, results: [] }
  }
  try {
    const res = await pb.send(
      `/backend/v1/secondbrain/stock-search?provider=${provider}&q=${encodeURIComponent(q)}`,
      { method: 'GET' },
    )
    const data = res as {
      success?: boolean
      configured?: boolean
      message?: string
      results?: StockSearchResult[]
    }
    if (data.configured === false) {
      return { loading: false, configured: false, message: data.message || null, results: [] }
    }
    if (!data.success) {
      return { loading: false, configured: true, message: data.message || null, results: [] }
    }
    return { loading: false, configured: true, message: null, results: data.results || [] }
  } catch (e) {
    return {
      loading: false,
      configured: true,
      message: e instanceof Error ? e.message : 'Falha na busca.',
      results: [],
    }
  }
}

export async function fetchStockStatus(): Promise<{ unsplash: boolean; pexels: boolean }> {
  try {
    const res = (await pb.send('/backend/v1/secondbrain/stock-status', { method: 'GET' })) as {
      unsplash_configured?: boolean
      pexels_configured?: boolean
    }
    return { unsplash: Boolean(res.unsplash_configured), pexels: Boolean(res.pexels_configured) }
  } catch {
    return { unsplash: false, pexels: false }
  }
}

/** Creditos exigidos pelas APIs públicas (atribuição). */
export const stockAttribution = (r: StockSearchResult): string =>
  r.source === 'unsplash'
    ? `Foto: ${r.author || 'Autor desconhecido'} no Unsplash`
    : `Foto: ${r.author || 'Fotógrafo'} no Pexels`
