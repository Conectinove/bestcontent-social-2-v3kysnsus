import pb from '@/lib/pocketbase/client'

export const getIdeas = (userId?: string) => {
  const filter = userId ? `user = "${userId}"` : ''
  return pb
    .collection('ideas')
    .getFullList({
      filter: filter || undefined,
      sort: '-created',
      expand: 'brand,category',
    })
    .catch((err) => {
      console.warn('Erro ao buscar ideas:', err)
      return []
    })
}

export const getIdeasByBrand = (brandId: string) =>
  pb.collection('ideas').getFullList({ filter: `brand = "${brandId}"`, sort: '-created' })

export const getIdea = (id: string) => pb.collection('ideas').getOne(id)

export const createIdea = (data: Record<string, unknown>) => pb.collection('ideas').create(data)

export const updateIdea = (id: string, data: Record<string, unknown>) =>
  pb.collection('ideas').update(id, data)

export const deleteIdea = (id: string) => pb.collection('ideas').delete(id)

export const findSavedIdeaByTitle = async (title: string, userId?: string) => {
  try {
    const cleanTitle = title.replace(/['"]/g, '')
    const userFilter = userId ? ` && user = "${userId}"` : ''
    const records = await pb.collection('ideas').getList(1, 1, {
      filter: `title ~ "${cleanTitle}"${userFilter}`,
    })
    return records.items[0] || null
  } catch {
    return null
  }
}
