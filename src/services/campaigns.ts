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
  // 6 Novos Formatos Anteriores
  | 'carousel_testimonials'
  | 'story_backstage_3'
  | 'reels_cinematic'
  | 'email_newsletter_visual'
  | 'banner_linkedin_company'
  | 'meta_ad_square'
  // 10 Novos Formatos Expandidos
  | 'talking_head_script'
  | 'carousel_before_after'
  | 'carousel_educational_tips'
  | 'ugc_social_proof'
  | 'story_poll_ad'
  | 'community_forum_post'
  | 'podcast_audiogram_snippet'
  | 'branded_meme_lightpost'
  | 'live_script_stream'
  | 'collab_duo_post'

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
  {
    id: 'carousel_testimonials',
    name: 'Carrossel Depoimentos (6 slides)',
    label: 'Carrossel Depoimentos',
    description:
      'Prova social magnética com 6 lâminas narrando dor inicial, transformação, prints e CTA.',
    platform: 'Instagram',
    aspectRatio: '4:5',
    credits: 40,
    badge: 'Depoimentos 6s (40cr)',
  },
  {
    id: 'story_backstage_3',
    name: 'Série Stories "Bastidores" (3 telas)',
    label: 'Stories Bastidores',
    description: 'Sequência autêntica de bastidores (making-of, processo e spoiler do lançamento).',
    platform: 'Instagram',
    aspectRatio: '9:16',
    credits: 20,
    badge: 'Bastidores 3t (20cr)',
  },
  {
    id: 'reels_cinematic',
    name: 'Reels Vertical Cinematográfico',
    label: 'Reels Cinematográfico',
    description:
      'Roteiro áudio-visual imersivo, cortes de ritmo rápido, direção de iluminação e sound design.',
    platform: 'Instagram',
    aspectRatio: '9:16',
    credits: 30,
    badge: 'Cinematográfico (30cr)',
  },
  {
    id: 'email_newsletter_visual',
    name: 'E-mail Marketing / Newsletter Visual',
    label: 'E-mail / Newsletter',
    description:
      'Layout estruturado com assunto de alta abertura, pré-header, blocos visuais e botão de clique.',
    platform: 'LinkedIn',
    aspectRatio: '1:1.2',
    credits: 25,
    badge: 'E-mail Visual (25cr)',
  },
  {
    id: 'banner_linkedin_company',
    name: 'Banner LinkedIn Company (1584×396)',
    label: 'Banner LinkedIn',
    description:
      'Capa panorâmica corporativa para Company Page com posicionamento de autoridade B2B.',
    platform: 'LinkedIn',
    aspectRatio: '4:1',
    credits: 20,
    badge: 'LinkedIn Cover (20cr)',
  },
  {
    id: 'meta_ad_square',
    name: 'Card de Anúncio Meta (1080×1080)',
    label: 'Meta Ad Square',
    description:
      'Criativo de alta conversão para Instagram & Facebook Ads com gancho visual e oferta direta.',
    platform: 'Facebook',
    aspectRatio: '1:1',
    credits: 20,
    badge: 'Meta Ads 1:1 (20cr)',
  },
  // 10 Novos Formatos Expandidos
  {
    id: 'talking_head_script',
    name: 'Vídeo Vertical "Talking Head" com Roteiro de Fala',
    label: 'Talking Head 9:16',
    description:
      'Roteiro magnético direto para a câmera com gancho de fala natural, pausas, ênfases e teleprompter integrado.',
    platform: 'TikTok',
    aspectRatio: '9:16',
    credits: 30,
    badge: 'Talking Head (30cr)',
  },
  {
    id: 'carousel_before_after',
    name: 'Carrossel "Antes & Depois" (Estudo de Transformação)',
    label: 'Carrossel Antes & Depois',
    description:
      'Sequência em 5 lâminas contrastando o estado caótico inicial, a virada de chave e o resultado final mensurável.',
    platform: 'Instagram',
    aspectRatio: '4:5',
    credits: 35,
    badge: 'Antes & Depois (35cr)',
  },
  {
    id: 'carousel_educational_tips',
    name: 'Série de Dicas "Carrossel Educativo Acionável"',
    label: 'Carrossel Dicas Práticas',
    description:
      'Lâminas didáticas com títulos diretos, 1 dica por slide e alta probabilidade de salvamento e compartilhamento.',
    platform: 'Instagram',
    aspectRatio: '4:5',
    credits: 35,
    badge: 'Dicas 5s (35cr)',
  },
  {
    id: 'ugc_social_proof',
    name: 'UGC / Prova Social em Vídeo (Roteiro Autêntico)',
    label: 'UGC Prova Social',
    description:
      'Roteiro sem cara de anúncio no formato de criador do dia a dia desempacotando, usando e recomendando o produto/serviço.',
    platform: 'TikTok',
    aspectRatio: '9:16',
    credits: 25,
    badge: 'UGC Vídeo (25cr)',
  },
  {
    id: 'story_poll_ad',
    name: 'Anúncio de Story com Enquete Interativa',
    label: 'Story com Enquete',
    description:
      'Criativo 9:16 com pergunta polarizadora, posicionamento exato da figurinha de enquete e gancho de direct/clique.',
    platform: 'Instagram',
    aspectRatio: '9:16',
    credits: 20,
    badge: 'Story Enquete (20cr)',
  },
  {
    id: 'community_forum_post',
    name: 'Post de Comunidade / Fórum Aberto de Discussão',
    label: 'Post Fórum / Comunidade',
    description:
      'Texto de abertura de debate provocativo para gerar dezenas de respostas nos comentários (Facebook, Reddit, Threads).',
    platform: 'Facebook',
    aspectRatio: '1:1',
    credits: 15,
    badge: 'Comunidade (15cr)',
  },
  {
    id: 'podcast_audiogram_snippet',
    name: 'Snippet de Podcast / Audiograma com Legenda Dinâmica',
    label: 'Audiograma / Podcast',
    description:
      'Recorte de 45 segundos com onda sonora, transcrição em destaque e gancho reflexivo de alta retenção.',
    platform: 'YouTube',
    aspectRatio: '9:16',
    credits: 25,
    badge: 'Audiograma (25cr)',
  },
  {
    id: 'branded_meme_lightpost',
    name: 'Meme / Lightpost com Alinhamento de Marca',
    label: 'Meme / Lightpost',
    description:
      'Humor contextual e identificação rápida para quebrar a frieza do feed sem perder a autoridade do negócio.',
    platform: 'Instagram',
    aspectRatio: '1:1',
    credits: 15,
    badge: 'Meme Marca (15cr)',
  },
  {
    id: 'live_script_stream',
    name: 'Live com Roteiro Completo (Estrutura de 45min)',
    label: 'Roteiro de Live',
    description:
      'Estrutura de transmissão ao vivo: abertura, retenção de sala, quebra de objeções, entrega do conteúdo e pitch final.',
    platform: 'YouTube',
    aspectRatio: '16:9',
    credits: 35,
    badge: 'Live Roteiro (35cr)',
  },
  {
    id: 'collab_duo_post',
    name: 'Colaboração / Post em Dupla (Co-marketing)',
    label: 'Collab / Duo Post',
    description:
      'Formato estruturado para convidar parceiros, co-autorias e cruzamento de audiências complementares no feed.',
    platform: 'Instagram',
    aspectRatio: '4:5',
    credits: 25,
    badge: 'Collab Duo (25cr)',
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
      campaign_format: 'reels',
      is_reviewed: false,
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
      campaign_format: 'carousel',
      is_reviewed: false,
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
      campaign_format: 'story',
      is_reviewed: false,
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
      campaign_format: 'flyer',
      is_reviewed: false,
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
      campaign_format: 'youtube',
      is_reviewed: false,
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
      campaign_format: 'thread',
      is_reviewed: false,
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
      campaign_format: 'newsletter',
      is_reviewed: false,
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
      campaign_format: 'pinterest',
      is_reviewed: false,
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
      campaign_format: 'whatsapp',
      is_reviewed: false,
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
      campaign_format: 'carrossel_10',
      is_reviewed: false,
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
      campaign_format: 'poster_print',
      is_reviewed: false,
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
    // 3 Headlines no limite oficial do Google Ads (30 caracteres) e 2 Descrições (90 caracteres)
    const hl1 = name.slice(0, 30)
    const hl2 = `${name}: Solução Completa`.slice(0, 30)
    const hl3 = (
      objective === 'vender' ? 'Garanta Oferta Exclusiva' : 'Conheça o Novo Padrão'
    ).slice(0, 30)
    const desc1 = `${briefing.slice(0, 80)}. Saiba mais!`.slice(0, 90)
    const desc2 = `${effectiveCta.slice(0, 75)} Clique e confira.`.slice(0, 90)

    const displayCaption = `🎯 ANÚNCIO GOOGLE DISPLAY (1200×628 GDN / GOOGLE ADS)\n\n⚡ HEADLINES RESPONSIVAS (máx. 30 caracteres cada):\n• H1: ${hl1} (${hl1.length}/30)\n• H2: ${hl2} (${hl2.length}/30)\n• H3: ${hl3} (${hl3.length}/30)\n\n📝 DESCRIÇÕES RESPONSIVAS (máx. 90 caracteres cada):\n• D1: ${desc1} (${desc1.length}/90)\n• D2: ${desc2} (${desc2.length}/90)\n\n🔘 CALL TO ACTION: ${effectiveCta.slice(0, 20)}\n🔗 URL FINAL: ${targetUrl || 'https://suamarca.com.br'}`

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
      campaign_format: 'google_display',
      is_reviewed: false,
      script_json: JSON.stringify({
        headlines: [hl1, hl2, hl3],
        descriptions: [desc1, desc2],
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
      campaign_format: 'story_sequence_5',
      is_reviewed: false,
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
      campaign_format: 'event_cover',
      is_reviewed: false,
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

  if (formatId === 'carousel_testimonials') {
    const slidesTestimonials = [
      {
        slide_number: 1,
        title: `Capa: O que estão falando sobre ${name}`,
        text: 'Histórias reais de quem transformou seus resultados na prática.',
        badge: 'Depoimentos Reais',
      },
      {
        slide_number: 2,
        title: 'O Cenário Inicial',
        text: `Antes de conhecer ${name}, o maior obstáculo era: "${briefing.slice(0, 90)}..."`,
        badge: 'O Ponto de Partida',
      },
      {
        slide_number: 3,
        title: 'Depoimento 1: Resultado Tangível',
        text: `"Em menos de 14 dias a nossa operação mudou completamente de nível. Super recomendo!" — Cliente Verificado ⭐⭐⭐⭐⭐`,
        badge: 'Impacto Real',
      },
      {
        slide_number: 4,
        title: 'Depoimento 2: Agilidade e Eficiência',
        text: `"O suporte e o método entregam exatamente o que prometem. Valeu cada centavo investido." — Parceiro Estratégico ⭐⭐⭐⭐⭐`,
        badge: 'Excelência Comprovada',
      },
      {
        slide_number: 5,
        title: 'A Grande Lição',
        text: 'Você não precisa passar pelos mesmos erros. É possível acelerar com confiança.',
        badge: 'A Virada de Chave',
      },
      {
        slide_number: 6,
        title: 'Sua Vez de Transformar',
        text: `${effectiveCta} Deixe seu comentário ou envie uma mensagem direta!`,
        badge: 'Próximo Passo',
      },
    ]

    const slidesSummary = slidesTestimonials
      .map((s) => `• Slide ${s.slide_number} [${s.badge}]: ${s.title}\n  ${s.text}`)
      .join('\n\n')

    const testimonialsCaption = `⭐ CARROSSEL DE DEPOIMENTOS (6 SLIDES): ${name}\n\nResultados reais falam mais alto que qualquer promessa. Deslize para ver! 👉\n\n${slidesSummary}\n\n👉 ${effectiveCta}${effectiveUrl}\n\n#depoimentos #provasocial #resultados #casosdesucesso`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Carrossel Depoimentos (6 Slides)`,
      caption: testimonialsCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1350,
      template_id: 'tpl-carousel-testimonials',
      campaign_format: 'carousel_testimonials',
      is_reviewed: false,
      script_json: JSON.stringify({
        cover_title: `O que estão falando sobre ${name}`,
        slides: slidesTestimonials,
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'depoimentos', 'prova-social'],
      target_networks: ['instagram', 'linkedin', 'facebook'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'story_backstage_3') {
    const backstageScreens = [
      {
        screen: 1,
        title: 'Tela 1: Bastidores Secretos (Making of)',
        text: `👀 Um vislumbre exclusivo de bastidores: preparando os detalhes de ${name}...`,
        sticker: 'Caixa de Perguntas: "Querem spoiler?"',
      },
      {
        screen: 2,
        title: 'Tela 2: O Processo Real',
        text: `Nem tudo são flores na rotina. Aqui está o desafio real: ${briefing.slice(0, 80)}. Mas a solução ficou incrível!`,
        sticker: 'Enquete: "Curtem ver bastidores?" (Sim / Com certeza)',
      },
      {
        screen: 3,
        title: 'Tela 3: Revelação & Link de Acesso VIP',
        text: `Quer ser avisado primeiro assim que liberar? ${effectiveCta}`,
        sticker: `Figurinha de Link: ${targetUrl || 'Link na Bio'}`,
      },
    ]

    const backstageSummary = backstageScreens
      .map((s) => `📱 Tela ${s.screen} (${s.title}):\n"${s.text}"\n[Adesivo: ${s.sticker}]`)
      .join('\n\n')

    const backstageCaption = `🎬 SÉRIE STORIES "BASTIDORES" (3 TELAS): ${name}\n\n${backstageSummary}\n\n🔗 ${targetUrl || 'Link na bio'}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Stories Bastidores (3 Telas)`,
      caption: backstageCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 15,
      width: 1080,
      height: 1920,
      template_id: 'tpl-story-backstage',
      campaign_format: 'story_backstage_3',
      is_reviewed: false,
      script_json: JSON.stringify({
        title: name,
        screens: backstageScreens,
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'bastidores', 'making-of'],
      target_networks: ['instagram', 'facebook', 'tiktok'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'reels_cinematic') {
    const cinematicScript = {
      hook_3s: `[0:00 - 0:03] Câmera em movimento lento com iluminação contrastante (rim light). Título em tipografia bold: "${name.toUpperCase()}". Narrador com voz firme e grave.`,
      development_beat1: `[0:03 - 0:12] Corte rítmico acompanhando a batida musical. Transição de zoom-in. Narração: "O erro que 90% das marcas cometem ao falar sobre ${name}..."`,
      development_beat2: `[0:12 - 0:22] Exibição de solução cinematográfica: ${briefing.slice(0, 110)}. Efeitos visuais de blur de movimento e texto pontual na tela.`,
      climax_cta: `[0:22 - 0:30] Música sobe no clímax. Narrador: "${effectiveCta}". Encerramento com logotipo e animação de swipe up.`,
      sound_design:
        'Trilha cinematográfica moderna (synthwave/orchestral híbrido), sound effects de whoosh e bass drop nos cortes.',
    }

    const cinematicCaption = `🎬 REELS VERTICAL CINEMATOGRÁFICO: ${name}\n\n[ROTEIRO ÁUDIO-VISUAL]\n${cinematicScript.hook_3s}\n\n${cinematicScript.development_beat1}\n\n${cinematicScript.development_beat2}\n\n${cinematicScript.climax_cta}\n\n🎵 TRILHA & SOUND DESIGN:\n${cinematicScript.sound_design}\n\n👉 ${effectiveCta}${effectiveUrl}\n\n#cinematic #reelsviral #producaodevideo #estilo`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Reels Vertical Cinematográfico`,
      caption: cinematicCaption,
      platform: 'TikTok',
      status: 'draft',
      duration: 30,
      width: 1080,
      height: 1920,
      template_id: 'tpl-reels-cinematic',
      campaign_format: 'reels_cinematic',
      is_reviewed: false,
      script_json: JSON.stringify(cinematicScript),
      tags: [
        'campanha',
        name.toLowerCase().replace(/\s+/g, '-'),
        'cinematografico',
        'video-vertical',
      ],
      target_networks: ['tiktok', 'instagram', 'youtube'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'email_newsletter_visual') {
    const emailData = {
      subject: `[Exclusivo] O que você precisa saber sobre ${name}`,
      preheader: `Insights diretos, novidades e o próximo passo para o seu negócio.`,
      headerTitle: name.toUpperCase(),
      block1: {
        title: '1. O Cenário & O Diagnóstico',
        content: `Caro leitor,\n\nAcompanhando o mercado, percebemos que o maior desafio atual envolve ${briefing}. Muitos tentam abordagens genéricas que não geram retenção.`,
      },
      block2: {
        title: '2. A Metodologia Validada',
        content: `Na ${brandName}, estruturamos um método claro baseado em consistência, dados e execução simplificada. Quando esses três pilares se encontram, o crescimento deixa de ser sorte.`,
      },
      block3: {
        title: '3. Ação Imediata',
        content: `O que você pode fazer hoje: aplique o primeiro passo antes de tentar reinventar todo o fluxo.`,
      },
      buttonText: effectiveCta.slice(0, 30),
      buttonUrl: targetUrl || 'https://suamarca.com.br',
    }

    const emailCaption = `📧 E-MAIL MARKETING & NEWSLETTER VISUAL\n\n📌 ASSUNTO: ${emailData.subject}\n📬 PRÉ-HEADER: ${emailData.preheader}\n\n🏷️ CABEÇALHO:\n${emailData.headerTitle}\n\n${emailData.block1.title}\n${emailData.block1.content}\n\n${emailData.block2.title}\n${emailData.block2.content}\n\n${emailData.block3.title}\n${emailData.block3.content}\n\n🔘 BOTÃO PRINCIPAL:\n[${emailData.buttonText}] -> ${emailData.buttonUrl}\n\n💡 Dica de Envio: Terça ou Quinta às 10h da manhã para máxima taxa de abertura.`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] E-mail Marketing / Newsletter Visual`,
      caption: emailCaption,
      platform: 'LinkedIn',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1350,
      template_id: 'tpl-email-newsletter-visual',
      campaign_format: 'email_newsletter_visual',
      is_reviewed: false,
      script_json: JSON.stringify(emailData),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'email-marketing', 'newsletter'],
      target_networks: ['linkedin', 'medium'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'banner_linkedin_company') {
    const bannerData = {
      headline: name,
      subheadline: briefing.slice(0, 90),
      brandTagline: `${brandName} · Inovação e Autoridade`,
      ctaBadge: effectiveCta.slice(0, 25),
      recommendedDimensions: '1584×396 px (Proporção 4:1)',
      safeZone: 'Manter textos e logotipos a pelo menos 40px das bordas horizontais.',
    }

    const bannerCaption = `🏢 BANNER LINKEDIN COMPANY (1584×396)\n\n💼 HEADLINE DE AUTORIDADE:\n${bannerData.headline}\n\n📝 SUB-HEADLINE / POSICIONAMENTO:\n${bannerData.subheadline}\n\n🏷️ TAGLINE DA EMPRESA:\n${bannerData.brandTagline}\n\n🔘 CALL TO ACTION:\n${bannerData.ctaBadge}${effectiveUrl}\n\n⚙️ ESPECIFICAÇÃO:\n${bannerData.recommendedDimensions} — ${bannerData.safeZone}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Banner LinkedIn Company (1584×396)`,
      caption: bannerCaption,
      platform: 'LinkedIn',
      status: 'draft',
      duration: 0,
      width: 1584,
      height: 396,
      template_id: 'tpl-linkedin-company-cover',
      campaign_format: 'banner_linkedin_company',
      is_reviewed: false,
      script_json: JSON.stringify(bannerData),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'linkedin-company', 'banner'],
      target_networks: ['linkedin'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  if (formatId === 'meta_ad_square') {
    const adData = {
      primaryText: `${briefing}\n\nDescubra por que líderes de mercado escolhem a ${brandName}.`,
      headline: name.slice(0, 45),
      description: 'Oferta por tempo limitado. Clique para conferir!',
      callToAction: 'Saiba mais',
      creativeAspect: '1:1 Square (1080×1080 px)',
      placement: 'Feed Instagram & Facebook Ads',
    }

    const metaAdCaption = `🎯 CARD DE ANÚNCIO META ADS (1080×1080 QUADRADO)\n\n📝 TEXTO PRINCIPAL (COPY PERSUASIVA):\n${adData.primaryText}\n\n⚡ TÍTULO DO ANÚNCIO (HEADLINE):\n${adData.headline}\n\n💬 DESCRIÇÃO NO FEED:\n${adData.description}\n\n🔘 BOTÃO CTA:\n${adData.callToAction} -> ${targetUrl || 'Link de destino'}\n\n⚙️ FORMATO: ${adData.creativeAspect} otimizado para leilão Meta Ads.`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Card Anúncio Meta (1080×1080)`,
      caption: metaAdCaption,
      platform: 'Facebook',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1080,
      template_id: 'tpl-meta-ad-square',
      campaign_format: 'meta_ad_square',
      is_reviewed: false,
      script_json: JSON.stringify(adData),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'meta-ads', 'anuncio-1080'],
      target_networks: ['facebook', 'instagram'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // 1. talking_head_script
  if (formatId === 'talking_head_script') {
    const scriptData = {
      hook: `Se você quer dominar ${name}, preste atenção nesta fala direta de 35 segundos.`,
      speakingPoints: [
        '[0s-3s] Olhar fixo para lente: "Não faça mais isso antes de entender este princípio."',
        '[3s-15s] Entrando no ponto central: ' + briefing.slice(0, 120),
        '[15s-25s] A virada prática: como a ' + brandName + ' implementa sem atrito.',
        '[25s-35s] CTA: ' + effectiveCta,
      ],
      teleprompterNotes: 'Falar em tom coloquial, sem parecer leitura. Pausa de 1s antes do CTA.',
    }

    const talkingCaption = `🎙️ VÍDEO VERTICAL TALKING HEAD — ROTEIRO DE FALA DIRETA\n\n🎯 GANCHO DE ABERTURA:\n"${scriptData.hook}"\n\n📜 GUIA DO TELEPROMPTER / BEATS:\n${scriptData.speakingPoints.join('\n')}\n\n💡 NOTAS DE GRAVAÇÃO:\n${scriptData.teleprompterNotes}\n\n👉 ${effectiveCta}${effectiveUrl}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Vídeo Talking Head com Roteiro`,
      caption: talkingCaption,
      platform: 'TikTok',
      status: 'draft',
      duration: 35,
      width: 1080,
      height: 1920,
      template_id: 'tpl-talking-head-script',
      campaign_format: 'talking_head_script',
      is_reviewed: false,
      script_json: JSON.stringify(scriptData),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'talking-head', 'video-vertical'],
      target_networks: ['tiktok', 'instagram', 'youtube'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // 2. carousel_before_after
  if (formatId === 'carousel_before_after') {
    const beforeAfterData = {
      cover: `Antes vs. Depois: O Caso Real de ${name}`,
      slide1: 'Slide 1 (Capa): O Contraste Inicial — De onde partimos.',
      slide2: 'Slide 2 (O "Antes"): O cenário caótico, erros frequentes e dores.',
      slide3: 'Slide 3 (O Ponto de Inflexão): O método que mudou a rota da operação.',
      slide4: 'Slide 4 (O "Depois"): Métricas, print de resultado e alívio do cliente.',
      slide5: 'Slide 5 (CTA): ' + effectiveCta,
    }

    const carCaption = `🔄 CARROSSEL ANTES & DEPOIS (5 SLIDES)\n\n📌 ${beforeAfterData.cover}\n\n${beforeAfterData.slide1}\n${beforeAfterData.slide2}\n${beforeAfterData.slide3}\n${beforeAfterData.slide4}\n${beforeAfterData.slide5}\n\n👉 Salve para comparar na sua operação!${effectiveUrl}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Carrossel Antes & Depois`,
      caption: carCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1350,
      template_id: 'tpl-carousel-before-after',
      campaign_format: 'carousel_before_after',
      is_reviewed: false,
      script_json: JSON.stringify(beforeAfterData),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'antes-depois', 'carrossel'],
      target_networks: ['instagram', 'linkedin'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // 3. carousel_educational_tips
  if (formatId === 'carousel_educational_tips') {
    const tipsData = {
      cover: `5 Dicas Rápidas para ${name} que Você Pode Aplicar Hoje`,
      tips: [
        'Dica 1: Comece pela clareza do gancho antes de produzir o miolo.',
        'Dica 2: Elimine os primeiros 3 segundos de enrolação e vá direto ao valor.',
        'Dica 3: ' + briefing.slice(0, 90),
        'Dica 4: Automatize a rotina repetitiva para focar na estratégia.',
        'Dica 5: Salve este carrossel e revise toda semana.',
      ],
      cta: effectiveCta,
    }

    const tipsCaption = `📚 CARROSSEL EDUCATIVO COM DICAS PRÁTICAS\n\n📌 ${tipsData.cover}\n\n${tipsData.tips.map((t, idx) => `• Slide ${idx + 1}: ${t}`).join('\n')}\n\n👉 ${effectiveCta}${effectiveUrl}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Carrossel Educativo de Dicas`,
      caption: tipsCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1350,
      template_id: 'tpl-carousel-tips',
      campaign_format: 'carousel_educational_tips',
      is_reviewed: false,
      script_json: JSON.stringify(tipsData),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'educativo', 'dicas'],
      target_networks: ['instagram', 'linkedin'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // 4. ugc_social_proof
  if (formatId === 'ugc_social_proof') {
    const ugcData = {
      hook: `Gente, eu precisava vir aqui contar o que aconteceu depois que comecei a usar ${name}...`,
      narrative: `Eu estava cético, mas quando testei na prática com a ${brandName}, os números mudaram completamente.`,
      demonstration:
        'Gravação em modo selfie, sem iluminação de estúdio pesada, mostrando o resultado na tela do celular.',
      cta: effectiveCta,
    }

    const ugcCaption = `🤳 UGC / VÍDEO DE PROVA SOCIAL AUTÊNTICO (9:16)\n\n[ROTEIRO DE CRIADOR]\n"${ugcData.hook}"\n\n[DESENVOLVIMENTO NATURAL]\n"${ugcData.narrative}"\n\n[AÇÃO DE TELA]\n${ugcData.demonstration}\n\n👉 ${effectiveCta}${effectiveUrl}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] UGC / Prova Social em Vídeo`,
      caption: ugcCaption,
      platform: 'TikTok',
      status: 'draft',
      duration: 30,
      width: 1080,
      height: 1920,
      template_id: 'tpl-ugc-proof',
      campaign_format: 'ugc_social_proof',
      is_reviewed: false,
      script_json: JSON.stringify(ugcData),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'ugc', 'prova-social'],
      target_networks: ['tiktok', 'instagram'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // 5. story_poll_ad
  if (formatId === 'story_poll_ad') {
    const pollData = {
      headline: `Qual é o seu maior gargalo em ${name}?`,
      optionA: 'Falta de Tempo / Consistência',
      optionB: 'Não saber o que postar / Ideias',
      pollStickerPlacement: 'Centro da tela (Y: 55%, X: 50%)',
      nextAction: 'Quem vota recebe diagnóstico gratuito na DM.',
    }

    const pollCaption = `📊 STORY INTERATIVO COM ENQUETE (9:16)\n\n❓ PERGUNTA POLARIZADORA:\n"${pollData.headline}"\n\n[OPÇÃO A]: ${pollData.optionA}\n[OPÇÃO B]: ${pollData.optionB}\n\n📍 POSICIONAMENTO DA FIGURINHA:\n${pollData.pollStickerPlacement}\n\n🎯 ESTRATÉGIA:\n${pollData.nextAction}\n\n👉 Responda acima para receber o acesso!${effectiveUrl}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Story com Enquete Interativa`,
      caption: pollCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1920,
      template_id: 'tpl-story-poll',
      campaign_format: 'story_poll_ad',
      is_reviewed: false,
      script_json: JSON.stringify(pollData),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'story-enquete', 'interativo'],
      target_networks: ['instagram', 'facebook'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // 6. community_forum_post
  if (formatId === 'community_forum_post') {
    const forumCaption = `💬 DEBATE ABERTO NA COMUNIDADE: ${name}\n\n${briefing}\n\nUma pergunta sincera para quem está no campo de batalha:\n\nVocês preferem focar em volume diário ou em superproduções semanais para manter consistência?\n\nDeixem a experiência real de vocês aqui nos comentários. Vamos consolidar os melhores aprendizados! 👇`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Post de Fórum & Comunidade`,
      caption: forumCaption,
      platform: 'Facebook',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1080,
      template_id: 'tpl-community-forum',
      campaign_format: 'community_forum_post',
      is_reviewed: false,
      script_json: JSON.stringify({
        type: 'community_debate',
        topic: name,
        question: 'Volume vs Qualidade',
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'comunidade', 'forum'],
      target_networks: ['facebook', 'reddit', 'threads'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // 7. podcast_audiogram_snippet
  if (formatId === 'podcast_audiogram_snippet') {
    const podcastCaption = `🎙️ CORTE DE PODCAST / AUDIOGRAMA (45s)\n\nEpisódio: ${name}\n\n"A maior ilusão é achar que o sucesso vem de uma grande sacada repentina. Na verdade, ${briefing.slice(0, 100)}..."\n\n🔊 Ouça o episódio completo no Spotify & YouTube.\n👉 Link na bio!${effectiveUrl}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Snippet Audiograma Podcast`,
      caption: podcastCaption,
      platform: 'YouTube',
      status: 'draft',
      duration: 45,
      width: 1080,
      height: 1920,
      template_id: 'tpl-podcast-audiogram',
      campaign_format: 'podcast_audiogram_snippet',
      is_reviewed: false,
      script_json: JSON.stringify({ waveform: true, highlightQuote: name, duration: 45 }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'podcast', 'audiograma'],
      target_networks: ['youtube', 'tiktok', 'instagram'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // 8. branded_meme_lightpost
  if (formatId === 'branded_meme_lightpost') {
    const memeCaption = `😂 QUANDO VOCÊ TENTA RESOLVER ${name.toUpperCase()} SEM O MÉTODO CERTO...\n\nExpectativa: tudo rodando em 5 minutos.\nRealidade: 14 abas abertas, café frio e nenhuma postagem feita.\n\nQuem se identifica dá um like aqui! 👇 Mas sério: com a ${brandName}, esse fluxo fica leve e automatizado.\n\n${effectiveCta}${effectiveUrl}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Meme / Lightpost com Marca`,
      caption: memeCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1080,
      template_id: 'tpl-branded-meme',
      campaign_format: 'branded_meme_lightpost',
      is_reviewed: false,
      script_json: JSON.stringify({ memeType: 'relatable_business', punchline: name }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'meme', 'lightpost'],
      target_networks: ['instagram', 'twitter'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // 9. live_script_stream
  if (formatId === 'live_script_stream') {
    const liveCaption = `🔴 ROTEIRO MASTER PARA LIVE / WEBINAR (45 MINUTOS)\n\nTema: ${name}\n\n[00:00 - 05:00] ABERTURA: Recepção da audiência, perguntas de aquecimento no chat.\n[05:00 - 15:00] O PROBLEMA: Por que a maioria falha em ${briefing.slice(0, 80)}...\n[15:00 - 30:00] A ENTREGA: Os 3 pilares práticos e demonstração ao vivo.\n[30:00 - 40:00] PERGUNTAS & RESPOSTAS: Interação direta com os participantes.\n[40:00 - 45:00] PITCH & FECHAMENTO: ${effectiveCta}\n\n👉 Ative o lembrete para não perder!${effectiveUrl}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Roteiro Completo de Live`,
      caption: liveCaption,
      platform: 'YouTube',
      status: 'draft',
      duration: 2700,
      width: 1920,
      height: 1080,
      template_id: 'tpl-live-script',
      campaign_format: 'live_script_stream',
      is_reviewed: false,
      script_json: JSON.stringify({
        type: 'live_stream',
        durationMinutes: 45,
        structure: '5-10-15-10-5',
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'live', 'webinar'],
      target_networks: ['youtube', 'instagram', 'linkedin'],
      revision_count: 1,
      approval_level: 'Nível 1 (Em Revisão)',
      is_favorite: false,
      is_archived: false,
    }
  }

  // 10. collab_duo_post
  if (formatId === 'collab_duo_post') {
    const collabCaption = `🤝 POST COLABORATIVO (COLLAB DUO)\n\n${brandName} ✕ Parceiro Convidado\n\nQuando duas visões se unem em torno de ${name}, o resultado é multiplicação de alcance.\n\n${briefing}\n\n👉 Siga ambos os perfis para continuar acompanhando novidades conjuntas!\n\n${effectiveCta}${effectiveUrl}`

    return {
      user: userId,
      brand: brandId || null,
      campaign: campaignId,
      content: `[Campanha: ${name}] Post Colaborativo (Collab Duo)`,
      caption: collabCaption,
      platform: 'Instagram',
      status: 'draft',
      duration: 0,
      width: 1080,
      height: 1350,
      template_id: 'tpl-collab-duo',
      campaign_format: 'collab_duo_post',
      is_reviewed: false,
      script_json: JSON.stringify({
        isCollab: true,
        coAuthor: 'Parceiro Estratégico',
        brandA: brandName,
      }),
      tags: ['campanha', name.toLowerCase().replace(/\s+/g, '-'), 'collab', 'duo'],
      target_networks: ['instagram', 'linkedin'],
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
    campaign_format: 'feed',
    is_reviewed: false,
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
