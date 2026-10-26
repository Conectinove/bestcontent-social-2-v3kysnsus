migrate(
  (app) => {
    // 1. Criar coleção image_bank_assets
    let col = null
    try {
      col = app.findCollectionByNameOrId('image_bank_assets')
    } catch (_) {
      col = new Collection({
        name: 'image_bank_assets',
        type: 'base',
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'file',
            type: 'file',
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
          },
          {
            name: 'preview_url',
            type: 'text', // para imagens curadas em data:image/svg+xml ou CDN interno
          },
          {
            name: 'category',
            type: 'select',
            values: [
              'negocios',
              'educacao',
              'alimentacao',
              'tecnologia',
              'estilo_de_vida',
              'saude',
              'moda',
              'geral',
            ],
          },
          {
            name: 'network',
            type: 'select',
            values: [
              'instagram',
              'facebook',
              'linkedin',
              'whatsapp',
              'tiktok',
              'youtube',
              'twitter',
              'todas',
            ],
          },
          {
            name: 'tags',
            type: 'json', // array de strings
          },
          {
            name: 'is_curated',
            type: 'bool',
          },
          {
            name: 'user',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
          },
          {
            name: 'brand',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('brands').id,
            cascadeDelete: false,
          },
          {
            name: 'width',
            type: 'number',
          },
          {
            name: 'height',
            type: 'number',
          },
        ],
        indexes: [
          'CREATE INDEX idx_image_bank_user ON image_bank_assets (user)',
          'CREATE INDEX idx_image_bank_category ON image_bank_assets (category)',
          'CREATE INDEX idx_image_bank_curated ON image_bank_assets (is_curated)',
        ],
        // Regras: list e view liberados para autenticados (ou curados públicos); create autenticado
        listRule: '@request.auth.id != "" && (user = @request.auth.id || is_curated = true)',
        viewRule: '@request.auth.id != "" && (user = @request.auth.id || is_curated = true)',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      })
      app.save(col)
    }

    // 2. Semear 12 imagens curadas com SVG gerado em data URI (sem depender de rede externa)
    let adminUser = null
    try {
      adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
    } catch (_) {}
    if (!adminUser) {
      try {
        const users = app.findRecordsByFilter('_pb_users_auth_', 'id != ""', '-created', 1)
        if (users && users.length > 0) adminUser = users[0]
      } catch (_) {}
    }
    if (!adminUser) return

    function createSvgDataUri(title, subtitle, color1, color2, iconType) {
      const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
    </pattern>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.22)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bgGrad)"/>
  <rect width="1080" height="1350" fill="url(#grid)"/>
  <circle cx="540" cy="500" r="420" fill="url(#glow)"/>
  
  <rect x="90" y="90" width="900" height="1170" rx="36" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  
  <g transform="translate(540, 520)" text-anchor="middle">
    <circle cx="0" cy="-60" r="80" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
    <text x="0" y="-38" font-size="64" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="900">${iconType}</text>
    <text x="0" y="80" font-size="44" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" fill="#ffffff" letter-spacing="1">${title}</text>
    <text x="0" y="140" font-size="24" font-family="system-ui, sans-serif" font-weight="500" fill="rgba(255,255,255,0.82)">${subtitle}</text>
  </g>
  
  <g transform="translate(540, 1140)" text-anchor="middle">
    <rect x="-180" y="-30" width="360" height="60" rx="30" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <text x="0" y="8" font-size="20" font-family="system-ui, sans-serif" font-weight="700" fill="#ffffff" letter-spacing="2">BESTCONTENT BANCO</text>
  </g>
</svg>`.trim()

      // Codificação compatível com ASCII puro
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
    }

    const curated = [
      {
        name: 'Escritório Moderno & Estratégia',
        category: 'negocios',
        network: 'linkedin',
        tags: ['negocios', 'corporativo', 'lideranca', 'produtividade', 'b2b'],
        color1: '#0F172A',
        color2: '#1E293B',
        icon: '💼',
        subtitle: 'Ambiente executivo para autoridade e negócios',
      },
      {
        name: 'Startup Tech & Inovação',
        category: 'tecnologia',
        network: 'todas',
        tags: ['tecnologia', 'ia', 'saas', 'startup', 'desenvolvimento'],
        color1: '#312E81',
        color2: '#4C1D95',
        icon: '⚡',
        subtitle: 'Visual digital para produtos e tecnologia',
      },
      {
        name: 'Playbook Educacional & Aula',
        category: 'educacao',
        network: 'instagram',
        tags: ['educacao', 'cursos', 'mentoria', 'dicas', 'carrossel'],
        color1: '#064E3B',
        color2: '#0F766E',
        icon: '📚',
        subtitle: 'Perfeito para guias, dicas e passo a passo',
      },
      {
        name: 'Café & Momento Criativo',
        category: 'estilo_de_vida',
        network: 'instagram',
        tags: ['lifestyle', 'criatividade', 'cafe', 'rotina', 'homeoffice'],
        color1: '#78350F',
        color2: '#92400E',
        icon: '☕',
        subtitle: 'Conexão humana e rotina de trabalho inspiradora',
      },
      {
        name: 'Gastronomia Gourmet & Sabor',
        category: 'alimentacao',
        network: 'instagram',
        tags: ['comida', 'gastronomia', 'delivery', 'restaurante', 'cardapio'],
        color1: '#831843',
        color2: '#9F1239',
        icon: '🍽️',
        subtitle: 'Texturas quentes para delivery e promoções',
      },
      {
        name: 'Fitness, Saúde & Treino',
        category: 'saude',
        network: 'todas',
        tags: ['saude', 'treino', 'bemestar', 'academia', 'energia'],
        color1: '#14532D',
        color2: '#166534',
        icon: '💪',
        subtitle: 'Motivação, saúde e superação diária',
      },
      {
        name: 'Moda Minimalista & Tendência',
        category: 'moda',
        network: 'instagram',
        tags: ['moda', 'estilo', 'look', 'tendencia', 'elegancia'],
        color1: '#262626',
        color2: '#404040',
        icon: '✨',
        subtitle: 'Visual sóbrio e elegante para coleções',
      },
      {
        name: 'Gradiente Neon Cyberpunk',
        category: 'tecnologia',
        network: 'tiktok',
        tags: ['neon', 'cyberpunk', 'tiktok', 'viral', 'jovem'],
        color1: '#000000',
        color2: '#4C0519',
        icon: '🔥',
        subtitle: 'Alto impacto visual para vídeos e Stories',
      },
      {
        name: 'Podium & Vendas Black Friday',
        category: 'negocios',
        network: 'todas',
        tags: ['vendas', 'oferta', 'blackfriday', 'desconto', 'cupom'],
        color1: '#1C1917',
        color2: '#7F1D1D',
        icon: '🏷️',
        subtitle: 'Base perfeita para campanhas e ofertas especiais',
      },
      {
        name: 'Zen, Bem-Estar & Meditação',
        category: 'estilo_de_vida',
        network: 'instagram',
        tags: ['zen', 'bemestar', 'mindfulness', 'paz', 'equilibrio'],
        color1: '#1E1B4B',
        color2: '#3730A3',
        icon: '🧘',
        subtitle: 'Calma e introspecção para posts de reflexão',
      },
      {
        name: 'Finanças & Gráficos de Crescimento',
        category: 'negocios',
        network: 'linkedin',
        tags: ['financas', 'investimentos', 'crescimento', 'lucro', 'b2b'],
        color1: '#022C22',
        color2: '#064E3B',
        icon: '📈',
        subtitle: 'Gráficos e solidez para consultores e finanças',
      },
      {
        name: 'Comunidade & Conexão Social',
        category: 'geral',
        network: 'todas',
        tags: ['comunidade', 'pessoas', 'equipe', 'engajamento', 'dialogo'],
        color1: '#581C87',
        color2: '#6B21A8',
        icon: '🤝',
        subtitle: 'Humanização e celebração de parcerias',
      },
    ]

    for (let i = 0; i < curated.length; i++) {
      const item = curated[i]
      try {
        app.findFirstRecordByFilter(
          'image_bank_assets',
          `name = "${item.name}" && is_curated = true`,
        )
      } catch (_) {
        const record = new Record(col)
        record.set('user', adminUser.id)
        record.set('name', item.name)
        record.set('category', item.category)
        record.set('network', item.network)
        record.set('tags', JSON.stringify(item.tags))
        record.set('is_curated', true)
        record.set('width', 1080)
        record.set('height', 1350)
        record.set(
          'preview_url',
          createSvgDataUri(item.name, item.subtitle, item.color1, item.color2, item.icon),
        )
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('image_bank_assets')
      app.delete(col)
    } catch (_) {}
  },
)
