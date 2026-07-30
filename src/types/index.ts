export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin'

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
  }
  stats: {
    postsThisWeek: number
    engagementRate: string
    followers: string
  }
}

export interface Post {
  id: string
  brandId: string
  platform: SocialPlatform
  contentType: 'post' | 'story' | 'reel' | 'carousel' | 'tweet'
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
