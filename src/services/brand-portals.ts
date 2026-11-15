/**
 * Portal público de marca (pedidos "gerar portais" + "incorporar"):
 * o token vive na coleção brand_portals (migration 0114) e as rotas ficam
 * no hook portal_share.js — espelho do fluxo de preset_share. Regenerar
 * invalida o link anterior; revogar despublica.
 */
import pb from '@/lib/pocketbase/client'

export interface BrandPortalData {
  format: 'midiaviva-portal'
  version: number
  name: string
  description?: string
  logo?: string
  website?: string
  color_theme?: string
  theme?: Record<string, unknown>
  portal_id?: string
}

/** Gera (ou renova — invalida o link anterior) o portal da marca. */
export async function createBrandPortal(brandId: string): Promise<{
  token: string
  url: string
  regenerated: boolean
}> {
  const res = await pb.send<{ success?: boolean; token?: string; regenerated?: boolean }>(
    '/backend/v1/portals/share',
    { method: 'POST', body: { brandId } },
  )
  if (!res?.token) throw new Error('O backend não devolveu o token do portal.')
  return {
    token: res.token,
    url: buildPortalUrl(res.token),
    regenerated: Boolean(res.regenerated),
  }
}

/** Revoga (despublica) o portal — o link antigo para de funcionar. */
export async function revokeBrandPortal(portalId: string): Promise<void> {
  await pb.send(`/backend/v1/portals/share/${encodeURIComponent(portalId)}`, { method: 'DELETE' })
}

/** Monta a URL pública do portal a partir do token. */
export function buildPortalUrl(token: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (import.meta.env.VITE_POCKETBASE_URL as string) || ''
  return `${base}/portal/${encodeURIComponent(token)}`
}

/** Portal já existente de uma marca (para o painel mostrar o link atual). */
export interface BrandPortalRecord {
  portalId: string
  token: string
  published: boolean
}

export async function getBrandPortal(brandId: string): Promise<BrandPortalRecord | null> {
  try {
    const rec = await pb.collection('brand_portals').getFirstListItem(`brand = "${brandId}"`)
    if (!rec?.id) return null
    return { portalId: rec.id, token: rec.share_token || '', published: Boolean(rec.published) }
  } catch {
    return null
  }
}

/** Busca a marca pública pelo token (rota pública do hook). */
export async function fetchPublicPortal(token: string): Promise<BrandPortalData> {
  const data = await pb.send<BrandPortalData>(
    `/backend/v1/portals/share/${encodeURIComponent(token)}`,
    { method: 'GET' },
  )
  if (!data || data.format !== 'midiaviva-portal') {
    throw new Error('Este link não aponta para um portal válido do MidiaViva.')
  }
  return data
}

/** Código de embed <iframe> para colar em HTML externo. */
export function buildPortalEmbedCode(token: string): string {
  return `<iframe src="${buildPortalUrl(token)}" width="100%" height="600" frameborder="0" style="border:0;border-radius:12px;overflow:hidden" title="Portal da marca"></iframe>`
}
