migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('post_templates')
    // Busca usuário admin ou o primeiro usuário da base de forma segura
    let ownerUser = null
    try {
      ownerUser = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
    } catch (_) {}

    if (!ownerUser) {
      try {
        const users = app.findRecordsByFilter('_pb_users_auth_', 'id != ""', '-created', 1)
        if (users && users.length > 0) ownerUser = users[0]
      } catch (_) {}
    }

    if (!ownerUser) return

    // Novos modelos de alta conversão multirrede (~12 modelos cobrindo Instagram, Facebook, LinkedIn, WhatsApp, TikTok, YouTube, X)
    const newTemplates = [
      // 1. Instagram Pergunta da Semana (Engajamento forte)
      {
        name: 'Instagram Pergunta da Semana',
        network: 'instagram',
        category: 'engajamento',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'poll-question',
          headline: 'Qual é o maior gargalo no seu negócio hoje?',
          subhead: 'A) Falta de tempo  B) Atração de clientes  C) Gestão da equipe  D) Vendas',
          badge: 'DEBATE DA SEMANA',
          ctaText: 'Responda com a sua letra nos comentários 👇',
        },
        style_settings: {
          bgColor: '#0F172A',
          accentColor: '#8B5CF6',
          ctaColor: '#A855F7',
          textColor: '#FFFFFF',
          badgeText: 'ENQUETE EXCLUSIVA',
          cardBg: 'rgba(255, 255, 255, 0.07)',
          gradient: 'linear-gradient(135deg, #0F172A 0%, #3B0764 100%)',
        },
      },
      // 2. Instagram Lista de Benefícios (Conversão direta)
      {
        name: 'Instagram Lista de Benefícios',
        network: 'instagram',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'bullet-benefits',
          headline: '5 Motivos Pelos Quais Nossos Clientes Dobram de Faturamento',
          subhead:
            '• Automação inteligente\n• Postagens consistentes\n• Copy persuasiva\n• Análise em tempo real\n• Suporte humanizado',
          badge: 'ALTA CONVERSÃO',
          ctaText: 'Envie EU QUERO no direct para começar',
        },
        style_settings: {
          bgColor: '#0A0E1A',
          accentColor: '#10B981',
          ctaColor: '#059669',
          textColor: '#FFFFFF',
          badgeText: 'RESULTADOS',
          cardBg: 'rgba(16, 185, 129, 0.08)',
          gradient: 'linear-gradient(135deg, #0A0E1A 0%, #064E3B 100%)',
        },
      },
      // 3. Instagram Carrossel Educativo Slide 1 Gancho
      {
        name: 'Instagram Carrossel Gancho Magnético',
        network: 'instagram',
        category: 'educativo',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'carousel-hook-cover',
          headline: 'O Erro Silencioso Que Está Travando o Alcance do Seu Perfil',
          subhead: 'Arraste para o lado e veja como corrigir isso em menos de 10 minutos.',
          badge: 'GUIA PRÁTICO',
          ctaText: 'Arraste para o lado 👉',
        },
        style_settings: {
          bgColor: '#18181B',
          accentColor: '#EC4899',
          ctaColor: '#F43F5E',
          textColor: '#FFFFFF',
          badgeText: 'SLIDE 1/5',
          cardBg: 'rgba(236, 72, 153, 0.1)',
          gradient: 'linear-gradient(135deg, #18181B 0%, #4C0519 100%)',
        },
      },
      // 4. Facebook Memes Relacionáveis & Humanização
      {
        name: 'Facebook Memes Relacionáveis & Dia a Dia',
        network: 'facebook',
        category: 'engajamento',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'relatable-quote',
          headline: '"Eu prometendo que vou postar todos os dias às 18h..."',
          subhead: 'Quem mais começa a semana com metas ambiciosas e termina procurando socorro?',
          badge: 'VIDA DE EMPREENDEDOR',
          ctaText: 'Marque aquele amigo que vive essa mesma rotina',
        },
        style_settings: {
          bgColor: '#0F172A',
          accentColor: '#3B82F6',
          ctaColor: '#2563EB',
          textColor: '#FFFFFF',
          badgeText: 'IDENTIFICAÇÃO',
          cardBg: 'rgba(59, 130, 246, 0.1)',
          gradient: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
        },
      },
      // 5. Facebook Oferta da Semana / Cupom Especial
      {
        name: 'Facebook Oferta da Semana com Cupom',
        network: 'facebook',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'coupon-promo',
          headline: 'CONDIÇÃO ESPECIAL: 30% OFF PARA NOVOS ASSINANTES',
          subhead: 'Use o cupom SOCIAL30 no checkout e garanta sua licença anual pelo menor valor.',
          badge: 'CUPOM EXCLUSIVO',
          ctaText: 'Toque em Saiba Mais e aproveite',
        },
        style_settings: {
          bgColor: '#1A0B10',
          accentColor: '#F59E0B',
          ctaColor: '#D97706',
          textColor: '#FFFFFF',
          badgeText: 'VÁLIDO HOJE',
          cardBg: 'rgba(245, 158, 11, 0.1)',
          gradient: 'linear-gradient(135deg, #1A0B10 0%, #78350F 100%)',
        },
      },
      // 6. LinkedIn Carrossel de Insights / Framework Estratégico
      {
        name: 'LinkedIn Carrossel de Insights Estratégicos',
        network: 'linkedin',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1080x608',
        layout_data: {
          grid: 'b2b-framework-insights',
          headline: 'O Framework de 3 Pilares Para Escalar Operações Sem Aumentar o Burnout',
          subhead:
            'Insights colhidos após conversar com mais de 50 gestores de marketing este mês.',
          badge: 'ESTUDO EXECUTIVO',
          ctaText: 'Salve este documento em PDF para consulta futura',
        },
        style_settings: {
          bgColor: '#061325',
          accentColor: '#0A66C2',
          ctaColor: '#38BDF8',
          textColor: '#FFFFFF',
          badgeText: 'B2B INSIGHTS',
          cardBg: 'rgba(10, 102, 194, 0.12)',
          gradient: 'linear-gradient(135deg, #061325 0%, #0F2942 100%)',
        },
      },
      // 7. LinkedIn Contratação & Vaga em Aberto (Employer Branding)
      {
        name: 'LinkedIn Vaga Aberta e Oportunidade',
        network: 'linkedin',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'job-opening',
          headline: 'ESTAMOS CONTRATANDO: Venha Fazer Parte da Nossa Equipe',
          subhead:
            'Procuramos profissionais movidos por inovação, tecnologia e foco no cliente. Modelo 100% remoto.',
          badge: 'WE ARE HIRING',
          ctaText: 'Envie seu portfólio pelo link nos comentários',
        },
        style_settings: {
          bgColor: '#0F172A',
          accentColor: '#6366F1',
          ctaColor: '#818CF8',
          textColor: '#FFFFFF',
          badgeText: 'OPORTUNIDADE',
          cardBg: 'rgba(99, 102, 241, 0.1)',
          gradient: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
        },
      },
      // 8. WhatsApp Catálogo Semanal de Produtos / Destaques
      {
        name: 'WhatsApp Catálogo Semanal e Novidades',
        network: 'whatsapp',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '1.87:1',
        dimensions: '1125x600',
        layout_data: {
          grid: 'wa-catalog-highlight',
          headline: 'NOVIDADES DA SEMANA CHEGARAM AO NOSSO CATÁLOGO',
          subhead:
            'Peças exclusivas e estoque limitado. Responda esta mensagem para receber a lista de preços.',
          badge: 'CATÁLOGO ATUALIZADO',
          ctaText: 'Peça seu catálogo em PDF aqui',
        },
        style_settings: {
          bgColor: '#04221A',
          accentColor: '#25D366',
          ctaColor: '#10B981',
          textColor: '#FFFFFF',
          badgeText: 'LISTA VIP WHATSAPP',
          cardBg: 'rgba(37, 211, 102, 0.1)',
          gradient: 'linear-gradient(135deg, #04221A 0%, #064E3B 100%)',
        },
      },
      // 9. WhatsApp Aviso Importante de Horário / Recesso
      {
        name: 'WhatsApp Comunicado Oficial e Horários',
        network: 'whatsapp',
        category: 'engajamento',
        type: 'feed',
        aspect_ratio: '1.87:1',
        dimensions: '1125x600',
        layout_data: {
          grid: 'wa-official-notice',
          headline: 'COMUNICADO IMPORTANTE: ATUALIZAÇÃO DE HORÁRIOS',
          subhead: 'Confira nossos canais de atendimento e horários especiais para esta semana.',
          badge: 'COMUNICADO OFICIAL',
          ctaText: 'Dúvidas? Fale com nossa equipe de suporte',
        },
        style_settings: {
          bgColor: '#091E16',
          accentColor: '#14B8A6',
          ctaColor: '#0D9488',
          textColor: '#F0FDFA',
          badgeText: 'INFORMATIVO',
          cardBg: 'rgba(20, 184, 166, 0.1)',
          gradient: 'linear-gradient(135deg, #091E16 0%, #042F2E 100%)',
        },
      },
      // 10. TikTok Desafio / Trend / POV Viral
      {
        name: 'TikTok Desafio e Tendência Viral',
        network: 'tiktok',
        category: 'storytelling',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'tiktok-trend-pov',
          headline: 'POV: Quando você descobre que dava para fazer isso em 3 cliques',
          subhead:
            'O tutorial mais rápido da internet para você nunca mais perder tempo criando artes do zero.',
          badge: 'TREND DO MOMENTO',
          ctaText: 'Siga para mais hacks diários 🔥',
        },
        style_settings: {
          bgColor: '#000000',
          accentColor: '#00F2FE',
          ctaColor: '#FE2C55',
          textColor: '#FFFFFF',
          badgeText: 'VIRAL TREND',
          cardBg: 'rgba(0, 242, 254, 0.08)',
          gradient: 'linear-gradient(180deg, #000000 0%, #160D27 100%)',
        },
      },
      // 11. YouTube Miniatura Tutorial / Como Fazer Passo a Passo
      {
        name: 'YouTube Miniatura Tutorial Passo a Passo',
        network: 'youtube',
        category: 'educativo',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1280x720',
        layout_data: {
          grid: 'yt-tutorial-thumb',
          headline: 'COMO CRIAR 30 DIAS DE CONTEÚDO EM 1 HORA COM IA',
          subhead: 'Passo a passo definitivo para iniciantes e avançados. Sem enrolação!',
          badge: 'TUTORIAL COMPLETO',
          ctaText: 'Assista ao vídeo agora ▶',
        },
        style_settings: {
          bgColor: '#0A0A0A',
          accentColor: '#EF4444',
          ctaColor: '#DC2626',
          textColor: '#FFFFFF',
          badgeText: 'AULA GRÁTIS',
          cardBg: 'rgba(239, 68, 68, 0.12)',
          gradient: 'linear-gradient(135deg, #0A0A0A 0%, #350808 100%)',
        },
      },
      // 12. X / Twitter Enquete Visual e Thread Starter
      {
        name: 'X Enquete Visual e Abertura de Thread',
        network: 'twitter',
        category: 'storytelling',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1200x675',
        layout_data: {
          grid: 'x-thread-starter',
          headline: '10 Lições Que Nenhuma Faculdade de Marketing Vai Te Ensinar',
          subhead:
            'Um resumo brutalmente honesto sobre posicionamento, branding e retenção de público. Segue o fio 🧵👇',
          badge: 'THREAD ESTRATÉGICA',
          ctaText: 'Retweete se você concorda 🔄',
        },
        style_settings: {
          bgColor: '#09090B',
          accentColor: '#A1A1AA',
          ctaColor: '#E4E4E7',
          textColor: '#FFFFFF',
          badgeText: 'THREAD COMPLETA',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          gradient: 'linear-gradient(135deg, #09090B 0%, #18181B 100%)',
        },
      },
    ]

    for (let i = 0; i < newTemplates.length; i++) {
      const item = newTemplates[i]
      try {
        app.findFirstRecordByFilter(
          'post_templates',
          `name = "${item.name}" && network = "${item.network}"`,
        )
      } catch (_) {
        const record = new Record(col)
        record.set('user', ownerUser.id)
        record.set('name', item.name)
        record.set('network', item.network)
        record.set('category', item.category)
        record.set('type', item.type)
        record.set('aspect_ratio', item.aspect_ratio)
        record.set('dimensions', item.dimensions)
        record.set('is_shared', true)
        record.set('is_favorite', false)
        record.set('layout_data', JSON.stringify(item.layout_data))
        record.set('style_settings', JSON.stringify(item.style_settings))
        app.save(record)
      }
    }
  },
  (app) => {
    // Revert opcional
  },
)
