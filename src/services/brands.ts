import pb from '@/lib/pocketbase/client'

export const getBrands = (userId: string) =>
  pb.collection('brands').getFullList({ filter: `user = "${userId}"`, sort: '-created' })

export const getBrand = (id: string) => pb.collection('brands').getOne(id)

export const createBrand = (data: Record<string, unknown>) => pb.collection('brands').create(data)

export const updateBrand = (id: string, data: Record<string, unknown>) =>
  pb.collection('brands').update(id, data)

export const deleteBrand = (id: string) => pb.collection('brands').delete(id)

export interface MergeBrandsResult {
  primaryBrandId: string
  reassignedPosts: number
  reassignedIdeas: number
  reassignedMaterials: number
  deletedBrandsCount: number
}

/**
 * Mescla múltiplas marcas duplicadas em uma marca principal.
 * Reatribui posts, ideias e brand materials antes de remover as marcas secundárias.
 */
export async function mergeDuplicateBrands(
  primaryBrandId: string,
  duplicateBrandIds: string[],
): Promise<MergeBrandsResult> {
  const toDelete = duplicateBrandIds.filter((id) => id && id !== primaryBrandId)
  if (toDelete.length === 0) {
    return {
      primaryBrandId,
      reassignedPosts: 0,
      reassignedIdeas: 0,
      reassignedMaterials: 0,
      deletedBrandsCount: 0,
    }
  }

  let reassignedPosts = 0
  let reassignedIdeas = 0
  let reassignedMaterials = 0

  for (const dupId of toDelete) {
    // 1. Reatribuir posts
    try {
      const posts = await pb.collection('posts').getFullList({
        filter: `brand = "${dupId}"`,
        requestKey: null,
      })
      for (const p of posts) {
        try {
          await pb.collection('posts').update(p.id, { brand: primaryBrandId })
          reassignedPosts++
        } catch (err) {
          console.warn('Erro ao reatribuir post durante merge:', err)
        }
      }
    } catch {
      /* intentionally ignored */
    }

    // 2. Reatribuir ideias
    try {
      const ideas = await pb.collection('ideas').getFullList({
        filter: `brand = "${dupId}"`,
        requestKey: null,
      })
      for (const idea of ideas) {
        try {
          await pb.collection('ideas').update(idea.id, { brand: primaryBrandId })
          reassignedIdeas++
        } catch (err) {
          console.warn('Erro ao reatribuir ideia durante merge:', err)
        }
      }
    } catch {
      /* intentionally ignored */
    }

    // 3. Reatribuir brand_kit_materials
    try {
      const mats = await pb.collection('brand_kit_materials').getFullList({
        filter: `brand = "${dupId}"`,
        requestKey: null,
      })
      for (const mat of mats) {
        try {
          await pb.collection('brand_kit_materials').update(mat.id, { brand: primaryBrandId })
          reassignedMaterials++
        } catch (err) {
          console.warn('Erro ao reatribuir material de marca durante merge:', err)
        }
      }
    } catch {
      /* intentionally ignored */
    }

    // 4. Reatribuir post_templates
    try {
      const tpls = await pb.collection('post_templates').getFullList({
        filter: `brand = "${dupId}"`,
        requestKey: null,
      })
      for (const tpl of tpls) {
        try {
          await pb.collection('post_templates').update(tpl.id, { brand: primaryBrandId })
        } catch {
          /* intentionally ignored */
        }
      }
    } catch {
      /* intentionally ignored */
    }

    // 5. Excluir a marca duplicada com segurança
    try {
      await pb.collection('brands').delete(dupId)
    } catch (err) {
      console.warn(`Erro ao excluir marca ${dupId}:`, err)
    }
  }

  return {
    primaryBrandId,
    reassignedPosts,
    reassignedIdeas,
    reassignedMaterials,
    deletedBrandsCount: toDelete.length,
  }
}
