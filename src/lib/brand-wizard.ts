import type { SocialBrand } from '@/context/SocialContext'

export type BrandWizardData = {
  name: string
  description: string
  essence: string
  target_audience: string
  voice_tone: string
  online_presence: string
  sector: string
  tags: string
  networks: string[]
  instagram: string
  tiktok: string
  youtube: string
  facebook: string
  website: string
  color_primary: string
  color_secondary: string
  color_accent: string
  style_preferences: string[]
}

export const BRAND_FIELDS = [
  'essence',
  'voice_tone',
  'online_presence',
  'sector',
  'tags',
  'color_primary',
  'color_secondary',
  'color_accent',
  'style_preferences',
  'status',
  'sort_order',
] as const

export const BRAND_NETWORKS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'Ex.: @ronaldo.barreto1' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'Ex.: @midiaviva' },
  { key: 'youtube', label: 'YouTube', placeholder: 'Ex.: @midiaviva' },
  { key: 'facebook', label: 'Facebook', placeholder: 'Ex.: /midiaviva' },
  { key: 'website', label: 'Site', placeholder: 'Ex.: https://midiaviva.goskip.app' },
]

export const VOICE_TONES = [
  'Profissional',
  'Direto',
  'Inspirador',
  'Divertido',
  'Educativo',
  'Provocativo',
  'Acolhedor',
  'Técnico',
]

export const STYLE_OPTIONS = [
  'Minimalista',
  'Colorido',
  'Corporativo',
  'Divertido',
  'Fotográfico',
  'Ilustrado',
  'Tipografia forte',
  'Dark mode',
]

export function fromRecordToWizardData(record: SocialBrand & Record<string, any>): BrandWizardData {
  return {
    name: record.name || '',
    description: record.description || '',
    essence: record.essence || '',
    target_audience: record.target_audience || '',
    voice_tone: record.voice_tone || '',
    online_presence: record.online_presence || '',
    sector: record.sector || '',
    tags: record.tags || '',
    networks: BRAND_NETWORKS.filter(
      (n) => (record as any)[n.key] && String((record as any)[n.key]).trim() !== '',
    ).map((n) => n.key),
    instagram: (record as any).instagram || '',
    tiktok: (record as any).tiktok || '',
    youtube: (record as any).youtube || '',
    facebook: (record as any).facebook || '',
    website: (record as any).website || (record as any).website_url || '',
    color_primary: (record as any).color_primary || '#7c3aed',
    color_secondary: (record as any).color_secondary || '#c4b5fd',
    color_accent: (record as any).color_accent || '#8b5cf6',
    style_preferences: parseJsonArray((record as any).style_preferences),
  }
}

export function parseJsonArray(value: any): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function buildBrandPayload(data: BrandWizardData, userId: string, logoFile: File | null) {
  const formData = new FormData()
  formData.append('user', userId)
  formData.append('name', data.name.trim())
  formData.append('description', data.description || '')
  formData.append('essence', data.essence || '')
  formData.append('target_audience', data.target_audience || '')
  formData.append('voice_tone', data.voice_tone || '')
  formData.append('online_presence', data.online_presence || '')
  formData.append('sector', data.sector || '')
  formData.append('tags', data.tags || '')
  for (const n of BRAND_NETWORKS) formData.append(n.key, (data as any)[n.key] || '')
  formData.append('color_primary', data.color_primary || '')
  formData.append('color_secondary', data.color_secondary || '')
  formData.append('color_accent', data.color_accent || '')
  formData.append('style_preferences', JSON.stringify(data.style_preferences || []))
  formData.append('status', 'active')
  if (logoFile) formData.append('logo', logoFile)
  return formData
}
