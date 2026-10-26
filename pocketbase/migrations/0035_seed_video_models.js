migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('post_templates')

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

    // 12 novos modelos de vídeo cobrindo Reels, TikTok, YouTube Shorts, Facebook e LinkedIn
    const videoTemplates = [
      {
        name: 'Tutorial Rápido em 3 Passos',
        network: 'instagram',
        category: 'educativo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-tutorial-quick',
          headline: 'Aprenda Este Hack em Menos de 30 Segundos',
          subhead:
            'Passo 1: Defina o foco · Passo 2: Aplique o método · Passo 3: Colha os resultados.',
          badge: 'TUTORIAL 9:16',
          ctaText: 'Salva para não esquecer 📌',
          video_meta: {
            duration: 30,
            hook: 'Pare de perder tempo com isso agora mesmo!',
            beats: [
              '0-3s: Gancho magnético na tela com texto em destaque',
              '3-12s: O erro comum que quase todo mundo comete',
              '12-24s: A solução em 3 passos práticos na tela',
              '24-30s: Chamada final para salvar e comentar',
            ],
          },
        },
        style_settings: {
          bgColor: '#0B0F19',
          accentColor: '#8B5CF6',
          ctaColor: '#A855F7',
          textColor: '#FFFFFF',
          badgeText: 'TUTORIAL RÁPIDO',
          cardBg: 'rgba(139, 92, 246, 0.12)',
          gradient: 'linear-gradient(180deg, #0B0F19 0%, #1E1B4B 100%)',
        },
      },
      {
        name: 'Antes e Depois Transformação Dinâmica',
        network: 'tiktok',
        category: 'autoridade',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-before-after',
          headline: 'O Que Aconteceu Quando Mudamos Esse Detalhe...',
          subhead: 'Veja a evolução quadro a quadro de um caso real de cliente.',
          badge: 'TRANSFORMAÇÃO REAL',
          ctaText: 'Clique no link da bio para transformar o seu',
          video_meta: {
            duration: 25,
            hook: 'Você não vai acreditar como isso estava antes...',
            beats: [
              '0-3s: Close no problema com expressão de surpresa',
              '3-10s: Cenas do "Antes" com números ou situação caótica',
              '10-14s: A virada de chave / o método aplicado',
              '14-22s: O "Depois" com estética impecável e resultados',
              '22-25s: Proposta de valor e link na bio',
            ],
          },
        },
        style_settings: {
          bgColor: '#000000',
          accentColor: '#10B981',
          ctaColor: '#059669',
          textColor: '#FFFFFF',
          badgeText: 'ANTES & DEPOIS',
          cardBg: 'rgba(16, 185, 129, 0.12)',
          gradient: 'linear-gradient(180deg, #000000 0%, #064E3B 100%)',
        },
      },
      {
        name: 'Depoimento de Cliente em Vídeo (UGC)',
        network: 'instagram',
        category: 'autoridade',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-testimonial-ugc',
          headline: '"Eu quase desisti, até encontrar essa solução"',
          subhead: 'Depoimento autêntico gravado no celular por quem já usa todos os dias.',
          badge: 'PROVA SOCIAL REAL',
          ctaText: 'Envie EU QUERO no direct para tirar dúvidas',
          video_meta: {
            duration: 45,
            hook: 'Eu preciso te contar o que aconteceu depois de 14 dias...',
            beats: [
              '0-5s: Declaração sincera com impacto emocional',
              '5-18s: Qual dor enfrentava antes da solução',
              '18-35s: A experiência real e os ganhos obtidos',
              '35-45s: Recomendação calorosa para quem está em dúvida',
            ],
          },
        },
        style_settings: {
          bgColor: '#0F172A',
          accentColor: '#F59E0B',
          ctaColor: '#D97706',
          textColor: '#FFFFFF',
          badgeText: 'DEPOIMENTO VIP',
          cardBg: 'rgba(245, 158, 11, 0.12)',
          gradient: 'linear-gradient(180deg, #0F172A 0%, #451A03 100%)',
        },
      },
      {
        name: 'Tour pelo Negócio & Espaço Físico',
        network: 'instagram',
        category: 'storytelling',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-business-tour',
          headline: 'Conheça Cada Cantinho do Nosso Espaço',
          subhead: 'Um passeio imersivo pela nossa estrutura para você se sentir em casa.',
          badge: 'TOUR EXCLUSIVO',
          ctaText: 'Venha tomar um café conosco essa semana ☕',
          video_meta: {
            duration: 35,
            hook: 'Já imaginou como é trabalhar aqui dentro?',
            beats: [
              '0-4s: Entrada elegante e recepção com sorriso',
              '4-15s: Estação de trabalho, detalhes e equipamentos',
              '15-25s: A equipe em ação com clima acolhedor',
              '25-35s: Convite carinhoso para visita ou agendamento',
            ],
          },
        },
        style_settings: {
          bgColor: '#172554',
          accentColor: '#38BDF8',
          ctaColor: '#0284C7',
          textColor: '#FFFFFF',
          badgeText: 'TOUR VIRTUAL',
          cardBg: 'rgba(56, 189, 248, 0.12)',
          gradient: 'linear-gradient(180deg, #172554 0%, #1E1B4B 100%)',
        },
      },
      {
        name: 'Perguntas Frequentes (FAQ) Dinâmico',
        network: 'youtube',
        category: 'educativo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-faq-shorts',
          headline: 'Respondendo a Dúvida que Mais Chega na Caixa de Entrada',
          subhead: 'Esclarecimento rápido, prático e sem letras miúdas.',
          badge: 'FAQ DIRETO AO PONTO',
          ctaText: 'Qual a sua próxima dúvida? Deixe nos comentários',
          video_meta: {
            duration: 30,
            hook: 'Todo dia alguém me pergunta isso na caixinha...',
            beats: [
              '0-4s: Leitura do sticker de pergunta ou balão na tela',
              '4-18s: Resposta clara com analogia simples do dia a dia',
              '18-26s: Dica extra que quase ninguém ensina',
              '26-30s: CTA para mandar a próxima pergunta',
            ],
          },
        },
        style_settings: {
          bgColor: '#18181B',
          accentColor: '#EF4444',
          ctaColor: '#DC2626',
          textColor: '#FFFFFF',
          badgeText: 'FAQ SHORTS',
          cardBg: 'rgba(239, 68, 68, 0.12)',
          gradient: 'linear-gradient(180deg, #18181B 0%, #450A0A 100%)',
        },
      },
      {
        name: 'Trend com Áudio do Momento & Dublagem',
        network: 'tiktok',
        category: 'engajamento',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-trending-audio',
          headline: 'Quando o Cliente Pede Algo Para Ontem...',
          subhead: 'Humor corporativo sincronizado com o áudio que está viralizando esta semana.',
          badge: 'TREND VIRAL',
          ctaText: 'Usa esse áudio antes que saia do topo 🔥',
          video_meta: {
            duration: 15,
            hook: 'Pov: Sexta-feira 17h59...',
            beats: [
              '0-3s: Expressão congelada e texto contextual',
              '3-10s: Sincronização labial com o áudio em alta',
              '10-15s: Punchline hilária e reação final',
            ],
          },
        },
        style_settings: {
          bgColor: '#000000',
          accentColor: '#00F2FE',
          ctaColor: '#FE2C55',
          textColor: '#FFFFFF',
          badgeText: 'ÁUDIO EM ALTA',
          cardBg: 'rgba(0, 242, 254, 0.12)',
          gradient: 'linear-gradient(180deg, #000000 0%, #160D27 100%)',
        },
      },
      {
        name: 'Bastidores da Produção & Empacotamento',
        network: 'instagram',
        category: 'storytelling',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-behind-packaging',
          headline: 'Embalando um Pedido Muito Especial',
          subhead: 'Cuidado nos mínimos detalhes: do bilhete à fita perfumada.',
          badge: 'BASTIDORES ASMR',
          ctaText: 'Faça seu pedido hoje para receber ainda essa semana',
          video_meta: {
            duration: 35,
            hook: 'Vem ver o carinho que colocamos em cada caixinha...',
            beats: [
              '0-4s: Close na etiqueta do cliente e na caixa aberta',
              '4-15s: Colocando os produtos com som agradável (ASMR)',
              '15-25s: Escrita à mão do bilhete e brinde surpresa',
              '25-35s: Fechamento com fita e carimbo oficial',
            ],
          },
        },
        style_settings: {
          bgColor: '#2E1065',
          accentColor: '#C084FC',
          ctaColor: '#9333EA',
          textColor: '#FFFFFF',
          badgeText: 'ASMR PACKING',
          cardBg: 'rgba(192, 132, 252, 0.12)',
          gradient: 'linear-gradient(180deg, #2E1065 0%, #1E1B4B 100%)',
        },
      },
      {
        name: 'Lançamento de Produto em Vídeo Teaser',
        network: 'instagram',
        category: 'promo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-product-launch',
          headline: 'Ele Finalmente Chegou. Conheça a Nova Versão.',
          subhead: 'Cortes rápidos, iluminação cinematográfica e detalhes nunca antes vistos.',
          badge: 'LANÇAMENTO OFICIAL',
          ctaText: 'Toque para garantir o valor promocional de estreia',
          video_meta: {
            duration: 20,
            hook: 'Você pediu, nós criamos.',
            beats: [
              '0-3s: Silhueta no escuro e luz ascendente',
              '3-10s: Macro nos detalhes, texturas e acabamento',
              '10-16s: O produto em uso real com resultado visível',
              '16-20s: Preço especial de estreia e link na tela',
            ],
          },
        },
        style_settings: {
          bgColor: '#09090B',
          accentColor: '#F43F5E',
          ctaColor: '#E11D48',
          textColor: '#FFFFFF',
          badgeText: 'TEASER LANÇAMENTO',
          cardBg: 'rgba(244, 63, 94, 0.12)',
          gradient: 'linear-gradient(180deg, #09090B 0%, #4C0519 100%)',
        },
      },
      {
        name: 'Lista Rápida (Top 5 Dicas)',
        network: 'tiktok',
        category: 'educativo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-top5-list',
          headline: '5 Coisas Que Você Precisa Saber Antes de Começar',
          subhead: 'A número 4 vai economizar semanas de dor de cabeça.',
          badge: 'LISTA TOP 5',
          ctaText: 'Qual dessas você já conhecia? Comenta aqui',
          video_meta: {
            duration: 40,
            hook: 'Se eu soubesse disso há 2 anos, estaria muito mais longe...',
            beats: [
              '0-4s: Gancho intrigante prometendo revelar a lista',
              '4-12s: Dica 1 e Dica 2 em ritmo acelerado',
              '12-24s: Dica 3 com exemplo prático',
              '24-34s: Dica 4 (o momento de virada mais valioso)',
              '34-40s: Dica 5 e pedido de opinião nos comentários',
            ],
          },
        },
        style_settings: {
          bgColor: '#0F172A',
          accentColor: '#38BDF8',
          ctaColor: '#0EA5E9',
          textColor: '#FFFFFF',
          badgeText: 'TOP 5 DICAS',
          cardBg: 'rgba(56, 189, 248, 0.12)',
          gradient: 'linear-gradient(180deg, #0F172A 0%, #0369A1 100%)',
        },
      },
      {
        name: 'Conteúdo Educativo em 30 Segundos',
        network: 'youtube',
        category: 'educativo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-30s-class',
          headline: 'A Regra de Ouro Que Transforma Seus Resultados',
          subhead: 'Uma micro-aula condensada direto ao ponto.',
          badge: 'AULA EM 30S',
          ctaText: 'Inscreva-se no canal para não perder a próxima aula',
          video_meta: {
            duration: 30,
            hook: 'Em 30 segundos eu vou te provar uma coisa...',
            beats: [
              '0-3s: Desafio de tempo: "Em 30 segundos você vai entender..."',
              '3-15s: Explicação do conceito central sem termos técnicos',
              '15-25s: Como aplicar hoje mesmo na sua rotina',
              '25-30s: Inscreva-se e ative as notificações',
            ],
          },
        },
        style_settings: {
          bgColor: '#1C1917',
          accentColor: '#EA580C',
          ctaColor: '#C2410C',
          textColor: '#FFFFFF',
          badgeText: 'MICRO-AULA',
          cardBg: 'rgba(234, 88, 12, 0.12)',
          gradient: 'linear-gradient(180deg, #1C1917 0%, #7C2D12 100%)',
        },
      },
      {
        name: 'Chamada para Evento / Live Urgente',
        network: 'facebook',
        category: 'promo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-event-call',
          headline: 'ESTAMOS AO VIVO AGORA: Venha Participar',
          subhead: 'Masterclass gratuita com perguntas e respostas em tempo real.',
          badge: 'AO VIVO / LIVE',
          ctaText: 'Clique no botão abaixo para entrar na sala',
          video_meta: {
            duration: 20,
            hook: 'Acabamos de abrir a sala e a aula já começou!',
            beats: [
              '0-4s: Notificação de urgência: "Corre que dá tempo!"',
              '4-12s: O que está sendo discutido agora no telão',
              '12-20s: Link imediato para acesso direto à transmissão',
            ],
          },
        },
        style_settings: {
          bgColor: '#172554',
          accentColor: '#2563EB',
          ctaColor: '#1D4ED8',
          textColor: '#FFFFFF',
          badgeText: 'LIVE AO VIVO',
          cardBg: 'rgba(37, 99, 235, 0.15)',
          gradient: 'linear-gradient(180deg, #172554 0%, #1E3A8A 100%)',
        },
      },
      {
        name: 'Depoimento em Vídeo LinkedIn Executivo',
        network: 'linkedin',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1920x1080',
        layout_data: {
          grid: 'video-linkedin-case',
          headline: 'Como Essa Empresa B2B Reduziu Custos em 45%',
          subhead: 'Depoimento de liderança executiva sobre governança e eficiência.',
          badge: 'ESTUDO DE CASO B2B',
          ctaText: 'Solicite o relatório completo nos comentários',
          video_meta: {
            duration: 60,
            hook: 'Eficiência operacional não é sorte, é governança.',
            beats: [
              '0-8s: Introdução executiva com métricas no terço inferior',
              '8-25s: O desafio que a empresa enfrentava',
              '25-45s: A implementação e a adesão do time',
              '45-60s: Números consolidados e convite para benchmark',
            ],
          },
        },
        style_settings: {
          bgColor: '#061325',
          accentColor: '#0A66C2',
          ctaColor: '#0284C7',
          textColor: '#FFFFFF',
          badgeText: 'CASE EXECUTIVO 16:9',
          cardBg: 'rgba(10, 102, 194, 0.12)',
          gradient: 'linear-gradient(135deg, #061325 0%, #0F2942 100%)',
        },
      },
    ]

    for (let i = 0; i < videoTemplates.length; i++) {
      const item = videoTemplates[i]
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
    // Reversão
  },
)
