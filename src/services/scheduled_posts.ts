import pb from '@/lib/pocketbase/client'

export const getScheduledPosts = (userId: string) =>
  pb
    .collection('scheduled_posts')
    .getFullList({ filter: `user = "${userId}"`, sort: 'scheduled_at', expand: 'post,post.brand' })

export const createScheduledPost = (data: Record<string, unknown>) =>
  pb.collection('scheduled_posts').create(data)

export const updateScheduledPost = (id: string, data: Record<string, unknown>) =>
  pb.collection('scheduled_posts').update(id, data)

export const deleteScheduledPost = (id: string) => pb.collection('scheduled_posts').delete(id)
