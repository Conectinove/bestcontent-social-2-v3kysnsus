import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getBrands,
  createBrand as svcCreateBrand,
  deleteBrand as svcDeleteBrand,
} from '@/services/brands'
import {
  getPosts,
  createPost as svcCreatePost,
  deletePost as svcDeletePost,
} from '@/services/posts'
import { getIdeas } from '@/services/ideas'
import { useRealtime } from '@/hooks/use-realtime'
import { mapBrand, mapPost, mapIdea } from '@/lib/mappers'
import type { Brand, Post, IdeaCard, NotificationItem } from '@/types'

const SocialContext = createContext<any>(undefined)

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [brands, setBrands] = useState<Brand[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [ideas, setIdeas] = useState<IdeaCard[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Bem-vindo!',
      message: 'Comece criando sua primeira marca.',
      time: 'agora',
      read: false,
      type: 'system',
    },
  ])

  const loadAll = useCallback(async () => {
    if (!user?.id) return
    const [b, p, i] = await Promise.allSettled([
      getBrands(user.id),
      getPosts(user.id),
      getIdeas(user.id),
    ])
    if (b.status === 'fulfilled') {
      const mapped = b.value.map((r: any) => mapBrand(r))
      setBrands(mapped)
      setSelectedBrandId((prev) => {
        if (prev && prev !== 'all' && mapped.some((m: Brand) => m.id === prev)) {
          return prev
        }
        return mapped[0]?.id || 'all'
      })
    }
    if (p.status === 'fulfilled') setPosts(p.value.map((r: any) => mapPost(r)))
    if (i.status === 'fulfilled') setIdeas(i.value.map((r: any) => mapIdea(r)))
  }, [user?.id])

  useEffect(() => {
    loadAll()
  }, [loadAll])
  useRealtime('brands', () => loadAll(), !!user?.id)
  useRealtime('posts', () => loadAll(), !!user?.id)
  useRealtime('ideas', () => loadAll(), !!user?.id)

  const addBrand = async (data: any) => {
    if (!user?.id) return
    const fd = new FormData()
    fd.append('user', user.id)
    fd.append('name', data.name || '')
    fd.append('description', data.description || '')
    if (data.instagram) fd.append('instagram', data.instagram)
    if (data.tiktok) fd.append('tiktok', data.tiktok)
    if (data.youtube) fd.append('youtube', data.youtube)
    if (data.facebook) fd.append('facebook', data.facebook)
    if (data.website) fd.append('website', data.website)
    if (data.color_theme) fd.append('color_theme', data.color_theme)
    if (data.logo instanceof File) fd.append('logo', data.logo)
    await svcCreateBrand(fd as any)
    loadAll()
  }

  const addPost = async (data: any) => {
    if (!user?.id) return null
    const fd = new FormData()
    fd.append('user', user.id)
    fd.append('brand', data.brandId)
    fd.append('content', data.content || data.caption || '')
    fd.append('caption', data.caption || '')
    fd.append('platform', data.platform)
    fd.append('status', data.status)
    if (data.scheduledDate) fd.append('scheduled_date', data.scheduledDate)
    if (data.media instanceof File) fd.append('media', data.media)
    const record = await svcCreatePost(fd as any)
    loadAll()
    return record
  }

  const deletePost = async (id: string) => {
    await svcDeletePost(id)
    loadAll()
  }
  const duplicatePost = async (id: string) => {
    if (!user?.id) return null
    const original = posts.find((p: Post) => p.id === id)
    const raw = original?._raw
    const copyData: Record<string, unknown> = {
      user: user.id,
      brand: raw?.brand || original?.brandId || '',
      content: `${raw?.content || original?.content || 'Novo post'} (Cópia)`.trim(),
      caption: raw?.caption || original?.caption || '',
      platform: raw?.platform || original?.platform || 'Instagram',
      status: 'draft',
      template_id: raw?.template_id || '',
      duration: raw?.duration || 0,
      script_json: raw?.script_json || '',
    }
    const created = await svcCreatePost(copyData)
    loadAll()
    return created
  }
  const updatePostStatus = async (
    id: string,
    status: 'draft' | 'scheduled' | 'published' | 'approved',
  ) => {
    const { updatePost: svcUpdatePost } = await import('@/services/posts')
    await svcUpdatePost(id, { status })
    loadAll()
  }
  const deleteBrand = async (id: string) => {
    await svcDeleteBrand(id)
    loadAll()
  }
  const toggleTheme = () => setTheme((p) => (p === 'dark' ? 'light' : 'dark'))
  const markAllNotificationsRead = () =>
    setNotifications((p) => p.map((n) => ({ ...n, read: true })))

  return (
    <SocialContext.Provider
      value={{
        brands,
        posts,
        ideas,
        selectedBrandId,
        setSelectedBrandId,
        searchQuery,
        setSearchQuery,
        notifications,
        markAllNotificationsRead,
        theme,
        toggleTheme,
        addBrand,
        addPost,
        deletePost,
        duplicatePost,
        updatePostStatus,
        deleteBrand,
        refreshAll: loadAll,
        fetchBrands: loadAll,
        refreshPosts: loadAll,
      }}
    >
      {children}
    </SocialContext.Provider>
  )
}

export function useSocial() {
  const ctx = useContext(SocialContext)
  if (!ctx) throw new Error('useSocial must be used within SocialProvider')
  return ctx
}
