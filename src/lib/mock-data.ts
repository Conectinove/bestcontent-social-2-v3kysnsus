import { Brand, Post, IdeaCard, NotificationItem, UserProfile } from '@/types'

export const INITIAL_USER: UserProfile = {
  id: 'usr-101',
  name: 'Juliana Costa',
  email: 'juliana@bestcontent.app',
  avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=88',
  plan: 'Pro Plan',
}

export const INITIAL_BRANDS: Brand[] = [
  {
    id: 'brand-1',
    name: 'Aura Skincare',
    logo: 'https://img.usecurling.com/p/200/200?q=skincare%20logo&color=pink',
    coverImage: 'https://img.usecurling.com/p/800/400?q=cosmetics%20beauty',
    description: 'Marca de cosméticos orgânicos e sustentáveis focada no brilho natural.',
    handles: {
      instagram: '@auraskincare.br',
      tiktok: '@auraskincare',
      youtube: 'AuraSkincareOficial',
    },
    stats: {
      postsThisWeek: 12,
      engagementRate: '4.8%',
      followers: '45.2K',
    },
  },
  {
    id: 'brand-2',
    name: 'Urban Coffee Co.',
    logo: 'https://img.usecurling.com/p/200/200?q=coffee%20cup%20logo&color=black',
    coverImage: 'https://img.usecurling.com/p/800/400?q=coffee%20shop',
    description: 'Cafés especiais garimpados de pequenos produtores do Brasil.',
    handles: {
      instagram: '@urbancoffeeco',
      tiktok: '@urbancoffeetips',
      twitter: '@urbancoffee',
    },
    stats: {
      postsThisWeek: 8,
      engagementRate: '5.2%',
      followers: '28.9K',
    },
  },
  {
    id: 'brand-3',
    name: 'FitFlow Tech',
    logo: 'https://img.usecurling.com/p/200/200?q=fitness%20app%20logo&color=cyan',
    coverImage: 'https://img.usecurling.com/p/800/400?q=fitness%20workout',
    description: 'Ecossistema de saúde e fitness digital com acompanhamento com IA.',
    handles: {
      instagram: '@fitflow.tech',
      linkedin: 'fitflow-tech',
      youtube: 'FitFlowChannel',
    },
    stats: {
      postsThisWeek: 15,
      engagementRate: '6.1%',
      followers: '89.4K',
    },
  },
]

export const INITIAL_IDEAS: IdeaCard[] = [
  {
    id: 'idea-1',
    source: 'Instagram',
    title: 'Trend de Micro-rotinas da Manhã',
    snippet: 'Vídeos curtos mostram 3 passos simples para começar o dia com foco e pele radiante.',
    thumbnail: 'https://img.usecurling.com/p/400/300?q=morning%20routine',
    likesCount: 342,
    category: 'Trending',
    brandId: 'brand-1',
  },
  {
    id: 'idea-2',
    source: 'TikTok',
    title: 'Desafio "Como é feito": Bastidores do Café',
    snippet:
      'Mostrar a torra dos grãos de café em vídeo de 15 segundos com áudio em alta no TikTok.',
    thumbnail: 'https://img.usecurling.com/p/400/300?q=coffee%20beans',
    likesCount: 512,
    category: 'Ideias',
    brandId: 'brand-2',
  },
  {
    id: 'idea-3',
    source: 'Blog',
    title: 'Guia de Proteção Solar Urbana para 2025',
    snippet: 'Novo estudo mostra crescimento no interesse por protetor solar com luz azul.',
    thumbnail: 'https://img.usecurling.com/p/400/300?q=sunscreen%20beauty',
    likesCount: 189,
    category: 'Notícias',
    brandId: 'brand-1',
  },
  {
    id: 'idea-4',
    source: 'Twitter',
    title: 'Debate: Treinos de 20 minutos realmente funcionam?',
    snippet:
      'Tweet viral de especialista em fisiologia biomecânica acumula mais de 2M de impressões.',
    thumbnail: 'https://img.usecurling.com/p/400/300?q=gym%20workout',
    likesCount: 820,
    category: 'Trending',
    brandId: 'brand-3',
  },
  {
    id: 'idea-5',
    source: 'Notícias',
    title: 'Consumo de Cafés Especiais cresce 35% na América Latina',
    snippet: 'Relatório setorial indica mudança nos hábitos da geração Z para bebidas funcionais.',
    thumbnail: 'https://img.usecurling.com/p/400/300?q=espresso%20cup',
    likesCount: 145,
    category: 'Notícias',
    brandId: 'brand-2',
  },
]

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    brandId: 'brand-1',
    platform: 'instagram',
    contentType: 'reel',
    caption:
      'Sua pele precisa de hidratação profunda no inverno! Conheça nosso Sérum Glowing Nectar 🌱✨ #AuraSkincare #PeleSaudavel',
    mediaUrls: ['https://img.usecurling.com/p/500/500?q=skincare%20serum'],
    status: 'scheduled',
    scheduledDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    hashtags: ['#Skincare', '#BrilhoNatural', '#Sustentavel'],
  },
  {
    id: 'post-2',
    brandId: 'brand-2',
    platform: 'tiktok',
    contentType: 'post',
    caption:
      'O segredo de um espresso com cremosidade perfeita está na moagem na hora! ☕🔥 #CoffeeLovers #BaristaLife',
    mediaUrls: ['https://img.usecurling.com/p/500/500?q=latte%20art'],
    status: 'scheduled',
    scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    hashtags: ['#Cafedamanha', '#Especialidade'],
  },
  {
    id: 'post-3',
    brandId: 'brand-3',
    platform: 'instagram',
    contentType: 'carousel',
    caption:
      '5 exercícios práticos para fazer na cadeira do escritório e aliviar as dores nas costas 🧘‍♂️💪',
    mediaUrls: ['https://img.usecurling.com/p/500/500?q=stretching%20office'],
    status: 'published',
    publishedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    engagement: { likes: 1240, comments: 89, shares: 230 },
    hashtags: ['#SaudeCorporativa', '#FitFlow'],
  },
]

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Post Agendado',
    message: 'Seu post "Sérum Glowing Nectar" está agendado para amanhã às 10:00.',
    time: 'Há 15 min',
    read: false,
    type: 'post',
  },
  {
    id: 'notif-2',
    title: 'IA BestContent',
    message: 'Novas 5 ideias de conteúdo geradas para a marca Aura Skincare.',
    time: 'Há 2 horas',
    read: false,
    type: 'ai',
  },
  {
    id: 'notif-3',
    title: 'Atualização da Plataforma',
    message: 'Integração direta com o TikTok Reels já disponível!',
    time: 'Ontem',
    read: true,
    type: 'system',
  },
]
