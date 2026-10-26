migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const adsCol = app.findCollectionByNameOrId('ad_campaigns')

    // 1. Criar collection 'ads_metrics'
    let metricsCol
    try {
      metricsCol = app.findCollectionByNameOrId('ads_metrics')
    } catch (_) {
      metricsCol = new Collection({
        name: 'ads_metrics',
        type: 'base',
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id',
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'campaign',
            type: 'relation',
            required: true,
            collectionId: adsCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'date',
            type: 'date',
            required: true,
          },
          {
            name: 'impressions',
            type: 'number',
            required: true,
          },
          {
            name: 'reach',
            type: 'number',
            required: true,
          },
          {
            name: 'clicks',
            type: 'number',
            required: true,
          },
          {
            name: 'ctr',
            type: 'number',
            required: true,
          },
          {
            name: 'cpc',
            type: 'number',
            required: true,
          },
          {
            name: 'spent',
            type: 'number',
            required: true,
          },
          {
            name: 'conversions',
            type: 'number',
            required: false,
          },
          {
            name: 'is_simulated',
            type: 'bool',
            required: false,
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_ads_metrics_camp ON ads_metrics (campaign)',
          'CREATE INDEX idx_ads_metrics_user ON ads_metrics (user)',
          'CREATE INDEX idx_ads_metrics_date ON ads_metrics (date)',
        ],
      })
      app.save(metricsCol)
    }

    // 2. Seeder baseline: se existirem usuários e nenhuma campanha criada, criar uma campanha inicial demonstrativa
    // com métricas diárias para dar vida à tela imediatamente
    try {
      const existingCampaigns = app.findRecordsByFilter('ad_campaigns', '', '-created', 1, 0)
      if (existingCampaigns.length === 0) {
        // Tentar pegar o primeiro usuário
        const users = app.findRecordsByFilter('_pb_users_auth_', '', '-created', 1, 0)
        if (users.length > 0) {
          const userRec = users[0]
          let brandId = null
          try {
            const brands = app.findRecordsByFilter(
              'brands',
              `user = "${userRec.id}"`,
              '-created',
              1,
              0,
            )
            if (brands.length > 0) {
              brandId = brands[0].id
            }
          } catch (_) {}

          const demoCampaign = new Record(adsCol)
          demoCampaign.set('user', userRec.id)
          if (brandId) demoCampaign.set('brand', brandId)
          demoCampaign.set('name', 'Lançamento Estratégico — Tráfego & Leads')
          demoCampaign.set('network', 'instagram')
          demoCampaign.set('objective', 'trafego')
          demoCampaign.set('status', 'ativa')
          demoCampaign.set('daily_budget', 45)
          demoCampaign.set('total_budget', 315) // 7 dias
          demoCampaign.set('destination_url', 'https://midiaviva.app/oferta')
          demoCampaign.set(
            'target_audience',
            JSON.stringify({
              ageMin: 24,
              ageMax: 50,
              genders: 'todos',
              regions: ['Brasil (Principais capitais)'],
              interests: ['Marketing Digital', 'Empreendedorismo', 'Criação de Conteúdo'],
            }),
          )
          demoCampaign.set(
            'ad_copy',
            JSON.stringify({
              headline: 'Multiplique sua Produção de Conteúdo com IA',
              primaryText:
                'Descubra a metodologia de ponta a ponta adotada pelos maiores creators e agências. Posts, reels, stories e carrosséis com qualidade profissional.',
              description: 'Condição especial para os 50 primeiros assinantes.',
              cta: 'Saiba Mais',
              tone: 'Profissional e Convidativo',
            }),
          )
          demoCampaign.set(
            'projections',
            JSON.stringify({
              reach: 16900,
              impressions: 21700,
              clicks: 315,
              cpc: 1.0,
              cpm: 14.5,
              ctr: 1.45,
            }),
          )
          app.save(demoCampaign)

          // Semear 7 dias de métricas evolutivas
          const now = new Date()
          const dailyData = [
            { dayOffset: 6, imp: 2850, reach: 2210, clk: 41, spent: 44.5, conv: 3 },
            { dayOffset: 5, imp: 3100, reach: 2430, clk: 47, spent: 45.0, conv: 4 },
            { dayOffset: 4, imp: 3340, reach: 2610, clk: 52, spent: 45.2, conv: 5 },
            { dayOffset: 3, imp: 3490, reach: 2750, clk: 54, spent: 45.0, conv: 6 },
            { dayOffset: 2, imp: 3620, reach: 2890, clk: 58, spent: 44.8, conv: 7 },
            { dayOffset: 1, imp: 3810, reach: 3010, clk: 61, spent: 45.1, conv: 7 },
            { dayOffset: 0, imp: 2150, reach: 1720, clk: 36, spent: 28.5, conv: 4 },
          ]

          for (const d of dailyData) {
            const dateObj = new Date(now.getTime() - d.dayOffset * 86400000)
            const dateStr = dateObj.toISOString().split('T')[0] + ' 12:00:00.000Z'
            const rec = new Record(metricsCol)
            rec.set('user', userRec.id)
            rec.set('campaign', demoCampaign.id)
            rec.set('date', dateStr)
            rec.set('impressions', d.imp)
            rec.set('reach', d.reach)
            rec.set('clicks', d.clk)
            rec.set('ctr', Number(((d.clk / d.imp) * 100).toFixed(2)))
            rec.set('cpc', Number((d.spent / d.clk).toFixed(2)))
            rec.set('spent', d.spent)
            rec.set('conversions', d.conv)
            rec.set('is_simulated', true)
            app.save(rec)
          }
        }
      }
    } catch (seedErr) {
      console.log('Aviso ao semear campanha demo de anúncios:', seedErr)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('ads_metrics')
      app.delete(col)
    } catch (_) {}
  },
)
