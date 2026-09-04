migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('post_templates')

    // 1. Adiciona campos network, category, aspect_ratio e dimensions se ainda não existirem
    if (!col.fields.getByName('network')) {
      col.fields.add(
        new SelectField({
          name: 'network',
          required: false,
          maxSelect: 1,
          values: [
            'instagram',
            'facebook',
            'linkedin',
            'whatsapp',
            'tiktok',
            'youtube',
            'twitter',
            'all',
          ],
        }),
      )
    }

    if (!col.fields.getByName('category')) {
      col.fields.add(
        new SelectField({
          name: 'category',
          required: false,
          maxSelect: 1,
          values: ['promo', 'educativo', 'storytelling', 'autoridade', 'engajamento'],
        }),
      )
    }

    if (!col.fields.getByName('aspect_ratio')) {
      col.fields.add(
        new TextField({
          name: 'aspect_ratio',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('dimensions')) {
      col.fields.add(
        new TextField({
          name: 'dimensions',
          required: false,
        }),
      )
    }

    app.save(col)

    // Adiciona índices idempotentes
    col.addIndex('idx_post_templates_network', false, 'network', '')
    col.addIndex('idx_post_templates_category', false, 'category', '')
    app.save(col)

    // Identifica usuário de seed
    let userId = ''
    try {
      const u = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      userId = u.id
    } catch (_) {}

    // Modelos para todas as redes sociais exigidas
    const networkTemplates = [
      // INSTAGRAM
      {
        name: 'Instagram Portrait Editorial',
        type: 'feed',
        network: 'instagram',
        category: 'educativo',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: JSON.stringify({
          grid: 'editorial',
          headline: '3 Passos para Escalar seu Conteúdo com IA',
          subhead: 'Guia definitivo para criadores e marcas modernas',
          ctaText: 'Salvar este post',
        }),
        style_settings: JSON.stringify({
          bgColor: '#0F0B1E',
          accentColor: '#9333EA',
          ctaColor: '#A855F7',
          textColor: '#F8FAFC',
          gradient: 'linear-gradient(135deg, #0F0B1E 0%, #2E1065 100%)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          badgeText: 'INSTAGRAM PORTRAIT',
        }),
      },
      {
        name: 'Instagram Stories Flash Sale',
        type: 'story',
        network: 'instagram',
        category: 'promo',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: JSON.stringify({
          grid: 'story-flash',
          headline: 'OFERTA RELÂMPAGO VIP',
          subhead: 'Disponível apenas nas próximas 24 horas',
          badge: '50% OFF',
          ctaText: 'DESLIZE PARA CIMA',
        }),
        style_settings: JSON.stringify({
          bgColor: '#180224',
          accentColor: '#E11D48',
          ctaColor: '#F43F5E',
          textColor: '#FFFFFF',
          gradient: 'linear-gradient(180deg, #180224 0%, #4C0519 100%)',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          badgeText: 'STORIES 1080x1920',
        }),
      },
      {
        name: 'Instagram Carrossel Infográfico',
        type: 'feed',
        network: 'instagram',
        category: 'storytelling',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: JSON.stringify({
          grid: 'carousel-slide1',
          headline: 'O que ninguém te conta sobre algoritmos',
          subhead: 'Arraste para o lado e veja os 5 segredos',
          slideNumber: '1 de 6',
          ctaText: 'Arraste para o lado →',
        }),
        style_settings: JSON.stringify({
          bgColor: '#0B0F19',
          accentColor: '#8B5CF6',
          ctaColor: '#06B6D4',
          textColor: '#FFFFFF',
          gradient: 'linear-gradient(145deg, #0B0F19 0%, #1E1B4B 100%)',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          badgeText: 'CARROSSEL 1080x1350',
        }),
      },

      // FACEBOOK
      {
        name: 'Facebook Post Quadrado Engajador',
        type: 'feed',
        network: 'facebook',
        category: 'engajamento',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: JSON.stringify({
          grid: 'fb-square',
          headline: 'Qual é o seu maior desafio hoje?',
          subhead: 'Vote nos comentários: A) Alcance B) Conversão C) Tempo',
          ctaText: 'Participe da Discussão',
        }),
        style_settings: JSON.stringify({
          bgColor: '#0A192F',
          accentColor: '#1877F2',
          ctaColor: '#2563EB',
          textColor: '#F1F5F9',
          gradient: 'linear-gradient(135deg, #0A192F 0%, #172554 100%)',
          cardBg: 'rgba(255, 255, 255, 0.07)',
          badgeText: 'FACEBOOK SQUARE',
        }),
      },
      {
        name: 'Facebook Stories Comunidade',
        type: 'story',
        network: 'facebook',
        category: 'promo',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: JSON.stringify({
          grid: 'fb-story',
          headline: 'NOVO GRUPO DE NEGÓCIOS',
          subhead: 'Acesso liberado para os primeiros 100 membros',
          ctaText: 'Entrar no Grupo',
        }),
        style_settings: JSON.stringify({
          bgColor: '#0F172A',
          accentColor: '#1877F2',
          ctaColor: '#38BDF8',
          textColor: '#FFFFFF',
          gradient: 'linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          badgeText: 'FB STORIES',
        }),
      },

      // LINKEDIN
      {
        name: 'LinkedIn Executive Thought Leadership',
        type: 'feed',
        network: 'linkedin',
        category: 'autoridade',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: JSON.stringify({
          grid: 'linkedin-portrait',
          headline: 'Liderança em Tempos de IA Generativa',
          subhead: '3 lições práticas após analisar 500 campanhas digitais',
          authorRole: 'Chief Content Strategist',
          ctaText: 'Ler análise completa',
        }),
        style_settings: JSON.stringify({
          bgColor: '#0A1628',
          accentColor: '#0A66C2',
          ctaColor: '#38BDF8',
          textColor: '#F8FAFC',
          gradient: 'linear-gradient(135deg, #0A1628 0%, #0F2942 100%)',
          cardBg: 'rgba(255, 255, 255, 0.05)',
          badgeText: 'LINKEDIN PORTRAIT',
        }),
      },
      {
        name: 'LinkedIn Document Carrossel B2B',
        type: 'feed',
        network: 'linkedin',
        category: 'educativo',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: JSON.stringify({
          grid: 'linkedin-carousel',
          headline: 'Playbook de Prospecção Outbound 2026',
          subhead: 'Templates prontos de copywriting para copywriters e SDRs',
          slideNumber: 'PDF · 10 Páginas',
          ctaText: 'Baixar Documento',
        }),
        style_settings: JSON.stringify({
          bgColor: '#05192D',
          accentColor: '#0077B5',
          ctaColor: '#6366F1',
          textColor: '#FFFFFF',
          gradient: 'linear-gradient(145deg, #05192D 0%, #1E293B 100%)',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          badgeText: 'LINKEDIN CARROSSEL',
        }),
      },

      // WHATSAPP
      {
        name: 'WhatsApp Banner de Transmissão',
        type: 'feed',
        network: 'whatsapp',
        category: 'promo',
        aspect_ratio: '16:9',
        dimensions: '1125x600',
        layout_data: JSON.stringify({
          grid: 'whatsapp-broadcast',
          headline: 'COMUNICADO EXCLUSIVO DO GRUPO VIP',
          subhead: 'Link liberado para compra prioritária hoje às 20h',
          ctaText: 'Clique para Acessar',
        }),
        style_settings: JSON.stringify({
          bgColor: '#062B22',
          accentColor: '#25D366',
          ctaColor: '#10B981',
          textColor: '#FFFFFF',
          gradient: 'linear-gradient(135deg, #062B22 0%, #064E3B 100%)',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          badgeText: 'WHATSAPP BANNER 1125x600',
        }),
      },
      {
        name: 'WhatsApp Status Aviso Relâmpago',
        type: 'story',
        network: 'whatsapp',
        category: 'storytelling',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: JSON.stringify({
          grid: 'whatsapp-status',
          headline: 'ATENDIMENTO EM TEMPO REAL',
          subhead: 'Estamos respondendo dúvidas direto no privado agora',
          ctaText: 'Responder Status',
        }),
        style_settings: JSON.stringify({
          bgColor: '#022C22',
          accentColor: '#25D366',
          ctaColor: '#34D399',
          textColor: '#F0FDF4',
          gradient: 'linear-gradient(180deg, #022C22 0%, #065F46 100%)',
          cardBg: 'rgba(255, 255, 255, 0.07)',
          badgeText: 'WHATSAPP STATUS 1080x1920',
        }),
      },

      // TIKTOK
      {
        name: 'TikTok Viral Hook / Trend',
        type: 'story',
        network: 'tiktok',
        category: 'engajamento',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: JSON.stringify({
          grid: 'tiktok-hook',
          headline: 'PARE DE FAZER ISSO AGORA!',
          subhead: 'O erro nº 1 que destrói suas visualizações no TikTok',
          sticker: 'POV VIRAL',
          ctaText: 'Segue para parte 2 +',
        }),
        style_settings: JSON.stringify({
          bgColor: '#000000',
          accentColor: '#00F2FE',
          ctaColor: '#FE2C55',
          textColor: '#FFFFFF',
          gradient: 'linear-gradient(180deg, #000000 0%, #1F0D24 100%)',
          cardBg: 'rgba(255, 255, 255, 0.1)',
          badgeText: 'TIKTOK REELS 1080x1920',
        }),
      },
      {
        name: 'TikTok Storytelling Micro-Doc',
        type: 'story',
        network: 'tiktok',
        category: 'storytelling',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: JSON.stringify({
          grid: 'tiktok-doc',
          headline: 'Como construí uma marca de R$ 100k do zero',
          subhead: 'História real sem filtro em 60 segundos',
          ctaText: 'Comente "PLAY" para detalhes',
        }),
        style_settings: JSON.stringify({
          bgColor: '#0A0A0C',
          accentColor: '#FE2C55',
          ctaColor: '#00F2FE',
          textColor: '#FFFFFF',
          gradient: 'linear-gradient(180deg, #0A0A0C 0%, #25121E 100%)',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          badgeText: 'TIKTOK 9:16',
        }),
      },

      // YOUTUBE
      {
        name: 'YouTube Thumbnail Click Magnet',
        type: 'feed',
        network: 'youtube',
        category: 'autoridade',
        aspect_ratio: '16:9',
        dimensions: '1280x720',
        layout_data: JSON.stringify({
          grid: 'youtube-thumb',
          headline: 'O FIM DAS AGÊNCIAS TRADICIONAIS?',
          subhead: 'A nova era dos criadores independentes com IA',
          badge: 'CASO REAL',
          ctaText: 'ASSISTIR AGORA (12:45)',
        }),
        style_settings: JSON.stringify({
          bgColor: '#170003',
          accentColor: '#FF0000',
          ctaColor: '#FACC15',
          textColor: '#FFFFFF',
          gradient: 'linear-gradient(135deg, #170003 0%, #450A0A 100%)',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          badgeText: 'THUMBNAIL 1280x720',
        }),
      },
      {
        name: 'YouTube Shorts Dinâmico',
        type: 'story',
        network: 'youtube',
        category: 'educativo',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: JSON.stringify({
          grid: 'youtube-shorts',
          headline: 'Dica Rápida em 30 Segundos',
          subhead: 'O prompt secreto para copywriters de elite',
          ctaText: 'Inscreva-se no canal',
        }),
        style_settings: JSON.stringify({
          bgColor: '#0F0F0F',
          accentColor: '#FF0000',
          ctaColor: '#FFFFFF',
          textColor: '#F5F5F5',
          gradient: 'linear-gradient(180deg, #0F0F0F 0%, #2B0505 100%)',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          badgeText: 'YOUTUBE SHORTS 9:16',
        }),
      },

      // TWITTER / X
      {
        name: 'Twitter/X Card Landscape Notícia',
        type: 'feed',
        network: 'twitter',
        category: 'autoridade',
        aspect_ratio: '16:9',
        dimensions: '1200x675',
        layout_data: JSON.stringify({
          grid: 'twitter-card',
          headline: 'URGENTE: Nova atualização nos algoritmos de distribuição',
          subhead: 'O que muda no alcance orgânico a partir desta semana',
          ctaText: 'Ver Thread Completa 🧵',
        }),
        style_settings: JSON.stringify({
          bgColor: '#000000',
          accentColor: '#1D9BF0',
          ctaColor: '#38BDF8',
          textColor: '#FFFFFF',
          gradient: 'linear-gradient(135deg, #000000 0%, #0F172A 100%)',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          badgeText: 'X LANDSCAPE 1200x675',
        }),
      },
      {
        name: 'Twitter/X Thread Highlight Quote',
        type: 'feed',
        network: 'twitter',
        category: 'educativo',
        aspect_ratio: '16:9',
        dimensions: '1200x675',
        layout_data: JSON.stringify({
          grid: 'twitter-quote',
          headline: '"O futuro do marketing pertence a quem sabe orquestrar IA"',
          subhead: 'Insight retirado do relatório global de criadores 2026',
          ctaText: 'Retweetar & Salvar',
        }),
        style_settings: JSON.stringify({
          bgColor: '#0B0F17',
          accentColor: '#A855F7',
          ctaColor: '#1D9BF0',
          textColor: '#F8FAFC',
          gradient: 'linear-gradient(145deg, #0B0F17 0%, #1E1B4B 100%)',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          badgeText: 'TWITTER / X 16:9',
        }),
      },
    ]

    const tplCol = app.findCollectionByNameOrId('post_templates')
    for (let i = 0; i < networkTemplates.length; i++) {
      const item = networkTemplates[i]
      try {
        const existing = app.findFirstRecordByData('post_templates', 'name', item.name)
        existing.set('network', item.network)
        existing.set('category', item.category)
        existing.set('aspect_ratio', item.aspect_ratio)
        existing.set('dimensions', item.dimensions)
        existing.set('layout_data', item.layout_data)
        existing.set('style_settings', item.style_settings)
        existing.set('is_shared', true)
        app.save(existing)
      } catch (_) {
        const record = new Record(tplCol)
        if (userId) record.set('user', userId)
        record.set('name', item.name)
        record.set('type', item.type)
        record.set('network', item.network)
        record.set('category', item.category)
        record.set('aspect_ratio', item.aspect_ratio)
        record.set('dimensions', item.dimensions)
        record.set('layout_data', item.layout_data)
        record.set('style_settings', item.style_settings)
        record.set('is_favorite', false)
        record.set('is_shared', true)
        app.save(record)
      }
    }
  },
  (app) => {
    // Revert opcional: remove novos índices
    try {
      const col = app.findCollectionByNameOrId('post_templates')
      col.removeIndex('idx_post_templates_network')
      col.removeIndex('idx_post_templates_category')
      app.save(col)
    } catch (_) {}
  },
)
