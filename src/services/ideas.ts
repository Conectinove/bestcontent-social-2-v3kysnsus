import pb from '@/lib/pocketbase/client'

export const getIdeas = (userId: string) =>
  pb
    .collection('ideas')
    .getFullList({ filter: `user = "${userId}"`, sort: '-created', expand: 'brand,category' })

export const getIdeasByBrand = (brandId: string) =>
  pb.collection('ideas').getFullList({ filter: `brand = "${brandId}"`, sort: '-created' })

export const getIdea = (id: string) => pb.collection('ideas').getOne(id)

export const createIdea = (data: Record<string, unknown>) => pb.collection('ideas').create(data)

export const updateIdea = (id: string, data: Record<string, unknown>) =>
  pb.collection('ideas').update(id, data)

export const deleteIdea = (id: string) => pb.collection('ideas').delete(id)
