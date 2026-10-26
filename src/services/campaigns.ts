import pb from '@/lib/pocketbase/client'
import type { CampaignRecord } from '@/types'
export type { CampaignRecord } from '@/types'
import { generateMultiFormatContent, generateHashtags, generateCaption } from '@/services/ai'
import { suggestTemplates } from '@/services/post-templates'

export type CampaignFormatId =
  | 'reels'
  | 'story'
  | 'feed'
  | 'carousel'
  | 'flyer'
  | 'youtube'
  | 'thread'
  | 'newsletter'
  | 'pinterest'
  | 'whatsapp'
  | 'carrossel_10'
  | 'poster_print'
  | 'google_display'
  | 'story_sequence_5'
  | 'event_cover'

export interface CampaignFormatOption {
  id: CampaignFormatId
  name: string
  label: string
  description: string
  platform:
    | 'Instagram'
    | 'TikTok'
    | 'YouTube'
    | 'Facebook'
    | 'LinkedIn'
    | 'Twitter'
    | 'Pinterest'
    | 'WhatsApp'
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
  {
    id: 'youtube',
    name: 'Vídeo YouTube / Shorts',
    label: 'YouTube / Shorts',
    description:
      'Roteiro completo com título magnético para busca, introdução e marcações de tempo.',
    platform: 'YouTube',
    aspectRatio: '16:9',
    credits: 30,
    badge: 'YouTube 30cr',
  },
  {
    id: 'thread',
    name: 'Thread X / Twitter',
    label: 'Thread X (5 tweets)',
    description: 'Fio narrativo com gancho irresistível e formatação em tweets numerados.',
    platform: 'Twitter',
    aspectRatio: '16:9',
    credits: 15,
    badge: 'Thread 15cr',
  },
  {
    id: 'newsletter',
    name: 'Newsletter / Artigo LinkedIn',
    label: 'Artigo LinkedIn',
    description: 'Conteúdo estruturado com tópicos executivos e tom de autoridade profissional.',
    platform: 'LinkedIn',
    aspectRatio: '1.91:1',
    credits: 25,
    badge: 'LinkedIn 25cr',
  },
  {
    id: 'pinterest',
    name: 'Pin Pinterest',
    label: 'Pin Estratégico',
    description: 'Título otimizado para mecanismo de busca visual, descrição rica e tags de nicho.',
    platform: 'Pinterest',
    aspectRatio: '2:3',
    credits: 10,
    badge: 'Pin 10cr',
  },
  {
    id: 'whatsapp',
    name: 'Banner & Copy WhatsApp',
    label: 'Copy WhatsApp',
    description:
      'Mensagem de transmissão ou status para engajamento e conversão rápida no WhatsApp.',
    platform: 'WhatsApp',
    aspectRatio: '1:1',
    credits: 10,
    badge: 'WhatsApp 10cr',
  },
  {
    id: 'carrossel_10',
    name: 'Carrossel Super Guia (10 slides)',
    label: 'Carrossel 10 slides',
    description: 'Manual definitivo aprofundado para maximizar salvamento e retenção extrema.',
    platform: 'Instagram',
    aspectRatio: '4:5',
    credits: 55,
    badge: 'Guia 10 slides (55cr)',
  },
  {
    id: 'poster_print',
    name: 'Cartaz / Pôster Impresso (A4)',
    label: 'Cartaz A4 Impresso',
    description:
      'Design de alta resolução pronto para impressão física, vitrine ou mural comercial.',
    platform: 'Facebook',
    aspectRatio: '1:1.41',
    credits: 30,
    badge: 'Impresso A4 (30cr)',
  },
  {
    id: 'google_display',
    name: 'Anúncio Google Display (1200×628)',
    label: 'Google Display / GDN',
    description:
      'Banner horizontal em proporção 1.91:1 com copy persuasivo para campanhas de mídia paga.',
    platform: 'Facebook',
    aspectRatio: '1.91:1',
    credits: 20,
    badge: 'Display GDN (20cr)',
  },
  {
    id: 'story_sequence_5',
    name: 'Story Sequencial "Conto em 5 partes"',
    label: 'Story 5 Partes',
    description:
      'Jornada narrativa completa (Problema, Agitação, Virada, Prova e CTA final nos Stories).',
    platform: 'Instagram',
    aspectRatio: '9:16',
    credits: 25,
    badge: 'Story 5 Partes (25cr)',
  },
  {
    id: 'event_cover',
    name: 'Capa de Evento / Live',
    label: 'Capa Live / Evento',
    description:
      'Header widescreen de alto impacto para transmissões ao vivo, webinars e eventos de lançamento.',
    platform: 'YouTube',
    aspectRatio: '16:9',
    credits: 20,
    badge: 'Capa Live (20cr)',
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
  selectedFormats: CampaignFormatId[]
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
  formatId: CampaignFormatId
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

  if (formatId === 'youtube') {
    const aiScript = await generateMultiFormatContent({
      topic: `${name}: ${briefing}`,
      format: 'video_script',
      brandName,
      tone: brandVoice,
    })

    const script = aiScript.video_script || {
      hook: `Neste vídeo: ${name}. Como aplicar passo a passo.`,
      development: briefing,
      cta: effectiveCta,
      beats: [
        {
          time: '0:00 - 0:15',
          title: 'Intro & Promessa',
          narration: `Bem-vindo! Hoje vamos falar sobre ${name}.`,
          visual: 'Abertura dinâmica',
        },
        {
          time: '0:15 - 3:00',
          title: 'Tópico 1 & Contexto',
          narration: briefing,
          visual: 'Slides explicativos',
        },
        {
          time: '3:00 - 4:00',
          title: 'Conclusão & CTA',
          narration: effectiveCta,
          visual: 'Card final com link',
        },
      ],
    }

    const fullCaption = `📺 ROTEIRO YOUTUBE / SHORTS: ${name}\n\n[TÍTULO SUGERIDO]\n${name} — O Guia Definitivo\n\n[TIMESTAMPS]\n00:00 Introdução\n00:45 Estratégia Prática\n02:30 Conclusão e Próximos Passos\n\n[DESCRIÇÃO]\n${briefing}\n\n👉 ${effectiveCta}${effectiveUrl}\n\n#youtube #shorts #${brandName.toLowerCase().replace(/\s+/g, '')}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Vídeo YouTube / Shorts`,
      caption: fullCaption,
      platform: 'YouTube',
      status: 'draft',
      duration: 60,
      width: 1920,
      height: 1080,
      template_id: 'tpl-youtube-guide',
      script_json: JSON.stringify(script),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'youtube', 'shorts'],
      target_networks: ['youtube'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'thread') {
    const aiThread = await generateMultiFormatContent({
      topic: `${name}: ${briefing}`,
      format: 'twitter_thread',
      brandName,
      tone: brandVoice,
    })

    const threadTweets = aiThread.twitter_thread?.tweets || [
      `1/5 🧵 O que a maioria das pessoas não entende sobre ${name}:`,
      `2/5 O principal obstáculo: ${briefing.slice(0, 150)}...`,
      `3/5 A virada de chave está em alinhar consistência e método comprovado.`,
      `4/5 Dica prática: comece hoje mesmo aplicando o primeiro princípio.`,
      `5/5 Se gostou, dê RT no tweet 1 e siga para mais insights! 👉 ${effectiveCta}`,
    ]

    const fullCaption = `🧵 THREAD NO X / TWITTER: ${name}\n\n${threadTweets.join('\n\n')}${effectiveUrl}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Thread X / Twitter`,
      caption: fullCaption,
      platform: 'Twitter',
      status: 'draft',
      duration: 0,
      width: 1200,
      height: 675,
      template_id: 'tpl-twitter-thread',
      script_json: JSON.stringify({ tweets: threadTweets }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'twitter', 'thread'],
      target_networks: ['twitter'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'newsletter') {
    const newsletterCaption = `📰 ARTIGO / NEWSLETTER LINKEDIN: ${name.toUpperCase()}\n\nCaro leitor,\n\n${briefing}\n\n📌 3 LIÇÕES ESTRATÉGICAS:\n1. Posicionamento claro supera ruído no feed.\n2. Dados e processos consistentes sustentam escala.\n3. O próximo passo prático é agir.\n\n👉 ${effectiveCta}${effectiveUrl}\n\n#linkedin #artigo #lideranca #estrategia`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Newsletter / Artigo LinkedIn`,
      caption: newsletterCaption,
      platform: 'LinkedIn',
      status: 'draft',
      duration: 0,
      width: 1200,
      height: 628,
      template_id: 'tpl-linkedin-article',
      script_json: JSON.stringify({
        title: name,
        body: briefing,
        cta: effectiveCta,
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'linkedin', 'newsletter'],
      target_networks: ['linkedin'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'pinterest') {
    const pinCaption = `📌 PIN ESTRATÉGICO: ${name}\n\n${briefing}\n\n💡 Salve este Pin na sua pasta de inspirações e acesse o link para saber mais!\n\n👉 ${effectiveCta}${effectiveUrl}\n\n#pinterestbrasil #ideias #dicas #inspiracao`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Pin Pinterest`,
      caption: pinCaption,
      platform: 'Pinterest',
      status: 'draft',
      duration: 0,
      width: 1000,
      height: 1500,
      template_id: 'tpl-pinterest-pin',
      script_json: JSON.stringify({
        title: name,
        description: briefing,
        destination: targetUrl || '',
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'pinterest', 'pin'],
      target_networks: ['pinterest'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'whatsapp') {
    const whatsCaption = `💬 MENSAGEM / STATUS WHATSAPP\n\nOlá! Passando para compartilhar uma novidade sobre *${name}*:\n\n${briefing}\n\n👉 *Próximo passo:* ${effectiveCta}${effectiveUrl}\n\n_Responda esta mensagem para tirar dúvidas diretamente conosco._`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Copy & Banner WhatsApp`,
      caption: whatsCaption,
      platform: 'WhatsApp',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1080,
      template_id: 'tpl-whatsapp-broadcast',
      script_json: JSON.stringify({
        headline: name,
        message: whatsCaption,
        cta: effectiveCta,
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'whatsapp', 'direto'],
      target_networks: ['whatsapp'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'carrossel_10') {
    const slides10 = [
      { slide_number: 1, title: `Capa: O Guia Definitivo de ${name}`, text: briefing },
      {
        slide_number: 2,
        title: 'Por que isso importa agora?',
        text: 'Entenda o cenário atual e por que os modelos antigos falham.',
      },
      {
        slide_number: 3,
        title: 'Princípio 1: Fundação Sólida',
        text: 'Estruturação inicial com visão de longo prazo.',
      },
      {
        slide_number: 4,
        title: 'Princípio 2: Automação Inteligente',
        text: 'Como usar IA para acelerar a execução sem perder alma.',
      },
      {
        slide_number: 5,
        title: 'Princípio 3: Distribuição Eficaz',
        text: 'Estratégia omnicanal adaptada a cada rede.',
      },
      {
        slide_number: 6,
        title: 'Exemplo Real de Aplicação',
        text: 'Estudo de caso e benchmark prático.',
      },
      {
        slide_number: 7,
        title: 'Os 3 Erros Mais Comuns',
        text: 'Evite essas armadilhas que diminuem o alcance.',
      },
      {
        slide_number: 8,
        title: 'Plano de Ação para os Próximos 7 Dias',
        text: 'Cronograma passo a passo de implementação.',
      },
      {
        slide_number: 9,
        title: 'Recapitulando os Pontos Chave',
        text: 'Resumo visual para fixar o aprendizado.',
      },
      { slide_number: 10, title: 'Conclusão & Próximo Nível', text: effectiveCta },
    ]

    const slidesSummary = slides10
      .map((s) => `• Slide ${s.slide_number}: ${s.title}\n  ${s.text}`)
      .join('\n\n')

    const fullCaption = `📚 CARROSSEL SUPER GUIA (10 SLIDES): ${name}\n\nSalve este manual completo para consultar sempre que precisar! 👉\n\n${slidesSummary}\n\n👉 ${effectiveCta}${effectiveUrl}\n\n#carrossel #manual #guiadefinitivo #estrategia`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Carrossel Super Guia (10 Slides)`,
      caption: fullCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1350,
      template_id: 'tpl-carousel-super-guide',
      script_json: JSON.stringify({
        cover_title: `O Guia Definitivo de ${name}`,
        slides: slides10,
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'carrossel-10', 'super-guia'],
      target_networks: ['instagram', 'linkedin'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'poster_print') {
    const posterCaption = `🖨️ CARTAZ / PÔSTER IMPRESSO (A4)\n\n📌 TÍTULO: ${name.toUpperCase()}\n\n📄 CONTEÚDO PRINCIPAL:\n${briefing}\n\n📍 CHAMADA LOCAL / PONTO DE VENDA:\n${effectiveCta}${effectiveUrl}\n\n⚙️ ESPECIFICAÇÃO TÉCNICA: Formato A4 (2480×3508 px @ 300 DPI), margens seguras de 5mm para sangria física.`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Cartaz / Pôster Impresso (A4)`,
      caption: posterCaption,
      platform: 'Facebook',
      status: 'draft',
      duration: 0,
      width: 2480,
      height: 3508,
      template_id: 'tpl-poster-a4-print',
      script_json: JSON.stringify({
        headline: name,
        body: briefing,
        footerCta: effectiveCta,
        resolution: '300 DPI A4 Print Ready',
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'impresso', 'poster-a4'],
      target_networks: ['facebook', 'instagram'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'google_display') {
    const displayCaption = `🎯 ANÚNCIO GOOGLE DISPLAY (1200×628 GDN)\n\n⚡ HEADLINE PERSUASIVA (até 30 carac.): ${name.slice(0, 30)}\n\n📝 DESCRIÇÃO DO ANÚNCIO (até 90 carac.): ${briefing.slice(0, 85)}...\n\n🔘 BOTÃO CTA: ${effectiveCta.slice(0, 20)}\n\n🔗 URL FINAL: ${targetUrl || 'https://suamarca.com.br'}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Anúncio Google Display (1200×628)`,
      caption: displayCaption,
      platform: 'Facebook',
      status: 'draft',
      duration: 0,
      width: 1200,
      height: 628,
      template_id: 'tpl-google-display-ads',
      script_json: JSON.stringify({
        headline: name.slice(0, 30),
        longHeadline: `${name} - A Solução Que Você Precisa`,
        description: briefing.slice(0, 90),
        buttonText: 'Saiba Mais',
        targetUrl: targetUrl || '',
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'google-display', 'ads'],
      target_networks: ['facebook', 'instagram', 'twitter'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'story_sequence_5') {
    const storySequence = [
      {
        part: 1,
        title: 'Parte 1: O Gancho e a Dor',
        text: `Você já passou por isso? ${briefing.slice(0, 100)}...`,
      },
      {
        part: 2,
        title: 'Parte 2: Agitando o Problema',
        text: 'A maioria tenta contornar sem saber que o custo diário continua aumentando.',
      },
      {
        part: 3,
        title: 'Parte 3: O Ponto de Virada',
        text: `Foi exatamente por isso que criamos ${name}: um novo padrão de resultado.`,
      },
      {
        part: 4,
        title: 'Parte 4: Prova e Benefício Real',
        text: 'Mais agilidade, consistência profissional e autoridade imediata.',
      },
      {
        part: 5,
        title: 'Parte 5: Próximo Passo / CTA',
        text: `${effectiveCta} Clique no adesivo de link ou mande direct!`,
      },
    ]

    const seqSummary = storySequence
      .map((s) => `📱 Story ${s.part} (${s.title}):\n"${s.text}"`)
      .join('\n\n')
    const fullStoryCaption = `📖 STORY SEQUENCIAL "CONTO EM 5 PARTES": ${name}\n\n${seqSummary}\n\n🔗 Link ou sticker direto: ${targetUrl || 'Link na bio'}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Story Sequencial (5 Partes)`,
      caption: fullStoryCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 15,
      width: 1080,
      height: 1920,
      template_id: 'tpl-story-sequence-5',
      script_json: JSON.stringify({
        title: name,
        sequence: storySequence,
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'story-5-partes', 'storytelling'],
      target_networks: ['instagram', 'facebook', 'tiktok'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'event_cover') {
    const eventCoverCaption = `🎙️ CAPA DE EVENTO / TRANSMISSÃO AO VIVO\n\n🔴 AO VIVO: ${name.toUpperCase()}\n\n📅 TEMA & BRIEFING:\n${briefing}\n\n⏰ INSCREVA-SE & ATIVE O LEMBRETE:\n${effectiveCta}${effectiveUrl}\n\n#live #webinar #evento #transmissao`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Capa de Evento / Live (16:9)`,
      caption: eventCoverCaption,
      platform: 'YouTube',
      status: 'draft',
      duration: 0,
      width: 1920,
      height: 1080,
      template_id: 'tpl-live-event-cover',
      script_json: JSON.stringify({
        liveTitle: name,
        speakerTopic: briefing,
        cta: effectiveCta,
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'live', 'capa-evento'],
      target_networks: ['youtube', 'linkedin', 'facebook'],
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
