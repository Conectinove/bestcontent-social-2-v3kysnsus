import pb from '@/lib/pocketbase/client'

export const getSavedPosts = (userId: string) =>
  pb.collection('saved_posts').getFullList({ filter: `user = "${userId}"`, expand: 'trend' })

export const createSavedPost = (trendId: string, userId: string) =>
  pb.collection('saved_posts').create({ trend: trendId, user: userId })

export const deleteSavedPost = (id: string) => pb.collection('saved_posts').delete(id)

export const findSavedPost = (trendId: string, userId: string) =>
  pb.collection('saved_posts').getFirstListItem(`trend = "${trendId}" && user = "${userId}"`)
