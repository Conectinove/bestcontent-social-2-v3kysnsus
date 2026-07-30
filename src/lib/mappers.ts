import type { Brand, Post, IdeaCard } from '@/types'

const PB_URL = import.meta.env.VITE_POCKETBASE_URL

export function getFileUrl(record: any, field: string): string {
  if (!record || !record[field]) return ''
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

export function mapBrand(record: any): Brand {
  const logo = getFileUrl(record, 'logo')
  return {
    id: record.id,
    name: record.name || '',
    logo: logo || `https://img.usecurling.com/i?q=brand&color=gradient`,
    coverImage: logo || `https://img.usecurling.com/p/600/200?q=brand%20banner`,
    description: record.description || '',
    handles: {
      instagram: record.instagram || '',
      tiktok: record.tiktok || '',
      youtube: record.youtube || '',
      facebook: record.facebook || '',
      website: record.website || record.website_url || '',
    },
    stats: {
      postsThisWeek: 0,
      engagementRate: '0%',
      followers: '0',
    },
    color_theme: record.color_theme || '#BF2A95',
    _raw: record,
  }
}

export function mapPost(record: any): Post {
  const mediaUrl = getFileUrl(record, 'media')
  return {
    id: record.id,
    brandId: record.brand || '',
    platform: (PLATFORM_FROM_DB[record.platform] ||
      (record.platform || 'instagram').toLowerCase()) as Post['platform'],
    contentType: 'post',
    content: record.content || '',
    caption: record.caption || '',
    mediaUrls: mediaUrl ? [mediaUrl] : [],
    status: record.status || 'draft',
    scheduledDate: record.scheduled_date || undefined,
    engagement: { likes: 0, comments: 0, shares: 0 },
    hashtags: [],
    trendId: record.trend || undefined,
    templateId: record.template_id || undefined,
    _raw: record,
  }
}

export function mapIdea(record: any): IdeaCard {
  return {
    id: record.id,
    source: (record.source as any) || 'Blog',
    title: record.title || '',
    snippet: record.description || '',
    thumbnail: `https://img.usecurling.com/p/300/200?q=${encodeURIComponent(record.title || 'idea')}`,
    likesCount: 0,
    category: record.expand?.category?.name || 'Geral',
    brandId: record.brand || undefined,
    _raw: record,
  }
}
