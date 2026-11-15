import pb from '@/lib/pocketbase/client'

export type PortalBlockType =
  | 'title'
  | 'text'
  | 'image'
  | 'cta'
  | 'spacer'
  | 'gallery'
  | 'video'
  | 'divider'
  | 'quote'

/** Um bloco arrastável de página de portal — campos extras por tipo. */
export interface PortalBlock {
  id: string
  type: PortalBlockType
  text?: string
  /** URL da imagem (image), do vídeo (video) ou do link (cta). */
  url?: string
  /** Galeria: lista de URLs de imagens. */
  urls?: string[]
  /** Citação: autor. */
  author?: string
  height?: number
}

export interface PortalPageContent {
  text?: string
  blocks?: PortalBlock[]
  sections?: { title: string; body: string }[]
  contact?: { email?: string; phone?: string; whatsapp?: string; address?: string }
  [key: string]: unknown
}

export interface PortalPage {
  id: string
  title: string
  slug: string
  content: PortalPageContent
  sort_order: number
  is_visible: boolean
  created: string
  updated: string
}

/** Lista as páginas internas do portal de uma marca (uso no painel, autenticado). */
export async function listPortalPages(brandId: string): Promise<PortalPage[]> {
  return pb.collection('portal_pages').getFullList({
    filter: `brand = "${brandId}"`,
    sort: 'sort_order,created',
  })
}

export async function createPortalPage(data: {
  user: string
  brand: string
  title: string
  slug: string
  content?: PortalPageContent
  sort_order?: number
  is_visible?: boolean
}): Promise<PortalPage> {
  return pb.collection('portal_pages').create(data)
}

export async function updatePortalPage(id: string, data: Partial<PortalPage>) {
  return pb.collection('portal_pages').update(id, data)
}

export async function deletePortalPage(id: string) {
  return pb.collection('portal_pages').delete(id)
}

/** Gera slug simples a partir do título (ex: "Sobre Nós" -> "sobre-nos"). */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

/** Busca pública (sem auth) das páginas internas de um portal por token. */
export async function fetchPublicPortalPages(
  token: string,
): Promise<{ id: string; title: string; slug: string; content: PortalPageContent }[]> {
  const res = await pb.send(`/backend/v1/portals/pages/${encodeURIComponent(token)}`, {
    method: 'GET',
  })
  return res?.pages ?? []
}

/** Registra visita pública (sem dados pessoais) — chamado pela página /portal/:token. */
export async function recordPortalVisit(token: string, pageSlug: string) {
  try {
    await pb.send(`/backend/v1/portals/visits/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageSlug,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      }),
    })
  } catch {
    /* visita é best-effort — nunca bloqueia a renderização do portal */
  }
}
