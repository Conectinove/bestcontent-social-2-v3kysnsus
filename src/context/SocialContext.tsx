import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Brand, Post, IdeaCard, NotificationItem } from '@/types'
import {
  INITIAL_BRANDS,
  INITIAL_IDEAS,
  INITIAL_POSTS,
  INITIAL_NOTIFICATIONS,
} from '@/lib/mock-data'

interface SocialContextType {
  brands: Brand[]
  selectedBrandId: string | 'all'
  setSelectedBrandId: (id: string | 'all') => void
  posts: Post[]
  ideas: IdeaCard[]
  notifications: NotificationItem[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
  isOffline: boolean
  addBrand: (brand: Omit<Brand, 'id' | 'stats'>) => void
  addPost: (post: Omit<Post, 'id'>) => Post
  updatePost: (id: string, data: Partial<Post>) => void
  deletePost: (id: string) => void
  toggleSaveIdea: (id: string) => void
  toggleLikeIdea: (id: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
}

const SocialContext = createContext<SocialContextType | undefined>(undefined)

export function SocialProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>(() => {
    const local = localStorage.getItem('bc_brands')
    return local ? JSON.parse(local) : INITIAL_BRANDS
  })

  const [selectedBrandId, setSelectedBrandId] = useState<string | 'all'>('all')

  const [posts, setPosts] = useState<Post[]>(() => {
    const local = localStorage.getItem('bc_posts')
    return local ? JSON.parse(local) : INITIAL_POSTS
  })

  const [ideas, setIdeas] = useState<IdeaCard[]>(() => {
    const local = localStorage.getItem('bc_ideas')
    return local ? JSON.parse(local) : INITIAL_IDEAS
  })

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('bc_theme')
    return (saved as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    localStorage.setItem('bc_brands', JSON.stringify(brands))
  }, [brands])

  useEffect(() => {
    localStorage.setItem('bc_posts', JSON.stringify(posts))
  }, [posts])

  useEffect(() => {
    localStorage.setItem('bc_ideas', JSON.stringify(ideas))
  }, [ideas])

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('bc_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const addBrand = (newBrandData: Omit<Brand, 'id' | 'stats'>) => {
    const newBrand: Brand = {
      ...newBrandData,
      id: `brand-${Date.now()}`,
      stats: {
        postsThisWeek: 0,
        engagementRate: '0.0%',
        followers: '1',
      },
    }
    setBrands((prev) => [newBrand, ...prev])
  }

  const addPost = (postData: Omit<Post, 'id'>) => {
    const newPost: Post = {
      ...postData,
      id: `post-${Date.now()}`,
    }
    setPosts((prev) => [newPost, ...prev])
    return newPost
  }

  const updatePost = (id: string, data: Partial<Post>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  }

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const toggleSaveIdea = (id: string) => {
    setIdeas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSaved: !item.isSaved } : item)),
    )
  }

  const toggleLikeIdea = (id: string) => {
    setIdeas((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isLiked = !item.isLiked
          return {
            ...item,
            isLiked,
            likesCount: isLiked ? item.likesCount + 1 : item.likesCount - 1,
          }
        }
        return item
      }),
    )
  }

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <SocialContext.Provider
      value={{
        brands,
        selectedBrandId,
        setSelectedBrandId,
        posts,
        ideas,
        notifications,
        searchQuery,
        setSearchQuery,
        theme,
        toggleTheme,
        isOffline,
        addBrand,
        addPost,
        updatePost,
        deletePost,
        toggleSaveIdea,
        toggleLikeIdea,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </SocialContext.Provider>
  )
}

export function useSocial() {
  const context = useContext(SocialContext)
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider')
  }
  return context
}
