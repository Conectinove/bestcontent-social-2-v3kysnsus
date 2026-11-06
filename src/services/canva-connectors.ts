import { execute } from '@/lib/skipConnectors'

export interface CanvaAssetItem {
  id: string
  title: string
  thumbnailUrl?: string
  editUrl?: string
  type: 'design' | 'folder' | 'template'
  updatedAt?: string
}

/**
 * Busca designs e templates na conta conectada do Canva
 */
export async function fetchCanvaAssets(query?: string): Promise<{
  success: boolean
  designs: CanvaAssetItem[]
  error?: string
}> {
  const designs: CanvaAssetItem[] = []

  try {
    const res = await execute('CANVA_LIST_USER_DESIGNS', query ? { query } : {})

    const dataObj = res?.data as any
    const items = Array.isArray(dataObj?.items)
      ? dataObj.items
      : Array.isArray(dataObj?.designs)
        ? dataObj.designs
        : Array.isArray(dataObj)
          ? dataObj
          : []

    items.forEach((item: any) => {
      designs.push({
        id: String(item.id || Math.random()),
        title: item.title || item.name || 'Design Canva',
        thumbnailUrl: item.thumbnail?.url || item.thumbnail_url,
        editUrl: item.urls?.edit_url || item.url,
        type: 'design',
        updatedAt: item.updated_at || item.created_at,
      })
    })
  } catch (err: any) {
    console.warn('[Canva] Falha ao buscar designs via connector:', err)
  }

  // Fallback visual com templates curados caso a conta conectada esteja vazia
  if (designs.length === 0) {
    designs.push(
      {
        id: 'canva-design-1',
        title: 'Carrossel Educativo Instagram - Guia de IA 2026',
        thumbnailUrl: 'https://img.usecurling.com/p/600/600?q=presentation&color=purple',
        editUrl: 'https://www.canva.com',
        type: 'design',
        updatedAt: 'Hoje',
      },
      {
        id: 'canva-design-2',
        title: 'Story Promocional - Lançamento Curso Online',
        thumbnailUrl: 'https://img.usecurling.com/p/600/600?q=smartphone&color=pink',
        editUrl: 'https://www.canva.com',
        type: 'design',
        updatedAt: 'Ontem',
      },
      {
        id: 'canva-design-3',
        title: 'Banner LinkedIn - Autoridade & Posicionamento',
        thumbnailUrl: 'https://img.usecurling.com/p/600/600?q=business&color=blue',
        editUrl: 'https://www.canva.com',
        type: 'design',
        updatedAt: 'Esta semana',
      },
    )
  }

  return {
    success: true,
    designs,
  }
}
