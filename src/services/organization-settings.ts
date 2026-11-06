import { pb } from '@/lib/pocketbase/client'

export interface OrganizationSettings {
  id?: string
  user?: string
  brand?: string
  custom_webhook_url?: string
  custom_webhook_secret?: string
  webhook_events?: string[]
  google_ads_id?: string
  meta_pixel_id?: string
  tiktok_pixel_id?: string
  linkedin_partner_id?: string
  pinterest_tag_id?: string
  extra_settings?: Record<string, any>
  created?: string
  updated?: string
}

const COLLECTION = 'organization_settings'
const LOCAL_STORAGE_KEY = 'midiaviva_org_settings_cache'

export async function getOrganizationSettings(brandId?: string): Promise<OrganizationSettings> {
  const userId = pb.authStore.record?.id

  // Tenta buscar no PocketBase
  try {
    const filters: string[] = []
    if (brandId) {
      filters.push(`brand = "${brandId}"`)
    } else if (userId) {
      filters.push(`user = "${userId}"`)
    }

    const records = await pb.collection(COLLECTION).getFullList<OrganizationSettings>({
      filter: filters.length > 0 ? filters.join(' || ') : undefined,
      sort: '-created',
      limit: 1,
    })

    if (records && records.length > 0) {
      const found = records[0]
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(found))
      } catch {
        /* intentionally ignored */
      }
      return found
    }
  } catch (err) {
    console.warn('[OrganizationSettings] Erro ao buscar do PocketBase, tentando fallback:', err)
  }

  // Fallback cache local
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {
    /* intentionally ignored */
  }

  return {
    custom_webhook_url: '',
    custom_webhook_secret: '',
    webhook_events: ['post.published', 'lead.captured', 'campaign.completed'],
    google_ads_id: '',
    meta_pixel_id: '',
    tiktok_pixel_id: '',
    linkedin_partner_id: '',
    pinterest_tag_id: '',
  }
}

export async function saveOrganizationSettings(
  data: Partial<OrganizationSettings>,
): Promise<OrganizationSettings> {
  const userId = pb.authStore.record?.id
  const payload: Record<string, any> = {
    custom_webhook_url: data.custom_webhook_url || '',
    custom_webhook_secret: data.custom_webhook_secret || '',
    webhook_events: data.webhook_events || [],
    google_ads_id: data.google_ads_id || '',
    meta_pixel_id: data.meta_pixel_id || '',
    tiktok_pixel_id: data.tiktok_pixel_id || '',
    linkedin_partner_id: data.linkedin_partner_id || '',
    pinterest_tag_id: data.pinterest_tag_id || '',
    extra_settings: data.extra_settings || {},
  }

  if (userId) payload.user = userId
  if (data.brand) payload.brand = data.brand

  try {
    let saved: OrganizationSettings
    if (data.id) {
      saved = await pb.collection(COLLECTION).update<OrganizationSettings>(data.id, payload)
    } else {
      // Verifica se já existe um registro do usuário
      const existing = await getOrganizationSettings(data.brand)
      if (existing?.id) {
        saved = await pb.collection(COLLECTION).update<OrganizationSettings>(existing.id, payload)
      } else {
        saved = await pb.collection(COLLECTION).create<OrganizationSettings>(payload)
      }
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saved))
    } catch {
      /* intentionally ignored */
    }

    return saved
  } catch (err) {
    console.warn('[OrganizationSettings] Erro ao salvar no PocketBase, usando cache local:', err)
    const fallback: OrganizationSettings = {
      ...data,
      id: data.id || `local-${Date.now()}`,
      updated: new Date().toISOString(),
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fallback))
    } catch {
      /* intentionally ignored */
    }
    return fallback
  }
}

export async function testWebhookPing(
  url: string,
  secret?: string,
): Promise<{ success: boolean; message: string; status?: number }> {
  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      message: 'A URL do webhook deve começar com http:// ou https://',
    }
  }

  try {
    const payload = {
      event: 'ping.test',
      app: 'MidiaViva - BestContent AI',
      timestamp: new Date().toISOString(),
      sample_data: {
        message: 'Teste de webhook configurado com sucesso no MidiaViva',
        environment: 'production',
      },
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (secret) {
      headers['X-Webhook-Secret'] = secret
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (
      res.ok ||
      res.status === 200 ||
      res.status === 201 ||
      res.status === 202 ||
      res.status === 204
    ) {
      return {
        success: true,
        status: res.status,
        message: `Webhook respondeu com status ${res.status} OK!`,
      }
    }

    return {
      success: false,
      status: res.status,
      message: `Webhook respondeu com código de erro ${res.status} (${res.statusText || 'Não autorizado/Falha'}).`,
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Não foi possível alcançar o endpoint: ${err?.message || 'Erro de conexão/CORS'}. Verifique se o servidor aceita requisições POST.`,
    }
  }
}
