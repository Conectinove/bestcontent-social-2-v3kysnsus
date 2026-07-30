import pb from '@/lib/pocketbase/client'

export interface ABTest {
  id: string
  user: string
  brand?: string
  post_a: string
  post_b: string
  status: 'running' | 'completed' | 'draft'
  goal: 'clicks' | 'conversions'
  start_date: string
  end_date: string
  winner?: string
  created: string
  updated: string
  expand?: {
    post_a?: any
    post_b?: any
    brand?: any
    winner?: any
  }
}

export const getABTests = (userId: string) =>
  pb.collection('ab_tests').getFullList({
    filter: `user = "${userId}"`,
    sort: '-created',
    expand: 'post_a,post_b,brand,winner',
  }) as Promise<ABTest[]>

export const createABTest = (data: Record<string, unknown>) =>
  pb.collection('ab_tests').create(data)

export const updateABTest = (id: string, data: Record<string, unknown>) =>
  pb.collection('ab_tests').update(id, data)

export const deleteABTest = (id: string) => pb.collection('ab_tests').delete(id)
