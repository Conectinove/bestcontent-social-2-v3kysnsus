import pb from '@/lib/pocketbase/client'
import type { CampaignRecord } from '@/types'
export type { CampaignRecord } from '@/types'
import { generateMultiFormatContent, generateHashtags, generateCaption } from '@/services/ai'
import { suggestTemplates } from '@/services/post-templates'

export interface CampaignFormatOption {
  id: 'reels' | 'story' | 'feed' | 'carousel' | 'flyer'
  name: string
  label: string
  description: string
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook' | 'LinkedIn'
  aspectRatio: string
  credits: number
  badge: string
}

export const CAMPAIGN_FORMATS: CampaignFormatOption[] = [
  {
    id: 'reels',
    name: 'Reels / Vídeo Curto',
    label: 'Reels / TikTok',
    description: 'Roteiro de alta retenção com gancho de 3s, beats visuais e CTA dinâmico.',
    platform: 'Instagram',
    aspectRatio: '9:16',
    credits: 25,
    badge: 'Vídeo 9:16',
  },
  {
    id: 'story',
    name: 'Story Interativo',
    label: 'Story Vertical',
    description: 'Sequência envolvente com enquetes/perguntas e link de conversão direto.',
    platform: 'Instagram',
    aspectRatio: '9:16',
    credits: 15,
    badge: 'Story 9:16',
  },
  {
    id: 'feed',
    name: 'Post de Feed',
    label: 'Post Feed (1:1 / 4:5)',
    description: 'Arte principal com headline forte, copy contextual e hashtags calibradas.',
    platform: 'Instagram',
    aspectRatio: '4:5',
    credits: 15,
    badge: 'Feed 4:5',
  },
  {
    id: 'carousel',
    name: 'Carrossel Educativo',
    label: 'Carrossel (5 slides)',
    description: 'Passo a passo slide-a-slide com capa magnética, miolo didático e CTA final.',
    platform: 'Instagram',
    aspectRatio: '4:5',
    credits: 35,
    badge: 'Carrossel 5 slides',
  },
  {
    id: 'flyer',
    name: 'Flyer Promocional',
    label: 'Flyer / Banner',
    description: 'Layout vertical para oferta, evento ou anúncio com foco em vendas.',
    platform: 'Facebook',
    aspectRatio: '9:16',
    credits: 20,
    badge: 'Flyer Promo',
  },
]

export interface CreateCampaignInput {
  userId: string
  brandId?: string
  brandName?: string
  brandVoice?: string
  name: string
  objective: 'engajar' | 'vender' | 'awareness'
  briefing: string
  targetUrl?: string
  cta?: string
  selectedFormats: Array<'reels' | 'story' | 'feed' | 'carousel' | 'flyer'>
  onProgress?: (formatId: string, status: 'generating' | 'done' | 'error') => void
}

export interface GeneratedCampaignResult {
  campaign: CampaignRecord
  createdPosts: any[]
  totalCredits: number
}

export async function getCampaigns(userId?: string): Promise<CampaignRecord[]> {
  try {
    const filter = userId ? `user = "${userId}"` : undefined
    const records = await pb.collection('campaigns').getFullList<CampaignRecord>({
      filter,
      sort: '-created',
      expand: 'brand',
    })
    return records
  } catch (err) {
    console.warn('Falha ao listar campanhas:', err)
    return []
  }
}

export async function getCampaign(id: string): Promise<CampaignRecord> {
  return pb.collection('campaigns').getOne<CampaignRecord>(id, {
    expand: 'brand',
  })
}

export async function deleteCampaign(id: string): Promise<boolean> {
  await pb.collection('campaigns').delete(id)
  return true
}

export async function createMultiFormatCampaign(
  input: CreateCampaignInput,
): Promise<GeneratedCampaignResult> {
  const {
    userId,
    brandId,
    brandName = 'Sua Marca',
    brandVoice = 'Profissional e magnético',
    name,
    objective,
    briefing,
    targetUrl,
    cta,
    selectedFormats,
    onProgress,
  } = input

  // Calcular total de créditos
  const totalCredits = selectedFormats.reduce((acc, fId) => {
    const found = CAMPAIGN_FORMATS.find((f) => f.id === fId)
    return acc + (found ? found.credits : 15)
  }, 0)

  // 1. Criar registro da campanha
  const campaignRecord = await pb.collection('campaigns').create({
    user: userId,
    brand: brandId || null,
    name,
    objective,
    brand_voice: brandVoice,
    briefing,
    target_url: targetUrl || '',
    cta: cta || '',
    formats: selectedFormats,
    status: 'active',
    total_credits: totalCredits,
  })

  // 2. Buscar templates recomendados para o objetivo/marca
  let suggestedTpls: any[] = []
  try {
    suggestedTpls = await suggestTemplates({
      brandName,
      brandVoice,
      objective: objective === 'awareness' ? 'authority' : objective,
    })
  } catch (_) {
    suggestedTpls = []
  }

  const createdPosts: any[] = []

  // 3. Gerar cada formato sequencialmente para controle fino de progresso
  for (const formatId of selectedFormats) {
    onProgress?.(formatId, 'generating')
    try {
      const postData = await generatePostForFormat({
        formatId,
        briefing,
        name,
        objective,
        brandName,
        brandVoice,
        brandId,
        userId,
        campaignId: campaignRecord.id,
        targetUrl,
        cta,
        suggestedTpls,
      })

      const created = await pb.collection('posts').create(postData)
      createdPosts.push(created)
      onProgress?.(formatId, 'done')
    } catch (err) {
      console.error(`Erro ao gerar formato ${formatId} da campanha:`, err)
      onProgress?.(formatId, 'error')
    }
  }

  return {
    campaign: campaignRecord as unknown as CampaignRecord,
    createdPosts,
    totalCredits,
  }
}

async function generatePostForFormat(params: {
  formatId: 'reels' | 'story' | 'feed' | 'carousel' | 'flyer'
  briefing: string
  name: string
  objective: 'engajar' | 'vender' | 'awareness'
  brandName: string
  brandVoice: string
  brandId?: string
  userId: string
  campaignId: string
  targetUrl?: string
  cta?: string
  suggestedTpls: any[]
}): Promise<Record<string, any>> {
  const {
    formatId,
    briefing,
    name,
    objective,
    brandName,
    brandVoice,
    brandId,
    userId,
    campaignId,
    targetUrl,
    cta,
    suggestedTpls,
  } = params

  const effectiveCta =
    cta ||
    (objective === 'vender'
      ? 'Acesse o link na bio e garanta sua vaga agora mesmo!'
      : objective === 'awareness'
        ? 'Compartilhe este insight com sua equipe e fortaleça seu posicionamento.'
        : 'Comente sua opinião e envie para um amigo que precisa ver isso!')

  const effectiveUrl = targetUrl ? `\n\n🔗 Saiba mais em: ${targetUrl}` : ''

  if (formatId === 'reels') {
    // Roteiro com beats de tempo
    const aiScript = await generateMultiFormatContent({
      topic: `${name}: ${briefing}`,
      format: 'video_script',
      brandName,
      tone: brandVoice,
    })

    const script = aiScript.video_script || {
      hook: `Pare tudo o que você está fazendo agora! Se você quer saber sobre ${name}, preste atenção nos próximos 30 segundos.`,
      development: briefing,
      cta: effectiveCta,
      beats: [
        {
          time: '0:00 - 0:03',
          title: 'Gancho (Stop Scrolling)',
          narration: `Atenção: o maior segredo sobre ${name} finalmente revelado!`,
          visual: 'Corte rápido, texto chamativo em caixa alta na tela.',
        },
        {
          time: '0:03 - 0:20',
          title: 'Desenvolvimento',
          narration: briefing,
          visual: 'Demonstração dinâmica com b-roll e legendas sincronizadas.',
        },
        {
          time: '0:20 - 0:30',
          title: 'Chamada para Ação',
          narration: effectiveCta,
          visual: 'Apontar para link ou botão de ação.',
        },
      ],
    }

    const { hashtags } = await generateHashtags({
      content: `${name} ${briefing}`,
      platform: 'TikTok',
      objective,
    })

    const fullCaption = `🎬 Roteiro de Vídeo Curto: ${name}\n\n[GANCHO]\n${script.hook}\n\n[CONTEÚDO]\n${script.development}\n\n👉 ${script.cta}${effectiveUrl}\n\n${(hashtags || []).join(' ')}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Reels / Vídeo Curto`,
      caption: fullCaption,
      platform: 'TikTok',
      status: 'draft',
      duration: 30,
      width: 1080,
      height: 1920,
      template_id: suggestedTpls[0]?.id || 'tpl-video-beats',
      script_json: JSON.stringify(script),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'reels', 'video'],
      target_networks: ['tiktok', 'instagram', 'youtube'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'carousel') {
    // Carrossel slide a slide
    const aiCarousel = await generateMultiFormatContent({
      topic: `${name}: ${briefing}`,
      format: 'carousel',
      brandName,
      tone: brandVoice,
    })

    const carData = aiCarousel.carousel || {
      cover_title: name,
      subtitle: `Deslize para ver o passo a passo completo 👉`,
      slides: [
        { slide_number: 1, title: `Capa: ${name}`, text: briefing },
        {
          slide_number: 2,
          title: 'O Problema Central',
          text: 'Entenda os erros que custam caro na sua operação.',
        },
        {
          slide_number: 3,
          title: 'A Estratégia',
          text: 'A virada que os líderes de mercado aplicam na prática.',
        },
        {
          slide_number: 4,
          title: 'Aplicação Imediata',
          text: 'Como executar hoje mesmo com passos simples.',
        },
        { slide_number: 5, title: 'CTA Final', text: effectiveCta },
      ],
    }

    const { hashtags } = await generateHashtags({
      content: `${name} ${briefing}`,
      platform: 'Instagram',
      objective,
    })

    const slidesSummary = carData.slides
      .map((s) => `• Slide ${s.slide_number}: ${s.title}\n  ${s.text}`)
      .join('\n\n')

    const fullCaption = `📌 ${carData.cover_title}\n\n${carData.subtitle}\n\n${slidesSummary}\n\n👉 ${effectiveCta}${effectiveUrl}\n\n${(hashtags || []).join(' ')}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Carrossel (5 Slides)`,
      caption: fullCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1350,
      template_id:
        suggestedTpls.find((t) => t.category === 'educativo')?.id || 'tpl-carousel-guide',
      script_json: JSON.stringify(carData),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'carrossel', 'educativo'],
      target_networks: ['instagram', 'linkedin'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'story') {
    const { hashtags } = await generateHashtags({
      content: `${name} story`,
      platform: 'Instagram',
      objective,
    })

    const storyCaption = `📱 Story Interativo — Campanha ${name}\n\n[Sequência de 3 telas]\n\n1. Gancho & Enquete: "Você já ouviu falar de ${name}?" (Sim / Não)\n2. Revelação: ${briefing}\n3. Fechamento com Figurinha de Link: "${effectiveCta}"${effectiveUrl}\n\n${(hashtags || []).join(' ')}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Story Interativo`,
      caption: storyCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1920,
      template_id: 'tpl-story-conversion',
      script_json: JSON.stringify({
        type: 'story_sequence',
        slides_count: 3,
        objective,
        cta: effectiveCta,
        url: targetUrl || '',
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'story', 'interativo'],
      target_networks: ['instagram', 'facebook'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'flyer') {
    const { hashtags } = await generateHashtags({
      content: `${name} ${briefing}`,
      platform: 'Facebook',
      objective: 'vender',
    })

    const flyerCaption = `⚡ FLYER OFICIAL: ${name.toUpperCase()}\n\n${briefing}\n\n👉 OFERTA ESPECIAL: ${effectiveCta}${effectiveUrl}\n\n${(hashtags || []).join(' ')}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Flyer Promocional`,
      caption: flyerCaption,
      platform: 'Facebook',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1920,
      template_id: 'tpl-flyer-promo',
      script_json: JSON.stringify({
        headline: name,
        subheadline: briefing.slice(0, 80),
        cta: effectiveCta,
        theme: 'oferta_destaque',
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'flyer', 'promocao'],
      target_networks: ['facebook', 'instagram', 'whatsapp'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // Fallback: Feed regular (1:1 / 4:5)
  let feedCaptionText = ''
  try {
    const captionRes = (await generateCaption({
      content: `${name}: ${briefing}`,
      platform: 'Instagram',
      objective,
      brandName,
      brandVoice,
      headline: name,
    })) as any
    feedCaptionText = captionRes?.caption || ''
  } catch (_) {
    feedCaptionText = `✨ ${name}\n\n${briefing}\n\n👉 ${effectiveCta}${effectiveUrl}`
  }

  const { hashtags } = await generateHashtags({
    content: `${name} ${briefing}`,
    platform: 'Instagram',
    objective,
  })

  const fullCaption = `${feedCaptionText}\n\n${(hashtags || []).join(' ')}`.trim()

  return {
    user: userId,
    brand: brandId || null,
    campaign: campaignId,
    content: `[Campanha: ${name}] Post de Feed`,
    caption: fullCaption,
    platform: 'Instagram',
    status: 'draft',
    duration: 0,
    width: 1080,
    height: 1350,
    template_id: suggestedTpls[0]?.id || 'tpl-feed-standard',
    script_json: JSON.stringify({
      headline: name,
      summary: briefing,
      cta: effectiveCta,
    }),
    tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'feed'],
    target_networks: ['instagram', 'facebook', 'linkedin'],
    revision_count: 1,
    approval_level: 'Nível 1 (Em Revisão)',
    is_favorite: false,
    is_archived: false,
  }
}
