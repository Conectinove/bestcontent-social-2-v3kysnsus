import pb from '@/lib/pocketbase/client'

export const getBrands = (userId: string) =>
  pb.collection('brands').getFullList({ filter: `user = "${userId}"`, sort: '-created' })

export const getBrand = (id: string) => pb.collection('brands').getOne(id)

export const createBrand = (data: Record<string, unknown>) => pb.collection('brands').create(data)

export const updateBrand = (id: string, data: Record<string, unknown>) =>
  pb.collection('brands').update(id, data)

export const deleteBrand = (id: string) => pb.collection('brands').delete(id)
