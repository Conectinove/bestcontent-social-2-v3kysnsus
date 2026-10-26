migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('post_templates')

    let ownerUser = null
    try {
      ownerUser = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
    } catch (_) {}

    if (!ownerUser) {
      try {
        const users = app.findRecordsByFilter('_pb_users_auth_', 'id != ""', '-created', 1, 0)
        if (users && users.length > 0) ownerUser = users[0]
      } catch (_) {}
    }

    if (!ownerUser) return

    // 10 novos modelos de vídeo curtos (7–30s) para Reels, TikTok, Shorts e Status
    const shortVideoTemplates = [
      {
        name: 'Hook de 3 Segundos Magnético',
        network: 'tiktok',
        category: 'engajamento',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-hook-3s',
          headline: 'Você Comete Este Erro Sem Perceber...',
          subhead: 'Gancho visual acelerado com corte imediato para prender a atenção no feed.',
          badge: 'HOOK 3S ULTRA RÁPIDO',
          ctaText: 'Veja até o final e comente sua opinião 👇',
          video_meta: {
            duration: 10,
            hook: 'Pare tudo o que você está fazendo agora!',
            beats: [
              '0-3s: Gancho disruptivo em tela cheia com corte dinâmico e efeito sonoro de impacto',
              '3-7s: Revelação da contradição ou surpresa que o espectador não esperava',
              '7-10s: Conclusão direta com chamada para salvar ou comentar',
            ],
          },
        },
        style_settings: {
          bgColor: '#0B0914',
          accentColor: '#EC4899',
          ctaColor: '#DB2777',
          textColor: '#FFFFFF',
          badgeText: 'GANCHO 3 SEGUNDOS',
          cardBg: 'rgba(236, 72, 153, 0.15)',
          gradient: 'linear-gradient(180deg, #0B0914 0%, #3B0764 100%)',
        },
      },
      {
        name: 'Antes e Depois Rápido em 12s',
        network: 'instagram',
        category: 'autoridade',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-before-after-fast',
          headline: 'Do Caos ao Resultado em 12 Segundos',
          subhead: 'Transição rápida com divisão de tela e métricas do resultado final.',
          badge: 'TRANSFORMAÇÃO RELÂMPAGO',
          ctaText: 'Quer o mesmo resultado? Link na bio 🚀',
          video_meta: {
            duration: 12,
            hook: 'Veja a diferença antes e depois de aplicar o método...',
            beats: [
              '0-3s: Situação inicial caótica com texto "Antes" em vermelho',
              '3-5s: Transição com efeito flash/snap de dedos',
              '5-10s: Visual impecável, dados ou métricas do "Depois"',
              '10-12s: Chamada direta para o link da bio',
            ],
          },
        },
        style_settings: {
          bgColor: '#000000',
          accentColor: '#10B981',
          ctaColor: '#059669',
          textColor: '#FFFFFF',
          badgeText: 'ANTES & DEPOIS 12S',
          cardBg: 'rgba(16, 185, 129, 0.15)',
          gradient: 'linear-gradient(180deg, #000000 0%, #064E3B 100%)',
        },
      },
      {
        name: 'Mini-Tutorial Direto de 15s',
        network: 'youtube',
        category: 'educativo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-tutorial-15s',
          headline: 'Aprenda Esse Truque em 15 Segundos',
          subhead: 'Tutorial condensado no terço central, sem introduções desnecessárias.',
          badge: 'TUTORIAL 15S',
          ctaText: 'Salva esse vídeo para usar mais tarde 📌',
          video_meta: {
            duration: 15,
            hook: 'Pouca gente sabe que dá pra fazer isso em 1 clique...',
            beats: [
              '0-3s: Demonstração imediata do clique ou atalho',
              '3-10s: Os 2 passos executados na tela com zoom de foco',
              '10-15s: Resultado pronto + CTA "Salva para não esquecer"',
            ],
          },
        },
        style_settings: {
          bgColor: '#0F172A',
          accentColor: '#8B5CF6',
          ctaColor: '#7C3AED',
          textColor: '#FFFFFF',
          badgeText: 'MINI TUTORIAL 15S',
          cardBg: 'rgba(139, 92, 246, 0.15)',
          gradient: 'linear-gradient(180deg, #0F172A 0%, #1E1B4B 100%)',
        },
      },
      {
        name: 'Dica Relâmpago de 10 Segundos',
        network: 'tiktok',
        category: 'educativo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-flash-tip-10s',
          headline: 'Dica de Ouro em Apenas 10 Segundos',
          subhead: 'Uma única recomendação de alto impacto entregue de forma afiada.',
          badge: 'DICA RELÂMPAGO',
          ctaText: 'Siga para mais dicas diárias de 10s ⚡',
          video_meta: {
            duration: 10,
            hook: 'Se você faz isso, pare agora e faça assim:',
            beats: [
              '0-2s: Frase de gancho em caixa alta centralizada',
              '2-7s: A dica prática acionável falada ou exibida',
              '7-10s: Siga para a próxima dica relâmpago',
            ],
          },
        },
        style_settings: {
          bgColor: '#18181B',
          accentColor: '#F59E0B',
          ctaColor: '#D97706',
          textColor: '#FFFFFF',
          badgeText: 'DICA RELÂMPAGO 10S',
          cardBg: 'rgba(245, 158, 11, 0.15)',
          gradient: 'linear-gradient(180deg, #18181B 0%, #451A03 100%)',
        },
      },
      {
        name: 'POV do Cliente (Ponto de Vista Real)',
        network: 'instagram',
        category: 'storytelling',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-pov-client',
          headline: 'POV: Quando o Produto Finalmente Chega na Sua Porta',
          subhead: 'Experiência sensorial em primeira pessoa com unboxing emocional.',
          badge: 'POV REALISTA',
          ctaText: 'Comente "EU QUERO" para receber o link com desconto',
          video_meta: {
            duration: 18,
            hook: 'POV: A melhor compra que você fez este ano...',
            beats: [
              '0-4s: Câmera em primeira pessoa abrindo a encomenda com som satisfatório',
              '4-11s: Reação genuína, visual do produto em mãos e acabamento',
              '11-18s: Expressão de aprovação e CTA "Você merece ter um"',
            ],
          },
        },
        style_settings: {
          bgColor: '#1E1B4B',
          accentColor: '#A855F7',
          ctaColor: '#9333EA',
          textColor: '#FFFFFF',
          badgeText: 'POV CLIENTE',
          cardBg: 'rgba(168, 85, 247, 0.15)',
          gradient: 'linear-gradient(180deg, #1E1B4B 0%, #2E1065 100%)',
        },
      },
      {
        name: 'Pergunta + Resposta Rápida (Q&A Dinâmico)',
        network: 'youtube',
        category: 'educativo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-qa-fast',
          headline: 'Pergunta que Não Quer Calar: Vale Mesmo a Pena?',
          subhead: 'Sticker de caixinha de perguntas seguido de resposta objetiva.',
          badge: 'PERGUNTA & RESPOSTA',
          ctaText: 'Qual a sua dúvida? Deixe nos comentários 💬',
          video_meta: {
            duration: 16,
            hook: '"Fulano, isso realmente funciona ou é marketing?"',
            beats: [
              '0-3s: Sticker de pergunta em evidência na tela',
              '3-12s: Resposta direta, sincera e com prova visual de suporte',
              '12-16s: "Manda sua dúvida que eu respondo no próximo vídeo"',
            ],
          },
        },
        style_settings: {
          bgColor: '#172554',
          accentColor: '#38BDF8',
          ctaColor: '#0284C7',
          textColor: '#FFFFFF',
          badgeText: 'Q&A SHORTS',
          cardBg: 'rgba(56, 189, 248, 0.15)',
          gradient: 'linear-gradient(180deg, #172554 0%, #0369A1 100%)',
        },
      },
      {
        name: 'Cortes de Fala Viral (Podcast / Entrevista)',
        network: 'tiktok',
        category: 'autoridade',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-viral-clip',
          headline: 'A Frase Que Mudou Minha Visão Sobre Negócios',
          subhead: 'Corte de conversa ou palestra com legendas automáticas chamativas.',
          badge: 'CORTE VIRAL',
          ctaText: 'Concorda ou discorda? Deixe seu ponto de vista 🎙️',
          video_meta: {
            duration: 25,
            hook: 'Essa é a verdade mais dura que ninguém te conta...',
            beats: [
              '0-4s: Fala impactante com legenda destacada em amarelo/branco',
              '4-18s: Argumento central forte com cortes de câmera alternados',
              '18-25s: Encerramento reflexivo que incita debate nos comentários',
            ],
          },
        },
        style_settings: {
          bgColor: '#09090B',
          accentColor: '#EAB308',
          ctaColor: '#CA8A04',
          textColor: '#FFFFFF',
          badgeText: 'CORTE VIRAL',
          cardBg: 'rgba(234, 179, 8, 0.15)',
          gradient: 'linear-gradient(180deg, #09090B 0%, #27272A 100%)',
        },
      },
      {
        name: 'Transição Trend com Batida Musical',
        network: 'instagram',
        category: 'engajamento',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-trend-transition',
          headline: 'Sincronize com a Batida e Arrase',
          subhead: 'Troca de look, cenário ou produto exatamente no drop do áudio.',
          badge: 'TREND BEAT SYNC',
          ctaText: 'Use este áudio antes que ele vire mainstream 🔥',
          video_meta: {
            duration: 12,
            hook: 'Espere pelo drop da música...',
            beats: [
              '0-4s: Movimento lento ou expectativa no ritmo da introdução',
              '4-5s: Transição com tap na lente ou giro rápido',
              '5-10s: Visual impactante revelado no pico da batida',
              '10-12s: Pouso final e incentivo ao uso do som',
            ],
          },
        },
        style_settings: {
          bgColor: '#000000',
          accentColor: '#06B6D4',
          ctaColor: '#0891B2',
          textColor: '#FFFFFF',
          badgeText: 'BEAT SYNC',
          cardBg: 'rgba(6, 182, 212, 0.15)',
          gradient: 'linear-gradient(180deg, #000000 0%, #164E63 100%)',
        },
      },
      {
        name: 'Bastidor de 7 Segundos (Micro-Momento)',
        network: 'instagram',
        category: 'storytelling',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-backstage-7s',
          headline: '7 Segundos da Nossa Rotina Sem Filtro',
          subhead: 'Vídeo super curto em looping, ideal para reter atenção 100%.',
          badge: 'BASTIDOR 7S LOOP',
          ctaText: 'Leia a legenda para entender o contexto completo 📖',
          video_meta: {
            duration: 7,
            hook: 'Um segundo da nossa rotina real...',
            beats: [
              '0-3s: Detalhe estético do ambiente de trabalho ou produto sendo feito',
              '3-6s: Ação manual sutil e envolvente que dá vontade de rever',
              '6-7s: Corte contínuo que cria um looping perfeito',
            ],
          },
        },
        style_settings: {
          bgColor: '#1C1917',
          accentColor: '#FB7185',
          ctaColor: '#E11D48',
          textColor: '#FFFFFF',
          badgeText: 'BASTIDOR 7S',
          cardBg: 'rgba(251, 113, 133, 0.15)',
          gradient: 'linear-gradient(180deg, #1C1917 0%, #4C0519 100%)',
        },
      },
      {
        name: 'Contagem Regressiva de Oferta Relâmpago',
        network: 'facebook',
        category: 'promo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'video-countdown-offer',
          headline: 'ÚLTIMAS HORAS: Oferta Especial Encerra Hoje',
          subhead: 'Gatilho de urgência com cronômetro pulsante e cupom na tela.',
          badge: 'OFERTA RELÂMPAGO',
          ctaText: 'Toque no link abaixo para garantir seu cupom ⏰',
          video_meta: {
            duration: 15,
            hook: 'Atenção: faltam poucas horas para o encerramento!',
            beats: [
              '0-4s: Alerta de urgência com animação de contagem regressiva',
              '4-10s: Apresentação da oferta, cupom de desconto e valor imperdível',
              '10-15s: CTA final incisiva "Clique agora antes que expire"',
            ],
          },
        },
        style_settings: {
          bgColor: '#18181B',
          accentColor: '#EF4444',
          ctaColor: '#DC2626',
          textColor: '#FFFFFF',
          badgeText: 'URGÊNCIA RELÂMPAGO',
          cardBg: 'rgba(239, 68, 68, 0.15)',
          gradient: 'linear-gradient(180deg, #18181B 0%, #7F1D1D 100%)',
        },
      },
    ]

    for (let i = 0; i < shortVideoTemplates.length; i++) {
      const item = shortVideoTemplates[i]
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
    // Reversão opcional
  },
)
