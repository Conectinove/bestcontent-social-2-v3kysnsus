export interface Mission {
  id: string
  title: string
  description: string
  xpReward: number
  current: number
  target: number
  type: 'weekly' | 'monthly'
  link: string
  completed: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  date?: string
}

export interface RankingUser {
  position: number
  name: string
  avatar: string
  xp: number
  level: string
}

export interface InspirationCard {
  id: string
  title: string
  description: string
  status: 'Tendência' | 'Oportunidade'
  category: string
  imageUrl: string
  platform: string
  trendScore: number
}

export interface UpcomingDate {
  id: string
  date: string
  title: string
  description: string
  daysUntil: number
  emoji: string
}

export interface CarouselItem {
  id: string
  title: string
  imageUrl: string
  category: string
}
