import pb from '@/lib/pocketbase/client'

export interface PremiumElement {
  id: string
  name: string
  type: 'icon' | 'texture' | 'shape'
  data: string
  category: string
  created: string
  updated: string
}

export const getPremiumElements = (type?: string) => {
  let filter = ''
  if (type && type !== 'all') {
    filter = `type = "${type}"`
  }
  return pb.collection('premium_elements').getFullList({
    filter: filter || undefined,
    sort: 'type,name',
  }) as Promise<PremiumElement[]>
}
