import { pb } from '@/lib/pocketbase/client'

export interface ExternalStockAsset {
  id: string
  title: string
  url: string
  thumbUrl: string
  source: 'unsplash' | 'pexels' | 'direct' | 'curated'
  author?: string
  authorUrl?: string
  width?: number
  height?: number
  category?: string
  tags?: string[]
}

// Catálogo rico e curado de imagens stock gratuitas em alta resolução sem exigir API Key
export const CURATED_STOCK_ASSETS: ExternalStockAsset[] = [
  {
    id: 'stock-prod-1',
    title: 'Produto em Studio Minimalista',
    url: 'https://img.usecurling.com/p/1200/800?q=cosmetic+product+minimalist+bottle&color=white',
    thumbUrl:
      'https://img.usecurling.com/p/400/300?q=cosmetic+product+minimalist+bottle&color=white',
    source: 'unsplash',
    author: 'Studio Minimal',
    category: 'produto',
    tags: ['produto', 'cosmético', 'embalagem', 'minimalista', 'packshot'],
  },
  {
    id: 'stock-prod-2',
    title: 'Frasco de Perfume de Luxo & Iluminação Dourada',
    url: 'https://img.usecurling.com/p/1200/800?q=luxury+perfume+bottle+gold+lighting&color=yellow',
    thumbUrl:
      'https://img.usecurling.com/p/400/300?q=luxury+perfume+bottle+gold+lighting&color=yellow',
    source: 'unsplash',
    author: 'Luxury Shots',
    category: 'produto',
    tags: ['luxo', 'perfume', 'dourado', 'elegante', 'comercial'],
  },
  {
    id: 'stock-person-1',
    title: 'Criador de Conteúdo Gravando no Estúdio',
    url: 'https://img.usecurling.com/p/1200/800?q=content+creator+studio+recording+camera&color=purple',
    thumbUrl:
      'https://img.usecurling.com/p/400/300?q=content+creator+studio+recording+camera&color=purple',
    source: 'pexels',
    author: 'Creator Hub',
    category: 'personagem',
    tags: ['criador', 'ugc', 'estúdio', 'gravação', 'influencer'],
  },
  {
    id: 'stock-person-2',
    title: 'Profissional com Smartphone em Coworking',
    url: 'https://img.usecurling.com/p/1200/800?q=young+entrepreneur+coworking+office&color=blue',
    thumbUrl:
      'https://img.usecurling.com/p/400/300?q=young+entrepreneur+coworking+office&color=blue',
    source: 'unsplash',
    author: 'Urban Work',
    category: 'personagem',
    tags: ['negócios', 'empreendedor', 'trabalho', 'celular', 'agência'],
  },
  {
    id: 'stock-scene-1',
    title: 'Cenário Cyberpunk Neon Noturno',
    url: 'https://img.usecurling.com/p/1200/800?q=cyberpunk+city+neon+street+night&color=purple',
    thumbUrl:
      'https://img.usecurling.com/p/400/300?q=cyberpunk+city+neon+street+night&color=purple',
    source: 'unsplash',
    author: 'Future Visions',
    category: 'cenario',
    tags: ['cyberpunk', 'neon', 'noite', 'futurista', 'sci-fi'],
  },
  {
    id: 'stock-scene-2',
    title: 'Escritório Moderno de Agência Digital',
    url: 'https://img.usecurling.com/p/1200/800?q=modern+creative+agency+office+meeting&color=gray',
    thumbUrl:
      'https://img.usecurling.com/p/400/300?q=modern+creative+agency+office+meeting&color=gray',
    source: 'pexels',
    author: 'Agency Life',
    category: 'cenario',
    tags: ['escritório', 'agência', 'reunião', 'design', 'estratégia'],
  },
  {
    id: 'stock-scene-3',
    title: 'Paisagem Cinematográfica Pôr do Sol',
    url: 'https://img.usecurling.com/p/1200/800?q=cinematic+mountain+sunset+golden+hour&color=orange',
    thumbUrl:
      'https://img.usecurling.com/p/400/300?q=cinematic+mountain+sunset+golden+hour&color=orange',
    source: 'unsplash',
    author: 'Nature Cinematics',
    category: 'cenario',
    tags: ['natureza', 'pôr do sol', 'dourado', 'cinematográfico', 'épico'],
  },
  {
    id: 'stock-brand-1',
    title: 'Mockup de Embalagem Kraft Sustentável',
    url: 'https://img.usecurling.com/p/1200/800?q=craft+packaging+branding+mockup&color=green',
    thumbUrl: 'https://img.usecurling.com/p/400/300?q=craft+packaging+branding+mockup&color=green',
    source: 'pexels',
    author: 'Brand Elements',
    category: 'logo',
    tags: ['branding', 'mockup', 'sustentável', 'logo', 'design'],
  },
  {
    id: 'stock-food-1',
    title: 'Café Especial & Iluminação Quente',
    url: 'https://img.usecurling.com/p/1200/800?q=specialty+coffee+cup+steam+warm+light&color=orange',
    thumbUrl:
      'https://img.usecurling.com/p/400/300?q=specialty+coffee+cup+steam+warm+light&color=orange',
    source: 'unsplash',
    author: 'Coffee Roast',
    category: 'produto',
    tags: ['café', 'gastronomia', 'manhã', 'aconchego', 'detalhes'],
  },
  {
    id: 'stock-tech-1',
    title: 'Setup Gamer & Telas Tecnológicas',
    url: 'https://img.usecurling.com/p/1200/800?q=modern+tech+gaming+setup+led&color=cyan',
    thumbUrl: 'https://img.usecurling.com/p/400/300?q=modern+tech+gaming+setup+led&color=cyan',
    source: 'pexels',
    author: 'Tech Lab',
    category: 'cenario',
    tags: ['tecnologia', 'setup', 'gamer', 'led', 'futuro'],
  },
]

/**
 * Busca assets stock gratuitos com filtro de texto e categoria
 */
export function searchStockAssets(query = '', category = 'todas'): ExternalStockAsset[] {
  const q = query.toLowerCase().trim()
  return CURATED_STOCK_ASSETS.filter((item) => {
    const matchCat = category === 'todas' || item.category === category
    if (!matchCat) return false
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
    )
  })
}

/**
 * Anexa asset externo (por URL ou stock) e persiste na Biblioteca (/app/library) como mídia externa
 */
export async function importExternalAssetToLibrary(params: {
  userId?: string
  brandId?: string
  title: string
  imageUrl: string
  source?: 'url' | 'stock' | 'unsplash' | 'pexels'
  category?: string
  tags?: string[]
}): Promise<{ libraryPostId?: string; assetUrl: string }> {
  const {
    userId,
    brandId,
    title,
    imageUrl,
    source = 'stock',
    category = 'Geral',
    tags = ['Asset Externo', 'Studio'],
  } = params

  let libraryPostId: string | undefined = undefined

  // Cria um post na coleção 'posts' com origin='external_asset' para aparecer na Biblioteca
  try {
    const postPayload = {
      user: userId || pb.authStore.record?.id || null,
      brand: brandId || null,
      title: `[Asset Externo] ${title}`,
      caption: `Asset visual externo importado para o AI Media Studio via ${source.toUpperCase()}.\nCategoria: ${category}`,
      content: `Asset visual externo importado para o AI Media Studio via ${source.toUpperCase()}.`,
      platform: 'Instagram',
      media_type: 'image',
      image_url: imageUrl,
      status: 'draft',
      origin: 'external_asset',
      tags,
      studio_metadata: {
        origin: 'external_asset',
        source,
        externalUrl: imageUrl,
        importedAt: new Date().toISOString(),
      },
    }

    const createdPost = await pb.collection('posts').create(postPayload)
    libraryPostId = createdPost.id
  } catch (err) {
    console.warn('Aviso: falha ao salvar asset externo na coleção posts:', err)
  }

  // Tenta salvar também na coleção image_bank_assets se disponível
  try {
    await pb.collection('image_bank_assets').create({
      name: title,
      preview_url: imageUrl,
      category: category.toLowerCase().replace(/\s+/g, '_'),
      is_curated: false,
      user: userId || pb.authStore.record?.id || null,
      brand: brandId || null,
      tags,
    })
  } catch {
    /* ok */
  }

  return { libraryPostId, assetUrl: imageUrl }
}
