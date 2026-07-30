import pb from '@/lib/pocketbase/client'

export const getCategories = () => pb.collection('categories').getFullList({ sort: 'name' })

export const getCategory = (id: string) => pb.collection('categories').getOne(id)

export const getCategoryBySlug = (slug: string) =>
  pb.collection('categories').getFirstListItem(`slug = "${slug}"`)

export const createCategory = (data: { name: string; slug: string }) =>
  pb.collection('categories').create(data)

export const deleteCategory = (id: string) => pb.collection('categories').delete(id)
