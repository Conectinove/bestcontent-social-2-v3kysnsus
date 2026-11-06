migrate(
  (app) => {
    // Migration 00092: Atualizar campo 'network' de post_templates para suportar redes modernas
    // e semear novos templates estratégicos cobrindo formatos PT-BR de alta conversão:
    // Carrossel educativo passo-a-passo, meme/entretenimento, notícia/do dia, checklist salvável,
    // enquete interativa, depoimento de cliente, case de resultado com números, live/evento, parceria/colab.

    const templatesCol = app.findCollectionByNameOrId('post_templates')

    // 1. Expandir valores válidos do SelectField 'network'
    const networkField = templatesCol.fields.getByName('network')
    if (networkField) {
      const allNetworks = [
        'instagram',
        'facebook',
        'linkedin',
        'whatsapp',
        'tiktok',
        'youtube',
        'twitter',
        'all',
        'pinterest',
        'threads',
        'reels',
        'kwai',
        'telegram',
        'bluesky',
        'snapchat',
      ]
      networkField.values = allNetworks
      app.save(templatesCol)
    }

    let defaultUserId = ''
    try {
      const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (firstUser) {
        defaultUserId = firstUser.id
      }
    } catch {
      // sem usuário padrão
    }

    const newTemplates = [
      {
        name: 'Carrossel Educativo Passo-a-Passo',
        type: 'feed',
        network: 'instagram',
        category: 'educativo',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          slidesCount: 5,
          headline: 'O Guia Definitivo em 5 Etapas',
          hook: 'Pare de complicar: siga este passo a passo comprovado para ter resultados hoje',
          steps: [
            'Etapa 1: Diagnóstico do cenário real',
            'Etapa 2: Definição da métrica principal',
            'Etapa 3: Execução enxuta e sem fricção',
            'Etapa 4: Ajuste fino com dados reais',
            'Etapa 5: Escala previsível do método',
          ],
          cta: '📌 Salve este carrossel para consultar na sua próxima implementação!',
        },
        style_settings: {
          theme: 'high-impact',
          accentColor: '#8B5CF6',
          fontFamily: 'Archivo Black',
          cardBg: '#0F172A',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Meme & Entretenimento de Nicho',
        type: 'feed',
        network: 'tiktok',
        category: 'engajamento',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          format: 'Meme POV / Situação Relatável',
          hook: 'POV: Quando o cliente pede "só mais uma alteraçãozinha rápida"',
          punchline: 'Expectativa: 5 minutos. Realidade: 4 horas refazendo o layout inteiro.',
          audioSuggestion: 'Áudio cômico em alta / suspense repentino',
          cta: 'Comente aqui se você também já passou por isso 😂👇',
        },
        style_settings: {
          theme: 'bold-pop',
          accentColor: '#EC4899',
          fontFamily: 'Inter',
          cardBg: '#18181B',
          textColor: '#FAFAFA',
        },
      },
      {
        name: 'Notícia Quente & Fato do Dia',
        type: 'feed',
        network: 'twitter',
        category: 'autoridade',
        aspect_ratio: '16:9',
        dimensions: '1200x675',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          headline: 'URGENTE: Nova atualização muda as regras do jogo',
          context: 'A plataforma acabou de anunciar uma virada drástica no algoritmo.',
          threeTakeaways: [
            '1. Conteúdo técnico agora ganha 2x mais distribuição orgânica',
            '2. Engajamento nos primeiros 15 minutos se torna o filtro crítico',
            '3. O que muda na prática para criadores e marcas nesta semana',
          ],
          cta: 'O que achou dessa mudança? Diga sua opinião no repost 🔄',
        },
        style_settings: {
          theme: 'breaking-news',
          accentColor: '#0EA5E9',
          fontFamily: 'Archivo Black',
          cardBg: '#020617',
          textColor: '#F8FAFC',
        },
      },
      {
        name: 'Checklist Prático Salvável',
        type: 'feed',
        network: 'pinterest',
        category: 'educativo',
        aspect_ratio: '2:3',
        dimensions: '1000x1500',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          title: 'Checklist Antes de Publicar Qualquer Post',
          items: [
            '✅ Gancho magnético na 1ª linha antes do corte',
            '✅ Respiro visual entre os parágrafos para mobile',
            '✅ Imagem nítida no formato correto da rede',
            '✅ CTA específica (salvar ou comentar)',
            '✅ 3 a 5 hashtags focadas no seu nicho real',
          ],
          cta: 'Salve no seu painel de Ideias para conferir antes de cada post!',
        },
        style_settings: {
          theme: 'clean-editorial',
          accentColor: '#E11D48',
          fontFamily: 'Poppins',
          cardBg: '#FFFFFF',
          textColor: '#0F172A',
        },
      },
      {
        name: 'Enquete Interativa & Batalha de Opiniões',
        type: 'story',
        network: 'instagram',
        category: 'engajamento',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          stickerType: 'poll',
          question: 'Qual estratégia gera mais vendas para você em 2026?',
          optionA: 'Orgânico Consistente 📈',
          optionB: 'Tráfego Pago Acelerado 🎯',
          followupText: 'Vote para ver o que a maioria da comunidade está escolhendo!',
        },
        style_settings: {
          theme: 'vibrant-neon',
          accentColor: '#10B981',
          fontFamily: 'Inter',
          cardBg: '#09090B',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Depoimento & Prova Social de Cliente',
        type: 'feed',
        network: 'linkedin',
        category: 'storytelling',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          clientName: 'Mariana Duarte • Head de Marketing',
          quote:
            '"Em apenas 30 dias usando o método, dobramos a retenção do nosso conteúdo orgânico e reduzimos o tempo de produção pela metade."',
          highlightMetric: '+140% de alcance qualificado',
          cta: 'Quer aplicar esse mesmo método na sua operação? Me chame no direct ou acesse o link.',
        },
        style_settings: {
          theme: 'corporate-trust',
          accentColor: '#0284C7',
          fontFamily: 'Inter',
          cardBg: '#F8FAFC',
          textColor: '#0F172A',
        },
      },
      {
        name: 'Case de Resultado com Números Reais',
        type: 'feed',
        network: 'linkedin',
        category: 'autoridade',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          headline: 'Como faturamos R$ 85.000 com um único lançamento orgânico',
          breakdown: [
            'Problema inicial: lista fria e baixo engajamento no feed',
            'Hipótese: focar em carrosséis de resolução imediata com gancho forte',
            'Resultado medido: 4.800 leads captados sem gastar R$ 1 em ads',
            'Lição aprendida: clareza de proposta vence volume excessivo',
          ],
          cta: 'Qual número mais te chamou atenção? Deixe sua dúvida nos comentários.',
        },
        style_settings: {
          theme: 'high-impact',
          accentColor: '#6366F1',
          fontFamily: 'Archivo Black',
          cardBg: '#020617',
          textColor: '#F1F5F9',
        },
      },
      {
        name: 'Convite para Live / Masterclass ao Vivo',
        type: 'feed',
        network: 'youtube',
        category: 'promo',
        aspect_ratio: '16:9',
        dimensions: '1280x720',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          badge: 'AULA AO VIVO & GRATUITA',
          theme: 'Estratégia Completa de Conteúdo de Alta Conversão',
          dateTime: 'Quinta-feira, 20h no YouTube',
          bullets: [
            'Roteiro passo-a-passo revelado na tela',
            'Templates prontos para baixar no final',
            'Tira-dúvidas direto no chat ao vivo',
          ],
          cta: 'Clique no botão para ativar o lembrete e não perder a transmissão!',
        },
        style_settings: {
          theme: 'cinema-dark',
          accentColor: '#EF4444',
          fontFamily: 'Archivo Black',
          cardBg: '#0A0A0A',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Parceria & Collab Estratégica',
        type: 'feed',
        network: 'instagram',
        category: 'engajamento',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          collabHeadline: 'Uma conversa necessária: [Nome A] + [Nome B]',
          topic: 'O que ninguém tem coragem de falar sobre monetização em redes sociais',
          highlights: [
            'Visão 1: Por que métricas de vaidade enganam',
            'Visão 2: Onde está o dinheiro real de quem cria conteúdo',
          ],
          cta: 'Marque nos comentários aquele parceiro de negócios que precisa ouvir isso!',
        },
        style_settings: {
          theme: 'modern-duo',
          accentColor: '#F59E0B',
          fontFamily: 'Poppins',
          cardBg: '#18181B',
          textColor: '#FAFAFA',
        },
      },
      {
        name: 'Disparo de Comunidade WhatsApp & Telegram',
        type: 'feed',
        network: 'whatsapp',
        category: 'promo',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          header: '⚡ [EXCLUSIVO PARA A COMUNIDADE VIP]',
          content: 'Liberamos uma condição especial de 24h apenas para quem está no grupo oficial.',
          actionLink: 'Toque no link abaixo para resgatar seu cupom exclusivo:',
          cta: 'Aproveite agora antes que o lote se esgote!',
        },
        style_settings: {
          theme: 'whatsapp-green',
          accentColor: '#10B981',
          fontFamily: 'Inter',
          cardBg: '#064E3B',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Roteiro Rápido para Reels & Shorts',
        type: 'feed',
        network: 'reels',
        category: 'educativo',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        is_shared: true,
        is_favorite: true,
        layout_data: {
          videoStructure: {
            hook0_3s: 'Se você faz X assim, pare agora mesmo!',
            problem3_15s: 'A maioria perde tempo tentando o caminho mais difícil...',
            solution15_45s: 'Aqui está a virada simples que economiza 2 horas:',
            cta45_60s: 'Salva esse vídeo para aplicar na sua próxima criação!',
          },
          pacing: 'Cortes rápidos a cada 2.5s, legendas dinâmicas no centro da tela',
        },
        style_settings: {
          theme: 'reels-action',
          accentColor: '#F43F5E',
          fontFamily: 'Archivo Black',
          cardBg: '#0F172A',
          textColor: '#FFFFFF',
        },
      },
      {
        name: 'Micro-Post Provocativo para Threads & Bluesky',
        type: 'feed',
        network: 'threads',
        category: 'storytelling',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        is_shared: true,
        is_favorite: false,
        layout_data: {
          provocation:
            'Opinião impopular: você não precisa postar 3 vezes por dia para ter autoridade.',
          argument:
            'Um único post profundo e bem estruturado por semana atrai clientes 10x mais qualificados do que 20 posts genéricos feitos no desespero.',
          cta: 'Concorda ou discorda? Me conta aqui embaixo 👇',
        },
        style_settings: {
          theme: 'minimal-editorial',
          accentColor: '#71717A',
          fontFamily: 'Inter',
          cardBg: '#09090B',
          textColor: '#FAFAFA',
        },
      },
    ]

    for (const tpl of newTemplates) {
      try {
        const existing = app.findFirstRecordByFilter('post_templates', `name = "${tpl.name}"`)
        if (existing) {
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
        // Record não existe, prosseguir para criação
      }

      const record = new Record(templatesCol)
      if (defaultUserId) {
        record.set('user', defaultUserId)
      }
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
    const names = [
      'Carrossel Educativo Passo-a-Passo',
      'Meme & Entretenimento de Nicho',
      'Notícia Quente & Fato do Dia',
      'Checklist Prático Salvável',
      'Enquete Interativa & Batalha de Opiniões',
      'Depoimento & Prova Social de Cliente',
      'Case de Resultado com Números Reais',
      'Convite para Live / Masterclass ao Vivo',
      'Parceria & Collab Estratégica',
      'Disparo de Comunidade WhatsApp & Telegram',
      'Roteiro Rápido para Reels & Shorts',
      'Micro-Post Provocativo para Threads & Bluesky',
    ]

    for (const name of names) {
      try {
        const record = app.findFirstRecordByFilter('post_templates', `name = "${name}"`)
        if (record) {
          app.delete(record)
        }
      } catch {
        // ignora se não encontrado
      }
    }
  },
)
