import pb from '@/lib/pocketbase/client'

export const getTrends = (sort = '-created') =>
  pb.collection('trends').getFullList({ sort, expand: 'category' })

export const getTrend = (id: string) => pb.collection('trends').getOne(id, { expand: 'category' })

export const createTrend = (data: Record<string, unknown>) => pb.collection('trends').create(data)

export const updateTrend = (id: string, data: Record<string, unknown>) =>
  pb.collection('trends').update(id, data)

export const deleteTrend = (id: string) => pb.collection('trends').delete(id)
