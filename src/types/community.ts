export interface CommunityCategory {
  id: string
  name: string
  slug: string
  color?: string
  created: string
  updated: string
}

export interface CommunityUser {
  id: string
  name: string
  avatar?: string
  email?: string
}

export interface CommunityTopic {
  id: string
  user: string
  category: string
  title: string
  content: string
  tags?: string[]
  views_count: number
  likes_count: number
  is_pinned: boolean
  is_active?: boolean
  image_url?: string
  created: string
  updated: string
  expand?: {
    user?: CommunityUser
    category?: CommunityCategory
  }
  replies_count?: number
}

export interface CommunityReply {
  id: string
  user: string
  topic: string
  content: string
  image_url?: string
  created: string
  updated: string
  expand?: {
    user?: CommunityUser
  }
}

export interface TopContributor {
  rank: number
  id: string
  name: string
  avatar: string
  badgeTitle: string
  xp: number
  roleBadge?: 'ADMIN' | 'PRO' | 'MAX' | 'BASIC'
}
