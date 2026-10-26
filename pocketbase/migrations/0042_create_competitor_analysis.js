migrate(
  (app) => {
    // =========================================================================
    // Migration 0042: Criar coleção competitor_analysis e semear baselines
    // =========================================================================
    const usersColId = '_pb_users_auth_'
    const brandsColId = app.findCollectionByNameOrId('brands').id

    let competitorCol
    try {
      competitorCol = app.findCollectionByNameOrId('competitor_analysis')
    } catch (_) {
      competitorCol = new Collection({
        name: 'competitor_analysis',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          {
            name: 'brand',
            type: 'relation',
            required: false,
            collectionId: brandsColId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'user',
            type: 'relation',
            required: false,
            collectionId: usersColId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'handle',
            type: 'text',
            required: false,
          },
          {
            name: 'network',
            type: 'select',
            required: true,
            values: [
              'instagram',
              'facebook',
              'linkedin',
              'tiktok',
              'youtube',
              'twitter',
              'whatsapp',
              'all',
            ],
            maxSelect: 1,
          },
          {
            name: 'estimated_followers',
            type: 'number',
          },
          {
            name: 'estimated_engagement_rate',
            type: 'number',
          },
          {
            name: 'post_frequency',
            type: 'text',
          },
          {
            name: 'estimated_growth_rate',
            type: 'number',
          },
          {
            name: 'strengths',
            type: 'json',
            maxSize: 1048576,
          },
          {
            name: 'weaknesses',
            type: 'json',
            maxSize: 1048576,
          },
          {
            name: 'notes',
            type: 'text',
          },
          {
            name: 'is_simulated',
            type: 'bool',
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_competitor_brand ON competitor_analysis (brand)',
          'CREATE INDEX idx_competitor_network ON competitor_analysis (network)',
          'CREATE INDEX idx_competitor_user ON competitor_analysis (user)',
        ],
      })
      app.save(competitorCol)
    }

    // Semear concorrentes baselines para as marcas existentes
    try {
      const brandsList = app.findRecordsByFilter('brands', '', '-created', 100, 0)
      for (let b = 0; b < brandsList.length; b++) {
        const brandRec = brandsList[b]
        const brandId = brandRec.id
        const userId = brandRec.getString('user')
        const brandName = brandRec.getString('name') || 'Sua Marca'

        const competitorSeeds = [
          {
            name: 'TechWave Criativa',
            handle: '@techwave.criativa',
            network: 'instagram',
            followers: 28400,
            engagement: 3.8,
            frequency: '5 posts / semana',
            growth: 4.2,
            strengths: ['Vídeos curtos no Reels', 'Identidade visual consistente'],
            weaknesses: ['Pouco engajamento nos Stories', 'Respostas lentas na DM'],
            notes: 'Forte presença em Reels visuais, mas menor retenção em carrosséis técnicos.',
          },
          {
            name: 'Pulse Media Digital',
            handle: '@pulsemediabr',
            network: 'instagram',
            followers: 18900,
            engagement: 4.9,
            frequency: '3 posts / semana',
            growth: 6.8,
            strengths: ['Carrosséis educativos aprofundados', 'Comunidade ativa nos comentários'],
            weaknesses: ['Frequência irregular', 'Pouca produção de vídeo'],
            notes: 'Referência em carrosséis de autoridade, com público muito engajado.',
          },
          {
            name: 'Vanguard Hub Corporativo',
            handle: 'vanguard-hub-brasil',
            network: 'linkedin',
            followers: 34500,
            engagement: 4.2,
            frequency: '4 posts / semana',
            growth: 5.1,
            strengths: ['Artigos longos e liderança de pensamento', 'C-levels engajando'],
            weaknesses: ['Linguagem formal excessiva', 'Pouca experimentação de formatos'],
            notes: 'Grande base B2B, porém taxa de cliques menor que a da sua marca.',
          },
          {
            name: 'Viralize Creators Lab',
            handle: '@viralize.lab',
            network: 'tiktok',
            followers: 47200,
            engagement: 7.4,
            frequency: '7 vídeos / semana',
            growth: 12.5,
            strengths: [
              'Alta retenção nos primeiros 3 segundos',
              'Uso inteligente de áudios em alta',
            ],
            weaknesses: ['Baixa conversão para vendas', 'Comunidade volátil'],
            notes: 'Foco massivo em visualizações virais, mas menor autoridade de produto.',
          },
          {
            name: 'Apex Growth & Strategy',
            handle: '@apex_growth_br',
            network: 'twitter',
            followers: 14200,
            engagement: 5.6,
            frequency: '2 threads / dia',
            growth: 8.3,
            strengths: ['Threads de alto impacto e debate', 'Engajamento em tempo real'],
            weaknesses: ['Poucos criativos visuais', 'Dependência de polêmicas'],
            notes: 'Muito ativo em discussões de nicho e comentários rápidos no X.',
          },
        ]

        for (let c = 0; c < competitorSeeds.length; c++) {
          const item = competitorSeeds[c]
          try {
            app.findFirstRecordByFilter(
              'competitor_analysis',
              `brand = "${brandId}" && name = "${item.name}"`,
            )
          } catch (_) {
            const compRec = new Record(competitorCol)
            compRec.set('brand', brandId)
            if (userId) compRec.set('user', userId)
            compRec.set('name', item.name)
            compRec.set('handle', item.handle)
            compRec.set('network', item.network)
            compRec.set('estimated_followers', item.followers)
            compRec.set('estimated_engagement_rate', item.engagement)
            compRec.set('post_frequency', item.frequency)
            compRec.set('estimated_growth_rate', item.growth)
            compRec.set('strengths', JSON.stringify(item.strengths))
            compRec.set('weaknesses', JSON.stringify(item.weaknesses))
            compRec.set('notes', item.notes)
            compRec.set('is_simulated', true)
            app.save(compRec)
          }
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('competitor_analysis')
      app.delete(col)
    } catch (_) {}
  },
)
