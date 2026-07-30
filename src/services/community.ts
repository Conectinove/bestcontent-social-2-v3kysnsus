import pb from '@/lib/pocketbase/client'
import { CommunityCategory, CommunityTopic, CommunityReply } from '@/types/community'

export async function getCommunityCategories(): Promise<CommunityCategory[]> {
  try {
    return await pb.collection('community_categories').getFullList<CommunityCategory>({
      sort: 'name',
    })
  } catch {
    return []
  }
}

export async function getCommunityTopics(
  filter?: string,
  sort = '-created',
): Promise<CommunityTopic[]> {
  try {
    const records = await pb.collection('community_topics').getFullList<CommunityTopic>({
      filter,
      sort,
      expand: 'user,category',
    })

    // Enrich with replies count
    const topicsWithReplies = await Promise.all(
      records.map(async (topic) => {
        try {
          const replies = await pb.collection('community_replies').getList(1, 1, {
            filter: `topic = "${topic.id}"`,
          })
          return { ...topic, replies_count: replies.totalItems }
        } catch {
          return { ...topic, replies_count: 0 }
        }
      }),
    )

    return topicsWithReplies
  } catch {
    return []
  }
}

export async function getCommunityTopic(id: string): Promise<CommunityTopic | null> {
  try {
    const topic = await pb.collection('community_topics').getOne<CommunityTopic>(id, {
      expand: 'user,category',
    })
    const replies = await pb.collection('community_replies').getList(1, 1, {
      filter: `topic = "${topic.id}"`,
    })
    return { ...topic, replies_count: replies.totalItems }
  } catch {
    return null
  }
}

export async function createCommunityTopic(data: {
  title: string
  content: string
  category: string
  tags?: string[]
  is_pinned?: boolean
}): Promise<CommunityTopic> {
  const currentUserId = pb.authStore.record?.id
  if (!currentUserId) throw new Error('Usuário não autenticado')

  return await pb.collection('community_topics').create<CommunityTopic>({
    user: currentUserId,
    category: data.category,
    title: data.title,
    content: data.content,
    tags: data.tags || [],
    views_count: 1,
    likes_count: 0,
    is_pinned: !!data.is_pinned,
  })
}

export async function incrementTopicViews(id: string, currentViews: number): Promise<void> {
  try {
    await pb.collection('community_topics').update(id, {
      views_count: (currentViews || 0) + 1,
    })
  } catch {
    // ignore non-critical metric errors
  }
}

export async function likeTopic(id: string, currentLikes: number): Promise<number> {
  const newLikes = currentLikes + 1
  try {
    await pb.collection('community_topics').update(id, {
      likes_count: newLikes,
    })
    return newLikes
  } catch {
    return currentLikes
  }
}

export async function getTopicReplies(topicId: string): Promise<CommunityReply[]> {
  try {
    return await pb.collection('community_replies').getFullList<CommunityReply>({
      filter: `topic = "${topicId}"`,
      sort: 'created',
      expand: 'user',
    })
  } catch {
    return []
  }
}

export async function createReply(topicId: string, content: string): Promise<CommunityReply> {
  const currentUserId = pb.authStore.record?.id
  if (!currentUserId) throw new Error('Usuário não autenticado')

  return await pb.collection('community_replies').create<CommunityReply>({
    user: currentUserId,
    topic: topicId,
    content,
  })
}

export async function searchCommunityTopics(query: string): Promise<CommunityTopic[]> {
  try {
    const res = await pb.send('/backend/v1/community/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
    const items = res.items || []
    return items.map((item: any) => ({
      ...item,
      expand: item.expand || {},
      replies_count: item.replies_count || 0,
    }))
  } catch {
    // Fallback to title search if backend vector service fails
    return await getCommunityTopics(`title ~ "${query}" || content ~ "${query}"`)
  }
}
