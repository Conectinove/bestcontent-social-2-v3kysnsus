const PB_URL = import.meta.env.VITE_POCKETBASE_URL

export function getFileUrl(record: any, field: string): string | undefined {
  if (!record?.[field]) return undefined
  return `${PB_URL}/api/files/${record.collectionId}/${record.id}/${record[field]}`
}

export const PLATFORM_TO_DB: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
}

export const PLATFORM_FROM_DB: Record<string, string> = {
  Instagram: 'instagram',
  TikTok: 'tiktok',
  YouTube: 'youtube',
  Facebook: 'facebook',
  LinkedIn: 'linkedin',
  'Twitter/X': 'twitter',
}

export function mapBrand(record: any) {
  return {
    id: record.id,
    name: record.name,
    logo:
      getFileUrl(record, 'logo') ||
      `https://img.usecurling.com/p/200/200?q=${encodeURIComponent(record.name)}%20logo`,
    coverImage: `https://img.usecurling.com/p/800/400?q=${encodeURIComponent(record.name)}%20brand`,
    description: record.description || 'Sem descrição cadastrada.',
    handles: {
      instagram: record.instagram || undefined,
      tiktok: record.tiktok || undefined,
      youtube: record.youtube || undefined,
      facebook: record.facebook || undefined,
      website: record.website || undefined,
    },
    stats: { postsThisWeek: 0, engagementRate: '—', followers: '—' },
    color_theme: record.color_theme || '#BF2A95',
    _raw: record,
  }
}

export function mapPost(record: any) {
  const mediaUrl = getFileUrl(record, 'media')
  return {
    id: record.id,
    brandId: record.brand,
    platform: (PLATFORM_FROM_DB[record.platform] || 'instagram') as any,
    contentType: 'post' as const,
    content: record.content || '',
    caption: record.caption || record.content || '',
    mediaUrls: mediaUrl ? [mediaUrl] : [],
    status: record.status || 'draft',
    scheduledDate: record.scheduled_date,
    hashtags: [],
    trendId: record.trend || undefined,
    _raw: record,
  }
}

export function mapIdea(record: any) {
  return {
    id: record.id,
    source: record.source || 'Blog',
    title: record.title,
    snippet: record.description || '',
    thumbnail: `https://img.usecurling.com/p/300/200?q=${encodeURIComponent(record.title)}`,
    likesCount: 0,
    category: record.expand?.category?.name || '',
    brandId: record.brand,
    _raw: record,
  }
}
