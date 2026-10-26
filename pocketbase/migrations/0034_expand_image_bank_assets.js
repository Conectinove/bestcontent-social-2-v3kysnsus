migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('image_bank_assets')

    // 1. Atualizar select de categoria para incluir as novas categorias solicitadas
    const catField = col.fields.getByName('category')
    if (catField) {
      catField.values = [
        'negocios',
        'educacao',
        'alimentacao',
        'tecnologia',
        'estilo_de_vida',
        'saude',
        'moda',
        'fitness',
        'viagem',
        'imoveis',
        'financas',
        'beleza',
        'pets',
        'gastronomia',
        'esportes',
        'eventos',
        'geral',
      ]
      catField.maxSelect = 1
    }

    // 2. Adicionar campo is_favorite se não existir
    if (!col.fields.getByName('is_favorite')) {
      col.fields.add(
        new BoolField({
          name: 'is_favorite',
        }),
      )
    }

    app.save(col)

    // 3. Obter usuário responsável para autoria dos assets curados
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

    function createSvgDataUri(title, subtitle, color1, color2, iconType, tag) {
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
    <radialGradient id="glow" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bgGrad)"/>
  <rect width="1080" height="1350" fill="url(#grid)"/>
  <circle cx="540" cy="480" r="440" fill="url(#glow)"/>
  
  <rect x="80" y="80" width="920" height="1190" rx="36" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
  
  <g transform="translate(540, 180)" text-anchor="middle">
    <rect x="-140" y="-24" width="280" height="48" rx="24" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    <text x="0" y="8" font-size="18" font-family="system-ui, sans-serif" font-weight="800" fill="#ffffff" letter-spacing="2">${tag.toUpperCase()}</text>
  </g>

  <g transform="translate(540, 560)" text-anchor="middle">
    <circle cx="0" cy="-80" r="90" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
    <text x="0" y="-52" font-size="76" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="900">${iconType}</text>
    <text x="0" y="80" font-size="46" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" fill="#ffffff" letter-spacing="0.5">${title}</text>
    <text x="0" y="146" font-size="24" font-family="system-ui, sans-serif" font-weight="500" fill="rgba(255,255,255,0.85)">${subtitle}</text>
  </g>
  
  <g transform="translate(540, 1140)" text-anchor="middle">
    <rect x="-190" y="-30" width="380" height="60" rx="30" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <text x="0" y="8" font-size="20" font-family="system-ui, sans-serif" font-weight="700" fill="#ffffff" letter-spacing="2">BESTCONTENT BANCO</text>
  </g>
</svg>`.trim()
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
    }

    // 24 novas artes curadas abrangendo as novas categorias solicitadas
    const newCurated = [
      // Fitness & Performance
      {
        name: 'Treino de Alta Performance',
        category: 'fitness',
        network: 'instagram',
        tags: ['fitness', 'academia', 'treino', 'crossfit', 'hiit'],
        color1: '#7F1D1D',
        color2: '#991B1B',
        icon: '🏋️',
        subtitle: 'Foco, intensidade e superação para atletas e academias',
        tag: 'FITNESS PRO',
      },
      {
        name: 'Nutrição Esportiva & Suplementos',
        category: 'fitness',
        network: 'todas',
        tags: ['nutricao', 'suplemento', 'whey', 'dieta', 'saudavel'],
        color1: '#065F46',
        color2: '#047857',
        icon: '🥗',
        subtitle: 'Estética limpa para consultórios e produtos esportivos',
        tag: 'NUTRIÇÃO',
      },
      // Viagem & Turismo
      {
        name: 'Destinos Paradisíacos & Férias',
        category: 'viagem',
        network: 'instagram',
        tags: ['viagem', 'praia', 'ferias', 'turismo', 'resort'],
        color1: '#0E7490',
        color2: '#0369A1',
        icon: '✈️',
        subtitle: 'Visual solar para agências de viagens e resorts',
        tag: 'TURISMO',
      },
      {
        name: 'Roteiros de Aventura & Montanha',
        category: 'viagem',
        network: 'todas',
        tags: ['aventura', 'trilha', 'montanha', 'ecoturismo', 'natureza'],
        color1: '#14532D',
        color2: '#1E293B',
        icon: '🏔️',
        subtitle: 'Expedições e experiências ao ar livre',
        tag: 'AVENTURA',
      },
      // Imóveis & Arquitetura
      {
        name: 'Imóveis de Alto Padrão',
        category: 'imoveis',
        network: 'instagram',
        tags: ['imoveis', 'arquitetura', 'decoracao', 'altopadrao', 'corretor'],
        color1: '#1C1917',
        color2: '#292524',
        icon: '🏛️',
        subtitle: 'Sofisticação e linhas retas para o mercado imobiliário',
        tag: 'REAL ESTATE',
      },
      {
        name: 'Lançamento Residencial & Planta',
        category: 'imoveis',
        network: 'facebook',
        tags: ['construtora', 'lancamento', 'apartamento', 'moradia', 'investimento'],
        color1: '#1E1B4B',
        color2: '#312E81',
        icon: '🏢',
        subtitle: 'Comunicação assertiva para estandes de vendas',
        tag: 'LANÇAMENTO',
      },
      // Finanças & Investimentos
      {
        name: 'Carteira de Ações & Rentabilidade',
        category: 'financas',
        network: 'linkedin',
        tags: ['financas', 'acoes', 'bolsa', 'investimentos', 'dividendos'],
        color1: '#022C22',
        color2: '#064E3B',
        icon: '💹',
        subtitle: 'Solidez e autoridade para analistas de investimentos',
        tag: 'FINANÇAS',
      },
      {
        name: 'Planejamento Financeiro & Sucesso',
        category: 'financas',
        network: 'todas',
        tags: ['consultoria', 'educacaofinanceira', 'economia', 'riqueza', 'b2b'],
        color1: '#1E293B',
        color2: '#0F172A',
        icon: '💰',
        subtitle: 'Clareza estratégica para consultores e fintechs',
        tag: 'PATRIMÔNIO',
      },
      // Beleza & Estética
      {
        name: 'Estética Avançada & Skincare',
        category: 'beleza',
        network: 'instagram',
        tags: ['beleza', 'skincare', 'estetica', 'harmonizacao', 'dermatologia'],
        color1: '#831843',
        color2: '#9D174D',
        icon: '✨',
        subtitle: 'Tons rosados e delicados para clínicas de beleza',
        tag: 'BELEZA & GLOW',
      },
      {
        name: 'Spa, Massagem & Relaxamento',
        category: 'beleza',
        network: 'todas',
        tags: ['spa', 'massoterapia', 'autocuidado', 'relax', 'terapia'],
        color1: '#3B0764',
        color2: '#581C87',
        icon: '🌸',
        subtitle: 'Atmosfera de autocuidado e renovação',
        tag: 'SPA & RELAX',
      },
      // Pets & Veterinária
      {
        name: 'Clínica Veterinária & Cuidado Animal',
        category: 'pets',
        network: 'instagram',
        tags: ['pets', 'veterinaria', 'cachorro', 'gato', 'saudeanimal'],
        color1: '#064E3B',
        color2: '#0D9488',
        icon: '🐾',
        subtitle: 'Carinho e responsabilidade para hospitais pet',
        tag: 'VET & PETS',
      },
      {
        name: 'Banho, Tosa & Pet Shop',
        category: 'pets',
        network: 'todas',
        tags: ['petshop', 'banhoetosa', 'racao', 'filhotes', 'acessorios'],
        color1: '#78350F',
        color2: '#B45309',
        icon: '🐕',
        subtitle: 'Comunicação vibrante para lojas de animais',
        tag: 'PET SHOP',
      },
      // Gastronomia & Delivery
      {
        name: 'Hambúrguer Artesanal & Combos',
        category: 'gastronomia',
        network: 'instagram',
        tags: ['hamburguer', 'artesanal', 'delivery', 'lanche', 'ifood'],
        color1: '#450A0A',
        color2: '#7F1D1D',
        icon: '🍔',
        subtitle: 'Cores quentes e apetitosas para hamburguerias',
        tag: 'BURGER PRO',
      },
      {
        name: 'Pizza Napolitana & Forno a Lenha',
        category: 'gastronomia',
        network: 'todas',
        tags: ['pizza', 'pizzaria', 'massa', 'forno', 'noitedapizza'],
        color1: '#701A75',
        color2: '#86198F',
        icon: '🍕',
        subtitle: 'Tradição e sabor para rodízios e delivery',
        tag: 'PIZZARIA',
      },
      {
        name: 'Confeitaria Fina & Sobremesas',
        category: 'gastronomia',
        network: 'instagram',
        tags: ['doce', 'confeitaria', 'bolo', 'chocolate', 'sobremesa'],
        color1: '#831843',
        color2: '#BE185D',
        icon: '🧁',
        subtitle: 'Delicadeza visual para docerias e confeitarias',
        tag: 'CONFEITARIA',
      },
      // Esportes
      {
        name: 'Beach Tennis & Esportes de Areia',
        category: 'esportes',
        network: 'instagram',
        tags: ['beachtennis', 'raquete', 'praia', 'torneio', 'esporte'],
        color1: '#0284C7',
        color2: '#0369A1',
        icon: '🎾',
        subtitle: 'Energia jovem para arenas e torneios',
        tag: 'ARENA SPORTS',
      },
      {
        name: 'Futebol, Campeonatos & Torcida',
        category: 'esportes',
        network: 'todas',
        tags: ['futebol', 'campeonato', 'final', 'gol', 'jogos'],
        color1: '#14532D',
        color2: '#15803D',
        icon: '⚽',
        subtitle: 'Vibração esportiva para ligas e quadras de futebol',
        tag: 'CAMPEONATO',
      },
      // Festas & Eventos
      {
        name: 'Casamentos & Festas Inesquecíveis',
        category: 'eventos',
        network: 'instagram',
        tags: ['casamento', 'noiva', 'cerimonial', 'festa', 'debutante'],
        color1: '#312E81',
        color2: '#4338CA',
        icon: '🥂',
        subtitle: 'Elegância atemporal para cerimonialistas e buffets',
        tag: 'CELEBRAÇÃO',
      },
      {
        name: 'Festas Corporativas & Workshops',
        category: 'eventos',
        network: 'linkedin',
        tags: ['eventocorporativo', 'congresso', 'summit', 'palestra', 'conferencia'],
        color1: '#0F172A',
        color2: '#1E1B4B',
        icon: '🎤',
        subtitle: 'Estrutura visual para conferências e summits',
        tag: 'SUMMIT & B2B',
      },
      // Moda Corporativa & Tendências
      {
        name: 'Alfaiataria Moderna & Executiva',
        category: 'moda',
        network: 'linkedin',
        tags: ['modaexecutiva', 'alfaiataria', 'elegancia', 'looks', 'corporativo'],
        color1: '#172554',
        color2: '#1E293B',
        icon: '👔',
        subtitle: 'Impecável para marcas de moda executiva e alfaiataria',
        tag: 'FASHION B2B',
      },
      {
        name: 'Streetwear & Cultura Urbana',
        category: 'moda',
        network: 'tiktok',
        tags: ['streetwear', 'urbano', 'sneakers', 'drop', 'hype'],
        color1: '#09090B',
        color2: '#18181B',
        icon: '👟',
        subtitle: 'Visual de alto contraste para drops de roupas e sneakers',
        tag: 'STREET DROP',
      },
      // Tecnologia & Inovação
      {
        name: 'Inteligência Artificial & Automação',
        category: 'tecnologia',
        network: 'todas',
        tags: ['ia', 'chatgpt', 'automacao', 'deeplearning', 'dados'],
        color1: '#3B0764',
        color2: '#6B21A8',
        icon: '🤖',
        subtitle: 'Futurista e magnético para produtos de IA',
        tag: 'AI POWER',
      },
      {
        name: 'Cibersegurança & Proteção de Dados',
        category: 'tecnologia',
        network: 'linkedin',
        tags: ['seguranca', 'ciberseguranca', 'lgpd', 'cloud', 'ti'],
        color1: '#082F49',
        color2: '#0369A1',
        icon: '🛡️',
        subtitle: 'Confiança e blindagem para empresas de infraestrutura',
        tag: 'SECURITY',
      },
      // Negócios & Vendas
      {
        name: 'Escalada de Vendas & Metas Batidas',
        category: 'negocios',
        network: 'todas',
        tags: ['metas', 'vendas', 'equipecomercial', 'comissao', 'recorde'],
        color1: '#052E16',
        color2: '#14532D',
        icon: '🎯',
        subtitle: 'Comemoração de marcos comerciais e motivação de time',
        tag: 'METAS & RECORDES',
      },
    ]

    for (let i = 0; i < newCurated.length; i++) {
      const item = newCurated[i]
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
        record.set('is_favorite', false)
        record.set('width', 1080)
        record.set('height', 1350)
        record.set(
          'preview_url',
          createSvgDataUri(
            item.name,
            item.subtitle,
            item.color1,
            item.color2,
            item.icon,
            item.tag || item.category,
          ),
        )
        app.save(record)
      }
    }
  },
  (app) => {
    // Reversão
  },
)
