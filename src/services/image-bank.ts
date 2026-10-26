import { pb } from '@/lib/pocketbase/client'

export interface ImageBankAsset {
  id: string
  name: string
  file?: string
  preview_url?: string
  category:
    | 'negocios'
    | 'educacao'
    | 'alimentacao'
    | 'tecnologia'
    | 'estilo_de_vida'
    | 'saude'
    | 'moda'
    | 'geral'
  network?: string
  tags?: string[]
  is_curated: boolean
  user?: string
  brand?: string
  width?: number
  height?: number
  created: string
  updated: string
}

export interface GetImageBankParams {
  category?: string
  network?: string
  search?: string
  onlyCurated?: boolean
  onlyMine?: boolean
  page?: number
  perPage?: number
}

export function getAssetUrl(asset: ImageBankAsset): string {
  if (asset.file) {
    return pb.files.getURL(asset as any, asset.file)
  }
  return asset.preview_url || ''
}

export async function getImageBankAssets(
  params: GetImageBankParams = {},
): Promise<ImageBankAsset[]> {
  const filters: string[] = []

  if (params.category && params.category !== 'todas') {
    filters.push(`category = "${params.category}"`)
  }

  if (params.network && params.network !== 'todas') {
    filters.push(`(network = "${params.network}" || network = "todas")`)
  }

  if (params.onlyCurated) {
    filters.push('is_curated = true')
  }

  if (params.onlyMine && pb.authStore.record?.id) {
    filters.push(`user = "${pb.authStore.record.id}"`)
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim().replace(/"/g, '')
    filters.push(`(name ~ "${q}" || tags ~ "${q}")`)
  }

  const filter = filters.length > 0 ? filters.join(' && ') : ''

  const records = await pb.collection('image_bank_assets').getFullList<any>({
    filter: filter || undefined,
    sort: '-is_curated,-created',
  })

  return records.map((r) => {
    let tagsParsed: string[] = []
    if (Array.isArray(r.tags)) {
      tagsParsed = r.tags
    } else if (typeof r.tags === 'string') {
      try {
        tagsParsed = JSON.parse(r.tags)
      } catch {
        tagsParsed = [r.tags]
      }
    }

    return {
      id: r.id,
      name: r.name,
      file: r.file,
      preview_url: r.preview_url,
      category: r.category || 'geral',
      network: r.network || 'todas',
      tags: tagsParsed,
      is_curated: Boolean(r.is_curated),
      user: r.user,
      brand: r.brand,
      width: r.width,
      height: r.height,
      created: r.created,
      updated: r.updated,
    }
  })
}

export async function uploadImageBankAsset(
  file: File,
  data: {
    name?: string
    category?: string
    network?: string
    tags?: string[]
    brand?: string
  } = {},
): Promise<ImageBankAsset> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', data.name || file.name.replace(/\.[^/.]+$/, ''))
  formData.append('category', data.category || 'geral')
  formData.append('network', data.network || 'todas')
  formData.append('is_curated', 'false')
  formData.append('user', pb.authStore.record?.id || '')
  if (data.brand) formData.append('brand', data.brand)
  if (data.tags) formData.append('tags', JSON.stringify(data.tags))

  const record = await pb.collection('image_bank_assets').create<any>(formData)
  return {
    id: record.id,
    name: record.name,
    file: record.file,
    preview_url: record.preview_url,
    category: record.category,
    network: record.network,
    tags: Array.isArray(record.tags) ? record.tags : [],
    is_curated: false,
    user: record.user,
    brand: record.brand,
    width: record.width,
    height: record.height,
    created: record.created,
    updated: record.updated,
  }
}
