import pb from '@/lib/pocketbase/client'

export const getPosts = (userId: string, sort = '-created') =>
  pb.collection('posts').getFullList({ filter: `user = "${userId}"`, sort, expand: 'brand' })

export const getPost = (id: string) => pb.collection('posts').getOne(id, { expand: 'brand' })

export const createPost = (data: Record<string, unknown>) => pb.collection('posts').create(data)

export const updatePost = (id: string, data: Record<string, unknown>) =>
  pb.collection('posts').update(id, data)

export const deletePost = (id: string) => pb.collection('posts').delete(id)
