import pb from '@/lib/pocketbase/client'

export const getScheduledPosts = (userId: string) =>
  pb
    .collection('scheduled_posts')
    .getFullList({ filter: `user = "${userId}"`, sort: 'scheduled_at', expand: 'post,post.brand' })

function sanitizeScheduledPayload(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = { ...data }
  const relationKeys = ['post', 'brand', 'user']
  for (const k of relationKeys) {
    if (k in cleaned) {
      const v = cleaned[k]
      if (
        v === null ||
        v === undefined ||
        v === '' ||
        v === 'all' ||
        v === 'undefined' ||
        v === 'null'
      ) {
        delete cleaned[k]
      }
    }
  }
  return cleaned
}

export const createScheduledPost = (data: Record<string, unknown>) =>
  pb.collection('scheduled_posts').create(sanitizeScheduledPayload(data))

export const updateScheduledPost = (id: string, data: Record<string, unknown>) =>
  pb.collection('scheduled_posts').update(id, sanitizeScheduledPayload(data))

export const deleteScheduledPost = (id: string) => pb.collection('scheduled_posts').delete(id)
