import pb from '@/lib/pocketbase/client'

export interface PostTemplate {
  id: string
  user: string
  brand: string
  name: string
  type: 'feed' | 'story'
  layout_data: Record<string, unknown>
  style_settings: Record<string, unknown>
  is_favorite: boolean
  is_shared: boolean
  created: string
  updated: string
}

export const getTemplates = (
  userId?: string,
  filter?: { type?: string; favoritesOnly?: boolean },
) => {
  const parts: string[] = []
  if (userId) {
    parts.push(`(user = "${userId}" || is_shared = true)`)
  }
  if (filter?.type) parts.push(`type = "${filter.type}"`)
  if (filter?.favoritesOnly) parts.push(`is_favorite = true`)
  const filterStr = parts.length ? parts.join(' && ') : undefined
  return pb.collection('post_templates').getFullList({
    filter: filterStr,
    sort: '-created',
  })
}

export const getTemplate = (id: string) => pb.collection('post_templates').getOne(id)

export const createTemplate = (data: Record<string, unknown>) =>
  pb.collection('post_templates').create(data)

export const updateTemplate = (id: string, data: Record<string, unknown>) =>
  pb.collection('post_templates').update(id, data)

export const toggleFavorite = async (id: string, current: boolean) => {
  await pb.collection('post_templates').update(id, { is_favorite: !current })
  return !current
}

export const deleteTemplate = (id: string) => pb.collection('post_templates').delete(id)
