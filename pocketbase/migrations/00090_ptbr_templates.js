/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const templatesCol = app.findCollectionByNameOrId('post_templates')
    if (!templatesCol) return

    // Busca usuário padrão existente para associar
    let defaultUserId = ''
    try {
      const existingUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (existingUser) {
        defaultUserId = existingUser.id
      }
    } catch {
      // continua sem falhar
    }

    if (!defaultUserId) {
      // Se não houver usuários cadastrados ainda, não falha
      return
    }

    const newTemplates = [
      {
        name: 'Carrossel de Dicas Práticas PT-BR',
        type: 'feed',
        category: 'educativo',
        network: 'all',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          grid: 'carousel-5-slides',
          headline: '5 Dicas Rápidas que Você Precisa Conhecer',
          subhead: 'Guia visual passo a passo para aplicar ainda hoje',
          slides: [
            { slide: 1, title: 'O Grande Erro', text: 'O que 90% das pessoas ignoram ao começar' },
            { slide: 2, title: 'Dica 1: Estrutura', text: 'Defina a base antes de acelerar' },
            {
              slide: 3,
              title: 'Dica 2: Consistência',
              text: 'Pequenos hábitos diários trazem resultado',
            },
            { slide: 4, title: 'Dica 3: Otimização', text: 'Ajuste conforme os dados reais' },
            {
              slide: 5,
              title: 'Resumo & Ação',
              text: 'Salve este post para consultar quando precisar!',
            },
          ],
          ctaText: 'Arraste para o lado e salve para depois 📌',
        },
        style_settings: {
          bgColor: '#0F172A',
          textColor: '#F8FAFC',
          accentColor: '#38BDF8',
          highlightColor: '#818CF8',
          fontFamily: 'Inter',
          gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          cardBg: 'rgba(255, 255, 255, 0.06)',
        },
      },
      {
        name: 'Bastidores e Processo Criativo',
        type: 'story',
        category: 'storytelling',
        network: 'all',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          grid: 'behind-the-scenes-story',
          headline: 'Nos Bastidores: Como Criamos Nossos Projetos',
          subhead: 'A realidade sem filtro do que acontece por trás das câmeras',
          badge: 'Bastidores Reais',
          ctaText: 'Quer ver mais do nosso dia a dia? Responda com 🔥',
        },
        style_settings: {
          bgColor: '#18181B',
          textColor: '#FAFAFA',
          accentColor: '#F59E0B',
          highlightColor: '#D97706',
          fontFamily: 'Poppins',
          gradient: 'linear-gradient(180deg, #18181B 0%, #27272A 100%)',
          cardBg: 'rgba(255, 255, 255, 0.08)',
        },
      },
      {
        name: 'Prova Social & Depoimento de Cliente',
        type: 'feed',
        category: 'autoridade',
        network: 'all',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          grid: 'testimonial-quote',
          headline: 'O resultado que nossos clientes celebram',
          subhead:
            '"Em apenas 30 dias de estratégia alinhada, dobramos nossos leads qualificados."',
          author: 'Mariana Silva · Diretora de Crescimento',
          rating: '⭐⭐⭐⭐⭐',
          ctaText: 'Deixe um comentário e descubra como aplicar no seu negócio!',
        },
        style_settings: {
          bgColor: '#0A0A0A',
          textColor: '#FFFFFF',
          accentColor: '#10B981',
          highlightColor: '#34D399',
          fontFamily: 'Inter',
          gradient: 'linear-gradient(135deg, #064E3B 0%, #0A0A0A 100%)',
          cardBg: 'rgba(255, 255, 255, 0.07)',
        },
      },
      {
        name: 'FAQ & Respostas às Dúvidas Frequentes',
        type: 'feed',
        category: 'educativo',
        network: 'all',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          grid: 'faq-split',
          headline: 'Perguntas Frequentes Respondidas',
          subhead: 'Tire suas principais dúvidas de forma direta e sem enrolação',
          questions: [
            { q: 'Serve para iniciantes?', a: 'Sim! Método validado passo a passo.' },
            { q: 'Quanto tempo preciso dedicar?', a: 'Apenas 20 minutos por dia.' },
            { q: 'Posso usar no celular?', a: 'Totalmente compatível e responsivo.' },
          ],
          ctaText: 'Ainda tem dúvidas? Mande sua pergunta nos comentários!',
        },
        style_settings: {
          bgColor: '#0F172A',
          textColor: '#F1F5F9',
          accentColor: '#6366F1',
          highlightColor: '#A855F7',
          fontFamily: 'Inter',
          gradient: 'linear-gradient(145deg, #0F172A 0%, #312E81 100%)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
        },
      },
      {
        name: 'Enquete e Interação da Audiência',
        type: 'story',
        category: 'engajamento',
        network: 'all',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          grid: 'poll-interactive-story',
          headline: 'Queremos Saber Sua Opinião!',
          subhead: 'Qual o maior desafio da sua rotina atual?',
          pollOptions: ['A) Falta de tempo', 'B) Ideias de conteúdo', 'C) Engajamento'],
          ctaText: 'Vote na enquete ou responda na caixinha abaixo 👇',
        },
        style_settings: {
          bgColor: '#1E1B4B',
          textColor: '#FFFFFF',
          accentColor: '#EC4899',
          highlightColor: '#F43F5E',
          fontFamily: 'Poppins',
          gradient: 'linear-gradient(180deg, #1E1B4B 0%, #4C0519 100%)',
          cardBg: 'rgba(255, 255, 255, 0.1)',
        },
      },
      {
        name: 'Promoção Exclusiva com CTA de Urgência',
        type: 'feed',
        category: 'promo',
        network: 'all',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          grid: 'promo-badge-bold',
          headline: 'Condição Especial por Tempo Limitado!',
          subhead: 'Garanta sua vaga com benefícios exclusivos até meia-noite',
          badgeText: 'ÚLTIMAS HORAS',
          ctaText: 'Clique no link da bio e garanta o seu cupom agora 🚀',
        },
        style_settings: {
          bgColor: '#111827',
          textColor: '#FFFFFF',
          accentColor: '#EF4444',
          highlightColor: '#F97316',
          fontFamily: 'Poppins',
          gradient: 'linear-gradient(135deg, #7F1D1D 0%, #111827 100%)',
          cardBg: 'rgba(255, 255, 255, 0.08)',
        },
      },
      {
        name: 'Lançamento de Produto / Grande Novidade',
        type: 'feed',
        category: 'promo',
        network: 'all',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          grid: 'launch-spotlight',
          headline: 'O Grande Lançamento que Você Estava Esperando',
          subhead: 'Apresentamos uma nova forma de transformar sua presença digital',
          features: ['Inovação real', 'Simplicidade total', 'Resultados acelerados'],
          ctaText: 'Comente "EU QUERO" para receber o acesso antecipado!',
        },
        style_settings: {
          bgColor: '#030712',
          textColor: '#F9FAFB',
          accentColor: '#8B5CF6',
          highlightColor: '#06B6D4',
          fontFamily: 'Poppins',
          gradient: 'linear-gradient(135deg, #030712 0%, #1E1B4B 50%, #0F172A 100%)',
          cardBg: 'rgba(255, 255, 255, 0.07)',
        },
      },
    ]

    for (const tpl of newTemplates) {
      // Idempotência: verifica se já existe template com o mesmo nome
      try {
        const existing = app.findFirstRecordByFilter('post_templates', `name = "${tpl.name}"`)
        if (existing) {
          // Atualiza dados se já existe
          existing.set('type', tpl.type)
          existing.set('category', tpl.category)
          existing.set('network', tpl.network)
          existing.set('aspect_ratio', tpl.aspect_ratio)
          existing.set('dimensions', tpl.dimensions)
          existing.set('is_shared', tpl.is_shared)
          existing.set('layout_data', tpl.layout_data)
          existing.set('style_settings', tpl.style_settings)
          app.save(existing)
          continue
        }
      } catch {
        // não encontrado, pode criar
      }

      const record = new Record(templatesCol)
      record.set('user', defaultUserId)
      record.set('name', tpl.name)
      record.set('type', tpl.type)
      record.set('category', tpl.category)
      record.set('network', tpl.network)
      record.set('aspect_ratio', tpl.aspect_ratio)
      record.set('dimensions', tpl.dimensions)
      record.set('is_shared', tpl.is_shared)
      record.set('is_favorite', tpl.is_favorite)
      record.set('layout_data', tpl.layout_data)
      record.set('style_settings', tpl.style_settings)
      app.save(record)
    }
  },
  (app) => {
    // down (idempotente)
    const names = [
      'Carrossel de Dicas Práticas PT-BR',
      'Bastidores e Processo Criativo',
      'Prova Social & Depoimento de Cliente',
      'FAQ & Respostas às Dúvidas Frequentes',
      'Enquete e Interação da Audiência',
      'Promoção Exclusiva com CTA de Urgência',
      'Lançamento de Produto / Grande Novidade',
    ]
    for (const name of names) {
      try {
        const record = app.findFirstRecordByFilter('post_templates', `name = "${name}"`)
        if (record) {
          app.delete(record)
        }
      } catch {
        // ignore
      }
    }
  },
)
