migrate(
  (app) => {
    // =========================================================================
    // 1. Criar coleção audience_insights
    // =========================================================================
    const usersColId = '_pb_users_auth_'
    const brandsColId = app.findCollectionByNameOrId('brands').id
    const postsCol = app.findCollectionByNameOrId('posts')
    const postMetricsCol = app.findCollectionByNameOrId('post_metrics')

    let audienceCol
    try {
      audienceCol = app.findCollectionByNameOrId('audience_insights')
    } catch (_) {
      audienceCol = new Collection({
        name: 'audience_insights',
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
            name: 'network',
            type: 'select',
            required: true,
            values: [
              'all',
              'instagram',
              'tiktok',
              'linkedin',
              'youtube',
              'facebook',
              'twitter',
              'whatsapp',
            ],
            maxSelect: 1,
          },
          {
            name: 'age_distribution',
            type: 'json',
            maxSize: 1048576,
          },
          {
            name: 'gender_distribution',
            type: 'json',
            maxSize: 1048576,
          },
          {
            name: 'top_cities',
            type: 'json',
            maxSize: 1048576,
          },
          {
            name: 'best_times',
            type: 'json',
            maxSize: 1048576,
          },
          {
            name: 'total_followers_tracked',
            type: 'number',
          },
          {
            name: 'engagement_peak_day',
            type: 'text',
          },
          {
            name: 'engagement_peak_hour',
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
          'CREATE INDEX idx_audience_insights_brand ON audience_insights (brand)',
          'CREATE INDEX idx_audience_insights_network ON audience_insights (network)',
          'CREATE INDEX idx_audience_insights_user ON audience_insights (user)',
        ],
      })
      app.save(audienceCol)
    }

    // =========================================================================
    // 2. Semear audience_insights baseline plausível para as marcas existentes
    // =========================================================================
    try {
      const brandsList = app.findRecordsByFilter('brands', '', '-created', 50, 0)
      for (let b = 0; b < brandsList.length; b++) {
        const brandRec = brandsList[b]
        const brandId = brandRec.id
        const userId = brandRec.getString('user')

        const networksToSeed = [
          'all',
          'instagram',
          'facebook',
          'linkedin',
          'whatsapp',
          'youtube',
          'tiktok',
        ]

        for (let n = 0; n < networksToSeed.length; n++) {
          const net = networksToSeed[n]
          try {
            app.findFirstRecordByFilter(
              'audience_insights',
              `brand = "${brandId}" && network = "${net}"`,
            )
          } catch (_) {
            const insightRec = new Record(audienceCol)
            insightRec.set('brand', brandId)
            if (userId) insightRec.set('user', userId)
            insightRec.set('network', net)

            // Variação plausível por rede social
            let ageData = []
            let genderData = {}
            let citiesData = []
            let bestTimesData = []
            let peakDay = 'Quarta-feira'
            let peakHour = '19:00'
            let totalTracked = 14200

            if (net === 'linkedin') {
              ageData = [
                { range: '18-24', percentage: 11 },
                { range: '25-34', percentage: 48 },
                { range: '35-44', percentage: 27 },
                { range: '45-54', percentage: 11 },
                { range: '55+', percentage: 3 },
              ]
              genderData = { female: 44, male: 53, other: 3 }
              citiesData = [
                { city: 'São Paulo, SP', percentage: 38 },
                { city: 'Rio de Janeiro, RJ', percentage: 16 },
                { city: 'Belo Horizonte, MG', percentage: 11 },
                { city: 'Curitiba, PR', percentage: 8 },
                { city: 'Brasília, DF', percentage: 7 },
              ]
              bestTimesData = [
                { day: 'Terça-feira', hour: '08:30', score: 96 },
                { day: 'Quarta-feira', hour: '12:00', score: 92 },
                { day: 'Quinta-feira', hour: '17:30', score: 98 },
                { day: 'Sexta-feira', hour: '10:00', score: 84 },
              ]
              peakDay = 'Quinta-feira'
              peakHour = '17:30'
              totalTracked = 8900
            } else if (net === 'facebook') {
              ageData = [
                { range: '18-24', percentage: 14 },
                { range: '25-34', percentage: 31 },
                { range: '35-44', percentage: 29 },
                { range: '45-54', percentage: 17 },
                { range: '55+', percentage: 9 },
              ]
              genderData = { female: 56, male: 42, other: 2 }
              citiesData = [
                { city: 'São Paulo, SP', percentage: 30 },
                { city: 'Rio de Janeiro, RJ', percentage: 15 },
                { city: 'Salvador, BA', percentage: 10 },
                { city: 'Fortaleza, CE', percentage: 9 },
                { city: 'Belo Horizonte, MG', percentage: 8 },
              ]
              bestTimesData = [
                { day: 'Segunda-feira', hour: '20:00', score: 88 },
                { day: 'Quarta-feira', hour: '19:30', score: 94 },
                { day: 'Sábado', hour: '11:00', score: 90 },
                { day: 'Domingo', hour: '20:30', score: 97 },
              ]
              peakDay = 'Domingo'
              peakHour = '20:30'
              totalTracked = 12400
            } else if (net === 'whatsapp') {
              ageData = [
                { range: '18-24', percentage: 19 },
                { range: '25-34', percentage: 39 },
                { range: '35-44', percentage: 24 },
                { range: '45-54', percentage: 13 },
                { range: '55+', percentage: 5 },
              ]
              genderData = { female: 58, male: 40, other: 2 }
              citiesData = [
                { city: 'São Paulo, SP', percentage: 34 },
                { city: 'Campinas, SP', percentage: 14 },
                { city: 'Rio de Janeiro, RJ', percentage: 12 },
                { city: 'Belo Horizonte, MG', percentage: 9 },
                { city: 'Porto Alegre, RS', percentage: 7 },
              ]
              bestTimesData = [
                { day: 'Segunda-feira', hour: '09:00', score: 95 },
                { day: 'Terça-feira', hour: '14:30', score: 93 },
                { day: 'Quarta-feira', hour: '18:00', score: 97 },
                { day: 'Sexta-feira', hour: '11:30', score: 91 },
              ]
              peakDay = 'Quarta-feira'
              peakHour = '18:00'
              totalTracked = 4600
            } else if (net === 'tiktok') {
              ageData = [
                { range: '18-24', percentage: 46 },
                { range: '25-34', percentage: 34 },
                { range: '35-44', percentage: 13 },
                { range: '45-54', percentage: 5 },
                { range: '55+', percentage: 2 },
              ]
              genderData = { female: 61, male: 36, other: 3 }
              citiesData = [
                { city: 'São Paulo, SP', percentage: 32 },
                { city: 'Rio de Janeiro, RJ', percentage: 17 },
                { city: 'Fortaleza, CE', percentage: 9 },
                { city: 'Belo Horizonte, MG', percentage: 8 },
                { city: 'Recife, PE', percentage: 7 },
              ]
              bestTimesData = [
                { day: 'Terça-feira', hour: '21:00', score: 94 },
                { day: 'Quinta-feira', hour: '21:30', score: 98 },
                { day: 'Sexta-feira', hour: '22:00', score: 96 },
                { day: 'Sábado', hour: '16:00', score: 91 },
              ]
              peakDay = 'Quinta-feira'
              peakHour = '21:30'
              totalTracked = 19500
            } else {
              // Instagram e Geral ('all')
              ageData = [
                { range: '18-24', percentage: 23 },
                { range: '25-34', percentage: 44 },
                { range: '35-44', percentage: 21 },
                { range: '45-54', percentage: 8 },
                { range: '55+', percentage: 4 },
              ]
              genderData = { female: 54, male: 43, other: 3 }
              citiesData = [
                { city: 'São Paulo, SP', percentage: 35 },
                { city: 'Rio de Janeiro, RJ', percentage: 16 },
                { city: 'Belo Horizonte, MG', percentage: 10 },
                { city: 'Curitiba, PR', percentage: 8 },
                { city: 'Brasília, DF', percentage: 7 },
              ]
              bestTimesData = [
                { day: 'Segunda-feira', hour: '18:30', score: 89 },
                { day: 'Terça-feira', hour: '12:00', score: 91 },
                { day: 'Quarta-feira', hour: '19:00', score: 98 },
                { day: 'Quinta-feira', hour: '20:00', score: 95 },
                { day: 'Domingo', hour: '19:30', score: 92 },
              ]
              peakDay = 'Quarta-feira'
              peakHour = '19:00'
              totalTracked = 16800
            }

            insightRec.set('age_distribution', JSON.stringify(ageData))
            insightRec.set('gender_distribution', JSON.stringify(genderData))
            insightRec.set('top_cities', JSON.stringify(citiesData))
            insightRec.set('best_times', JSON.stringify(bestTimesData))
            insightRec.set('total_followers_tracked', totalTracked)
            insightRec.set('engagement_peak_day', peakDay)
            insightRec.set('engagement_peak_hour', peakHour)
            insightRec.set('is_simulated', true)
            app.save(insightRec)
          }
        }
      }
    } catch (_) {}

    // =========================================================================
    // 3. Expandir post_metrics para posts multi-rede existentes
    // =========================================================================
    try {
      const publishedPosts = app.findRecordsByFilter(
        'posts',
        'status = "published"',
        '-created',
        50,
        0,
      )

      for (let p = 0; p < publishedPosts.length; p++) {
        const postRec = publishedPosts[p]
        let targetNetworks = []
        try {
          targetNetworks = JSON.parse(postRec.getString('target_networks')) || []
        } catch (_) {
          targetNetworks = []
        }

        const primaryPlatform = (postRec.getString('platform') || 'instagram').toLowerCase()
        const primaryRede = primaryPlatform.includes('tik')
          ? 'tiktok'
          : primaryPlatform.includes('link')
            ? 'linkedin'
            : primaryPlatform.includes('you')
              ? 'youtube'
              : primaryPlatform.includes('face')
                ? 'facebook'
                : primaryPlatform.includes('twit') || primaryPlatform === 'x'
                  ? 'twitter'
                  : 'instagram'

        // Garantir lista de redes com destinos do post
        const networksList = new Set([primaryRede])
        if (Array.isArray(targetNetworks)) {
          targetNetworks.forEach((t) => {
            const raw = String(t).toLowerCase()
            if (raw.includes('tik')) networksList.add('tiktok')
            else if (raw.includes('link')) networksList.add('linkedin')
            else if (raw.includes('face')) networksList.add('facebook')
            else if (raw.includes('you')) networksList.add('youtube')
            else if (raw.includes('whats')) networksList.add('whatsapp')
            else if (raw.includes('twit') || raw === 'x') networksList.add('twitter')
            else networksList.add('instagram')
          })
        }

        // Para enriquecer a experiência multi-rede em posts de exemplo,
        // adiciona redes comuns caso só tenha 1
        if (networksList.size < 2) {
          if (primaryRede === 'instagram') {
            networksList.add('facebook')
            networksList.add('linkedin')
          } else if (primaryRede === 'youtube') {
            networksList.add('tiktok')
            networksList.add('instagram')
          }
        }

        const networksArray = Array.from(networksList)
        for (let k = 0; k < networksArray.length; k++) {
          const r = networksArray[k]
          try {
            app.findFirstRecordByFilter('post_metrics', `post = "${postRec.id}" && rede = "${r}"`)
          } catch (_) {
            const rec = new Record(postMetricsCol)
            rec.set('post', postRec.id)
            rec.set('user', postRec.getString('user'))
            rec.set('rede', r)

            const factor =
              r === 'instagram'
                ? 1.0
                : r === 'facebook'
                  ? 0.75
                  : r === 'linkedin'
                    ? 0.6
                    : r === 'tiktok'
                      ? 1.4
                      : 0.85
            const seedNum = (postRec.id.charCodeAt(0) * 19 + p * 23 + k * 17) % 100
            const alcance = Math.round((1100 + seedNum * 42) * factor)
            const impressoes = Math.round(alcance * (1.3 + (seedNum % 25) / 100))
            const cliques = Math.round(alcance * (0.04 + (seedNum % 30) / 1000))
            const salvamentos = Math.round(alcance * (0.025 + (seedNum % 25) / 1000))
            const engajamento = Math.round(alcance * (0.065 + (seedNum % 35) / 1000))
            const taxa = Number(((engajamento / Math.max(impressoes, 1)) * 100).toFixed(2))

            rec.set('alcance', alcance)
            rec.set('impressoes', impressoes)
            rec.set('cliques', cliques)
            rec.set('salvamentos', salvamentos)
            rec.set('engajamento', engajamento)
            rec.set('taxa_engajamento', taxa)
            rec.set('is_simulated', true)
            rec.set('data', postRec.getString('created') || new Date().toISOString())
            app.save(rec)
          }
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('audience_insights')
      app.delete(col)
    } catch (_) {}
  },
)
