import type { InspirationCard, UpcomingDate, CarouselItem } from '@/types/gamification'

export const AI_SUGGESTIONS: InspirationCard[] = [
  {
    id: 's1',
    title: 'Reels de Bastidores: Como Criamos o Produto',
    description:
      'Mostre o processo de criação do seu produto em um reels de 30 segundos. Alto engajamento garantido.',
    status: 'Tendência',
    category: 'Ideias da IA',
    imageUrl: 'https://img.usecurling.com/p/400/500?q=behind%20scenes%20creative&color=purple',
    platform: 'Instagram',
    trendScore: 92,
  },
  {
    id: 's2',
    title: 'Tutorial Rápido: 3 Dicas de Produtividade',
    description: 'Compartilhe 3 dicas rápidas que seu público pode aplicar hoje mesmo.',
    status: 'Oportunidade',
    category: 'Ideias da IA',
    imageUrl: 'https://img.usecurling.com/p/400/500?q=productivity%20tips&color=blue',
    platform: 'TikTok',
    trendScore: 78,
  },
  {
    id: 's3',
    title: 'Dia do Estudante: Conteúdo Educativo',
    description: 'Aproveite o Dia do Estudante para criar conteúdo motivacional e educativo.',
    status: 'Tendência',
    category: 'Datas Comemorativas',
    imageUrl: 'https://img.usecurling.com/p/400/500?q=student%20study&color=green',
    platform: 'Instagram',
    trendScore: 85,
  },
  {
    id: 's4',
    title: 'Dia da Mulher: Homenagem a Clientes',
    description:
      'Crie uma campanha homenageando suas clientes mulheres. Ideal para fortalecer laços.',
    status: 'Oportunidade',
    category: 'Datas Comemorativas',
    imageUrl: 'https://img.usecurling.com/p/400/500?q=women%20empowerment&color=pink',
    platform: 'Instagram',
    trendScore: 88,
  },
  {
    id: 's5',
    title: 'Blog como Fonte: Como Repurpose Conteúdo',
    description: 'Transforme artigos do seu blog em posts para redes sociais.',
    status: 'Oportunidade',
    category: 'Fontes',
    imageUrl: 'https://img.usecurling.com/p/400/500?q=blog%20writing&color=orange',
    platform: 'LinkedIn',
    trendScore: 65,
  },
  {
    id: 's6',
    title: 'Podcast Trends: Temas em Alta',
    description: 'Use temas de podcasts populares como inspiração para seus próximos posts.',
    status: 'Tendência',
    category: 'Fontes',
    imageUrl: 'https://img.usecurling.com/p/400/500?q=podcast%20microphone&color=red',
    platform: 'YouTube',
    trendScore: 72,
  },
]

export const UPCOMING_DATES: UpcomingDate[] = [
  {
    id: 'd1',
    date: '11 de Agosto',
    title: 'Dia do Estudante',
    description: 'Excelente data para conteúdo educacional e motivacional voltado para estudantes.',
    daysUntil: 12,
    emoji: '📚',
  },
  {
    id: 'd2',
    date: '25 de Agosto',
    title: 'Dia do Soldado',
    description: 'Homenagem aos heróis. Conecte com valores de coragem e dedicação.',
    daysUntil: 26,
    emoji: '🎖️',
  },
  {
    id: 'd3',
    date: '7 de Setembro',
    title: 'Independência do Brasil',
    description:
      'Data pátria perfeita para conteúdos com identidade nacional e promoções especiais.',
    daysUntil: 39,
    emoji: '🇧🇷',
  },
  {
    id: 'd4',
    date: '12 de Outubro',
    title: 'Dia das Crianças',
    description: 'Crie conteúdo lúdico e divertido. Ideal para marcas com público familiar.',
    daysUntil: 74,
    emoji: '🧸',
  },
]

export const SOCI_TIP = {
  title: 'Dica do SOCI',
  content:
    'Use carrosséis com 5-7 slides para aumentar o tempo de permanência no post. Posts com carrossel têm 3x mais engajamento que posts únicos!',
}

export const CAROUSELS: Array<{ id: string; title: string; items: CarouselItem[] }> = [
  {
    id: 'carousel1',
    title: 'Em Alta Esta Semana',
    items: [
      {
        id: 'ci1',
        title: 'Micro-vídeos de rotina matinal',
        imageUrl: 'https://img.usecurling.com/p/300/400?q=morning%20routine',
        category: 'Lifestyle',
      },
      {
        id: 'ci2',
        title: 'Tutoriais de 30 segundos',
        imageUrl: 'https://img.usecurling.com/p/300/400?q=tutorial%20video',
        category: 'Educação',
      },
      {
        id: 'ci3',
        title: 'Antes e Depois',
        imageUrl: 'https://img.usecurling.com/p/300/400?q=before%20after',
        category: 'Transformação',
      },
      {
        id: 'ci4',
        title: 'Dicas rápidas de produtividade',
        imageUrl: 'https://img.usecurling.com/p/300/400?q=productivity',
        category: 'Dicas',
      },
      {
        id: 'ci5',
        title: 'Bastidores do negócio',
        imageUrl: 'https://img.usecurling.com/p/300/400?q=business%20behind%20scenes',
        category: 'Bastidores',
      },
    ],
  },
  {
    id: 'carousel2',
    title: 'Tendências por Categoria',
    items: [
      {
        id: 'ci6',
        title: 'ASMR e áudios relaxantes',
        imageUrl: 'https://img.usecurling.com/p/300/400?q=asmr%20relaxing',
        category: 'Entretenimento',
      },
      {
        id: 'ci7',
        title: 'Desafios virais do momento',
        imageUrl: 'https://img.usecurling.com/p/300/400?q=viral%20challenge',
        category: 'Viral',
      },
      {
        id: 'ci8',
        title: 'Reviews de produtos',
        imageUrl: 'https://img.usecurling.com/p/300/400?q=product%20review',
        category: 'Reviews',
      },
      {
        id: 'ci9',
        title: 'Storytelling pessoal',
        imageUrl: 'https://img.usecurling.com/p/300/400?q=storytelling',
        category: 'Storytelling',
      },
      {
        id: 'ci10',
        title: 'Conteúdo interativo',
        imageUrl: 'https://img.usecurling.com/p/300/400?q=interactive%20content',
        category: 'Interativo',
      },
    ],
  },
]
