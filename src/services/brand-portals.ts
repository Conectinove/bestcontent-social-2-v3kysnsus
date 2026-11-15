import pb, { pb as pbNamed } from '@/lib/pocketbase/client'
// GUARDA: manter o duplo export (default + nomeado pb) — regressão já ocorreu 15+ vezes.
void pbNamed

const client = pbNamed || pb

const BASE = import.meta.env.VITE_POCKETBASE_URL || ''

export interface PortalColors {
  accentColor: string
  bgColor: string
  textColor: string
  buttonColor: string
}

/** Registro do portal como o painel usa (id do portal + token público). */
export interface BrandPortalRecord {
  portalId: string
  token: string
  published: boolean
  brandName?: string
  accentColor?: string
  bgColor?: string
  textColor?: string
  buttonColor?: string
  logoUrl?: string
  gaMeasurementId?: string
}

/* ------------------------------------------------------------------ */
/* Link público / embed                                                */
/* ------------------------------------------------------------------ */

export function buildPortalUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : BASE || ''
  return `${origin}/portal/${token}`
}

export function buildPortalEmbedCode(token: string): string {
  const url = buildPortalUrl(token)
  return `<iframe src="${url}" width="100%" height="800" frameborder="0" style="border:0;border-radius:12px"></iframe>`
}

/* ------------------------------------------------------------------ */
/* CRUD do portal (rota POST/DELETE /backend/v1/portals/share)         */
/* ------------------------------------------------------------------ */

/** Gera (ou renova) o portal público da marca — rota autenticada do hook. */
export async function createBrandPortal(
  brandId: string,
): Promise<{ token: string; portalId: string; regenerated: boolean }> {
  const res = await client.send<{ token?: string; portalId?: string; regenerated?: boolean }>(
    '/backend/v1/portals/share',
    { method: 'POST', body: { brandId } },
  )
  return {
    token: res?.token || '',
    portalId: res?.portalId || '',
    regenerated: Boolean(res?.regenerated),
  }
}

/** Revoga o link público do portal (share_token volta a vazio). */
export async function revokeBrandPortal(portalId: string): Promise<void> {
  await client.send(`/backend/v1/portals/share/${encodeURIComponent(portalId)}`, {
    method: 'DELETE',
  })
}

/** Busca o portal da marca pelo id (uso no painel, autenticado direto na coleção). */
export async function getBrandPortal(brandId: string): Promise<BrandPortalRecord | null> {
  try {
    const rec = (await client
      .collection('brand_portals')
      .getFirstListItem(`brand="${brandId}" && published=true`)) as Record<string, unknown>
    return mapPortalRecord(rec)
  } catch {
    return null
  }
}

function mapPortalRecord(rec: Record<string, unknown>): BrandPortalRecord {
  const id = String(rec.id || '')
  const logoFile = String(rec.logo_file || '')
  const logoUrl = logoFile ? `${BASE}/api/files/brand_portals/${id}/${logoFile}` : ''
  const snapshot = safeSnapshot(rec.theme_snapshot)
  return {
    portalId: id,
    token: String(rec.share_token || ''),
    published: Boolean(rec.published),
    bgColor: String(rec.bg_color || snapshot.bg_color || ''),
    textColor: String(rec.text_color || snapshot.text_color || ''),
    buttonColor: String(rec.button_color || snapshot.button_color || ''),
    logoUrl,
    gaMeasurementId: String(rec.ga_measurement_id || ''),
    accentColor: String(snapshot.accent_color || ''),
  }
}

function safeSnapshot(raw: unknown): Record<string, string> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, string>
  try {
    return JSON.parse(String(raw)) as Record<string, string>
  } catch {
    return {}
  }
}

/* ------------------------------------------------------------------ */
/* Leitura pública (rota GET /backend/v1/portals/share/{token})        */
/* ------------------------------------------------------------------ */

export interface PublicPortalData {
  id: string
  brandId: string
  brandName: string
  description: string
  logoUrl: string
  accentColor: string
  bgColor: string
  textColor: string
  buttonColor: string
  gaMeasurementId: string
  website: string
}

/** GET público pelo token — devolve marca + cores + logo + GA do portal. */
export async function getPortalByToken(token: string): Promise<PublicPortalData> {
  const res = await client.send<Record<string, unknown>>(
    `/backend/v1/portals/share/${encodeURIComponent(token)}`,
    { method: 'GET' },
  )
  return {
    id: String(res?.portal_id || ''),
    brandId: String(res?.brand_id || ''),
    brandName: String(res?.name || 'Portal'),
    description: String(res?.description || ''),
    logoUrl: String(res?.logo || ''),
    accentColor: String(res?.accent_color || ''),
    bgColor: String(res?.bg_color || ''),
    textColor: String(res?.text_color || ''),
    buttonColor: String(res?.button_color || ''),
    gaMeasurementId: String(res?.ga_measurement_id || ''),
    website: String(res?.website || ''),
  }
}

/* ------------------------------------------------------------------ */
/* Cores por marca (rota POST /backend/v1/portals/theme)               */
/* ------------------------------------------------------------------ */

/** Salva as cores do portal da marca — accent grava na marca, extras no portal. */
export async function setBrandThemeColor(
  brandId: string,
  accentColor: string,
  extras?: Partial<Omit<PortalColors, 'accentColor'>>,
): Promise<string> {
  const res = await client.send<{ accent_color?: string } & Record<string, string>>(
    '/backend/v1/portals/theme',
    {
      method: 'POST',
      body: {
        brandId,
        accentColor,
        bgColor: extras?.bgColor || '',
        textColor: extras?.textColor || '',
        buttonColor: extras?.buttonColor || '',
      },
    },
  )
  return res?.accent_color || accentColor
}

/** Lê a cor de destaque atual da marca (fallback pro preset do painel). */
export async function getBrandThemeColor(brandId: string): Promise<string> {
  try {
    const rec = (await client.collection('brands').getOne(brandId, {
      fields: 'accent_color',
    })) as { accent_color?: string }
    return rec?.accent_color || ''
  } catch {
    return ''
  }
}

/* ------------------------------------------------------------------ */
/* Logo por marca (upload direto no PocketBase, file field logo_file)  */
/* ------------------------------------------------------------------ */

/** Envia o logo do portal (file field `logo_file` em brand_portals). */
export async function uploadPortalLogo(portalId: string, file: File) {
  const form = new FormData()
  form.append('logo_file', file)
  return client.collection('brand_portals').update(portalId, form)
}

/** Remove o logo do portal (campo volta a vazio; a URL antiga deixa de existir). */
export async function removePortalLogo(portalId: string) {
  return client.collection('brand_portals').update(portalId, { logo_file: null })
}

/* ------------------------------------------------------------------ */
/* Google Analytics do portal público                                  */
/* ------------------------------------------------------------------ */

/** Valida formato G-XXXXXXXXXX ou UA-XXXXXXXX-X — retorna null se inválido. */
export function validateGaMeasurementId(gaId: string): string | null {
  const raw = gaId.trim()
  if (!raw) return '' // vazio = remover o script
  if (/^G-[A-Z0-9]{6,12}$/i.test(raw) || /^UA-\d{4,10}-\d{1,4}$/i.test(raw)) return raw
  return null
}

/** Salva o Measurement ID do Google Analytics (vazio remove o script). */
export async function savePortalGaId(portalId: string, gaId: string) {
  return client.collection('brand_portals').update(portalId, { ga_measurement_id: gaId.trim() })
}
