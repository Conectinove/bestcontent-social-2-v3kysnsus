import pb from '@/lib/pocketbase/client'
import { generateCaption, generateHashtags } from '@/services/ai'

export const getPosts = (userId: string, sort = '-created') =>
  pb.collection('posts').getFullList({ filter: `user = "${userId}"`, sort, expand: 'brand' })

export const getPost = (id: string) => pb.collection('posts').getOne(id, { expand: 'brand' })

export const createPost = (data: Record<string, unknown>) => pb.collection('posts').create(data)

export const updatePost = (id: string, data: Record<string, unknown>) =>
  pb.collection('posts').update(id, data)

export const deletePost = (id: string) => pb.collection('posts').delete(id)

export async function createPostFromTrend(
  trendId: string,
  trendTitle: string,
  trendDescription: string,
  userId: string,
  brandId: string,
) {
  const sourceText = `${trendTitle}. ${trendDescription || ''}`.trim()

  const captionRes = (await generateCaption(sourceText, 'Instagram')) as { caption: string }
  const caption = captionRes.caption || ''

  let hashtags: string[] = []
  try {
    const hashtagRes = (await generateHashtags(caption || sourceText)) as { hashtags: string[] }
    hashtags = hashtagRes.hashtags || []
  } catch {
    /* ignore hashtag generation errors */
  }

  const fullCaption = hashtags.length > 0 ? `${caption}\n\n${hashtags.join(' ')}`.trim() : caption

  const record = await pb.collection('posts').create({
    user: userId,
    brand: brandId,
    content: trendDescription || trendTitle,
    caption: fullCaption,
    platform: 'Instagram',
    status: 'draft',
    trend: trendId,
  })

  return record
}
