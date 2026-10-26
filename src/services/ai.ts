import pb from '@/lib/pocketbase/client'

export interface CaptionVariation {
  title: string
  text: string
  cta?: string
}

export interface GenerateCaptionOptions {
  content: string
  platform?: string
  objective?: string
  approach?: string
  brandName?: string
  brandVoice?: string
  tone?: string
  formatName?: string
  headline?: string
  variations?: boolean
}

export const generateCaption = (
  contentOrOptions: string | GenerateCaptionOptions,
  legacyPlatform?: string,
) => {
  const payload =
    typeof contentOrOptions === 'string'
      ? { content: contentOrOptions, platform: legacyPlatform || 'Instagram' }
      : contentOrOptions

  return pb.send('/backend/v1/ai/caption', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

export interface GenerateHashtagsOptions {
  content: string
  platform?: string
  objective?: string
  category?: string
}

export interface NetworkHashtagConfig {
  id: string
  name: string
  range: string
  styleDescription: string
  suggestedCount: number
}

export const NETWORK_HASHTAG_SPECS: Record<string, NetworkHashtagConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    range: '8–12 tags',
    styleDescription: 'Nicho + termos locais/comunidade para alcance orgânico',
    suggestedCount: 10,
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    range: '4–6 tags',
    styleDescription: 'Trends virais, desafios e termos de busca rápida',
    suggestedCount: 5,
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    range: '3–5 tags',
    styleDescription: 'Foco profissional, B2B, liderança e carreira',
    suggestedCount: 4,
  },
  twitter: {
    id: 'twitter',
    name: 'X / Twitter',
    range: '2–4 tags',
    styleDescription: 'Concisas e oportunas para economizar caracteres',
    suggestedCount: 3,
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    range: '3–5 tags',
    styleDescription: 'Palavras-chave de busca (SEO) e termos de retenção',
    suggestedCount: 4,
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    range: '2–4 tags',
    styleDescription: 'Amplas, comunitárias e focadas em grupos',
    suggestedCount: 3,
  },
}

export const generateHashtags = async (
  contentOrOptions: string | GenerateHashtagsOptions,
  legacyPlatform?: string,
): Promise<{ hashtags: string[]; platform?: string; count?: number }> => {
  const payload =
    typeof contentOrOptions === 'string'
      ? { content: contentOrOptions, platform: legacyPlatform }
      : contentOrOptions

  try {
    const res = await pb.send('/backend/v1/ai/hashtags', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })
    return res || { hashtags: [] }
  } catch (err: any) {
    // Fallback inteligente caso offline respeitando a rede
    const plat = (payload.platform || 'Instagram').toLowerCase()
    const words = (payload.content || '')
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u00FF]/gi, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 4)

    let tags = words.map((w: string) => `#${w}`)
    if (plat.includes('tik')) {
      tags = [...tags.slice(0, 3), '#fyp', '#viral', '#foryou']
      return { hashtags: Array.from(new Set(tags)).slice(0, 5), platform: 'tiktok' }
    }
    if (plat.includes('link')) {
      tags = [...tags.slice(0, 3), '#carreira', '#negocios', '#gestao']
      return { hashtags: Array.from(new Set(tags)).slice(0, 4), platform: 'linkedin' }
    }
    if (plat.includes('you')) {
      tags = [...tags.slice(0, 3), '#shorts', '#tutorial', '#dicas']
      return { hashtags: Array.from(new Set(tags)).slice(0, 4), platform: 'youtube' }
    }
    if (plat.includes('twit') || plat === 'x') {
      tags = [...tags.slice(0, 2), '#novidades', '#tech']
      return { hashtags: Array.from(new Set(tags)).slice(0, 3), platform: 'twitter' }
    }
    if (plat.includes('face')) {
      tags = [...tags.slice(0, 2), '#comunidade', '#compartilhe']
      return { hashtags: Array.from(new Set(tags)).slice(0, 3), platform: 'facebook' }
    }

    tags = [...tags, '#marketingdigital', '#conteudo', '#estrategia', '#brasil']
    return { hashtags: Array.from(new Set(tags)).slice(0, 10), platform: 'instagram' }
  }
}

export const improveText = (content: string) =>
  pb.send('/backend/v1/ai/improve', {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: { 'Content-Type': 'application/json' },
  })

export const generateVideoScript = (data: {
  prompt: string
  duration: number
  brandName?: string
  objective?: string
}) =>
  pb.send('/backend/v1/ai/script', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
