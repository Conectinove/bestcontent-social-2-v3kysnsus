export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'twitter'
  | 'linkedin'
  | 'facebook'

export interface Brand {
  id: string
  name: string
  logo: string
  coverImage: string
  description: string
  handles: {
    instagram?: string
    tiktok?: string
    youtube?: string
    twitter?: string
    linkedin?: string
    facebook?: string
    website?: string
  }
  stats: {
    postsThisWeek: number
    engagementRate: string
    followers: string
  }
  color_theme?: string
  _raw?: any
}

export interface Post {
  id: string
  brandId: string
  platform: SocialPlatform
  contentType: 'post' | 'story' | 'reel' | 'carousel' | 'tweet'
  content: string
  caption: string
  mediaUrls: string[]
  status: 'draft' | 'scheduled' | 'published'
  scheduledDate?: string
  publishedDate?: string
  engagement?: {
    likes: number
    comments: number
    shares: number
  }
  hashtags: string[]
  trendId?: string
  templateId?: string
  _raw?: any
}

export interface IdeaCard {
  id: string
  source: 'Twitter' | 'Instagram' | 'Blog' | 'Notícias' | 'TikTok'
  title: string
  snippet: string
  thumbnail: string
  likesCount: number
  isLiked?: boolean
  isSaved?: boolean
  category: string
  brandId?: string
  originalUrl?: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'post' | 'system' | 'ai'
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  plan: string
}

export interface CategoryRecord {
  id: string
  name: string
  slug: string
  created: string
  updated: string
}

export interface TrendRecord {
  id: string
  title: string
  description: string
  source_url: string
  image_url: string
  category: string
  popularity_score: number
  user: string | null
  created: string
  updated: string
  expand?: {
    category?: CategoryRecord
  }
}

export interface SavedPostRecord {
  id: string
  trend: string
  user: string
  saved_at: string
  created: string
  updated: string
  expand?: {
    trend?: TrendRecord
  }
}

export interface SocialAccountRecord {
  id: string
  user: string
  brand?: string
  platform: 'Instagram' | 'Facebook'
  external_handle: string
  status: 'connected' | 'disconnected'
  created: string
  updated: string
}

export interface SocialMetricRecord {
  id: string
  user: string
  brand?: string
  platform: 'Instagram' | 'Facebook'
  date: string
  followers_count: number
  engagement_rate: number
  posts_count: number
  created: string
  updated: string
}

export interface PostTemplateRecord {
  id: string
  user: string
  brand?: string
  name: string
  type: 'feed' | 'story'
  layout_data: Record<string, unknown>
  style_settings: Record<string, unknown>
  is_favorite: boolean
  is_shared: boolean
  created: string
  updated: string
}
