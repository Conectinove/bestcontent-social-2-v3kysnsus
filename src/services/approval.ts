import pb from '@/lib/pocketbase/client'
import { updatePost } from '@/services/posts'

export async function approvePost(postId: string, userId: string) {
  await updatePost(postId, { status: 'approved' })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setUTCHours(10, 0, 0, 0)

  try {
    const existing = await pb.collection('scheduled_posts').getFirstListItem(`post = "${postId}"`)
    if (existing) return
  } catch {
    /* no existing scheduled post — proceed to create */
  }

  await pb.collection('scheduled_posts').create({
    user: userId,
    post: postId,
    scheduled_at: tomorrow.toISOString(),
    status: 'pending',
  })
}
