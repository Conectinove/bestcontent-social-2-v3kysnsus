migrate(
  (app) => {
    // =========================================================================
    // Migration 0041: Semear modelos de post para Twitter/X no post_templates
    // Proporções reais: Card Landscape (1600x900 / 16:9), Thread Quote,
    // Provocação/Insight, Enquete Visual X e mais modelos de alta conversão
    // =========================================================================
    let templatesCol
    try {
      templatesCol = app.findCollectionByNameOrId('post_templates')
    } catch (_) {
      return
    }

    let admin = null
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
    } catch (_) {}
    const adminId = admin ? admin.id : ''

    const xTemplates = [
      {
        name: 'X / Twitter Card Landscape Notícia & Artigo',
        network: 'twitter',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1600x900',
        layout_data: {
          grid: 'x-card-landscape',
          headline: 'URGENTE: O Novo Algoritmo do X Prioriza Respostas e Conversas Profundas',
          subhead: 'O que muda no alcance orgânico dos criadores e marcas a partir desta semana',
          metaBadge: 'ARTIGO & ANÁLISE · 4 MIN DE LEITURA',
          ctaText: 'Ler Análise Completa ↗',
        },
        style_settings: {
          bgColor: '#000000',
          accentColor: '#1D9BF0',
          ctaColor: '#1D9BF0',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP CARD LANDSCAPE (1600×900)',
          cardBg: 'rgba(255, 255, 255, 0.07)',
          gradient: 'linear-gradient(135deg, #000000 0%, #0F172A 100%)',
        },
      },
      {
        name: 'X / Twitter Thread Highlight Quote',
        network: 'twitter',
        category: 'educativo',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1600x900',
        layout_data: {
          grid: 'x-thread-quote',
          headline:
            '"O futuro pertence a quem aprende a transformar conhecimento em audiência proprietária."',
          subhead:
            'Lição #1 da thread sobre os 7 erros capitais de quem produz conteúdo em 2026 🧵👇',
          authorRole: 'Thread Curada por Estrategistas',
          ctaText: 'Abrir Thread Completa 🧵',
        },
        style_settings: {
          bgColor: '#0A0A0A',
          accentColor: '#A855F7',
          ctaColor: '#8B5CF6',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP THREAD HIGHLIGHT QUOTE',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          gradient: 'linear-gradient(145deg, #0A0A0A 0%, #1E1B4B 100%)',
        },
      },
      {
        name: 'X / Twitter Provocação & Insight Direto',
        network: 'twitter',
        category: 'engajamento',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1600x900',
        layout_data: {
          grid: 'x-provocation-insight',
          headline:
            'Opinião impopular: o problema não é o algoritmo do X, é a falta de ponto de vista claro.',
          subhead:
            'Se qualquer um pode ter dito o que você postou, seu conteúdo é invisível. Concorda ou discorda?',
          ctaText: 'Deixe seu comentário abaixo 💬',
        },
        style_settings: {
          bgColor: '#030712',
          accentColor: '#F59E0B',
          ctaColor: '#F59E0B',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP PROVOCAÇÃO & INSIGHT',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          gradient: 'linear-gradient(135deg, #030712 0%, #451A03 100%)',
        },
      },
      {
        name: 'X / Twitter Enquete Visual Interativa',
        network: 'twitter',
        category: 'engajamento',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1600x900',
        layout_data: {
          grid: 'x-visual-poll',
          headline:
            'ENQUETE: Qual canal tem trazido maior retorno real para o seu negócio este ano?',
          subhead: '1️⃣ X / Threads  |  2️⃣ LinkedIn  |  3️⃣ Instagram / TikTok  |  4️⃣ WhatsApp VIP',
          ctaText: 'Vote no tweet acima e veja a apuração 🗳️',
        },
        style_settings: {
          bgColor: '#050D1A',
          accentColor: '#0EA5E9',
          ctaColor: '#0284C7',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP ENQUETE VISUAL X',
          cardBg: 'rgba(255, 255, 255, 0.07)',
          gradient: 'linear-gradient(135deg, #050D1A 0%, #0C4A6E 100%)',
        },
      },
      {
        name: 'X / Twitter Quebra de Padrão & Dado Revelador',
        network: 'twitter',
        category: 'storytelling',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1600x900',
        layout_data: {
          grid: 'x-data-reveal',
          headline: '94% dos perfis que crescem no X seguem este mesmo padrão diário de 3 passos',
          subhead: 'Testamos a estratégia em 5 contas por 60 dias. O resultado foi impressionante.',
          ctaText: 'Salvar & Compartilhar 🔁',
        },
        style_settings: {
          bgColor: '#09090B',
          accentColor: '#10B981',
          ctaColor: '#059669',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP DADO REVELADOR',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          gradient: 'linear-gradient(135deg, #09090B 0%, #064E3B 100%)',
        },
      },
      {
        name: 'X / Twitter Lançamento & Drop Relâmpago',
        network: 'twitter',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1600x900',
        layout_data: {
          grid: 'x-lightning-drop',
          headline:
            'DROP RELÂMPAGO: Liberamos 50 Vagas com Condição Exclusiva para a Comunidade do X',
          subhead:
            'Apenas para quem responder a este post nas próximas 2 horas. Link liberado na DM.',
          ctaText: 'Garantir Acesso Antecipado ⚡',
        },
        style_settings: {
          bgColor: '#180224',
          accentColor: '#E11D48',
          ctaColor: '#F43F5E',
          textColor: '#FFFFFF',
          badgeText: '⚡ TOP DROP RELÂMPAGO',
          cardBg: 'rgba(255, 255, 255, 0.09)',
          gradient: 'linear-gradient(135deg, #180224 0%, #4C0519 100%)',
        },
      },
    ]

    for (let i = 0; i < xTemplates.length; i++) {
      const item = xTemplates[i]
      try {
        app.findFirstRecordByFilter(
          'post_templates',
          `name = "${item.name}" && network = "twitter"`,
        )
      } catch (_) {
        const record = new Record(templatesCol)
        if (adminId) record.set('user', adminId)
        record.set('name', item.name)
        record.set('network', item.network)
        record.set('category', item.category)
        record.set('type', item.type)
        record.set('aspect_ratio', item.aspect_ratio)
        record.set('dimensions', item.dimensions)
        record.set('layout_data', JSON.stringify(item.layout_data))
        record.set('style_settings', JSON.stringify(item.style_settings))
        record.set('is_favorite', true)
        record.set('is_shared', true)
        app.save(record)
      }
    }
  },
  (app) => {
    // Reverter templates de twitter criados nesta migration
    try {
      const names = [
        'X / Twitter Card Landscape Notícia & Artigo',
        'X / Twitter Thread Highlight Quote',
        'X / Twitter Provocação & Insight Direto',
        'X / Twitter Enquete Visual Interativa',
        'X / Twitter Quebra de Padrão & Dado Revelador',
        'X / Twitter Lançamento & Drop Relâmpago',
      ]
      for (let i = 0; i < names.length; i++) {
        try {
          const rec = app.findFirstRecordByFilter('post_templates', `name = "${names[i]}"`)
          app.delete(rec)
        } catch (_) {}
      }
    } catch (_) {}
  },
)
