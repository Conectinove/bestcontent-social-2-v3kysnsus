migrate(
  (app) => {
    // =========================================================================
    // Migration 0040: Expandir audience_insights com baselines por rede
    // (Instagram, Facebook, LinkedIn, TikTok, WhatsApp, YouTube, Twitter/X)
    // =========================================================================
    let audienceCol
    try {
      audienceCol = app.findCollectionByNameOrId('audience_insights')
    } catch (_) {
      return
    }

    const brandsList = app.findRecordsByFilter('brands', '', '-created', 100, 0)
    const networksToSeed = [
      'all',
      'instagram',
      'facebook',
      'linkedin',
      'tiktok',
      'whatsapp',
      'youtube',
      'twitter',
    ]

    for (let b = 0; b < brandsList.length; b++) {
      const brandRec = brandsList[b]
      const brandId = brandRec.id
      const userId = brandRec.getString('user')

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

          let ageData = []
          let genderData = {}
          let citiesData = []
          let bestTimesData = []
          let peakDay = 'Quarta-feira'
          let peakHour = '19:00'
          let totalTracked = 15000

          if (net === 'twitter') {
            ageData = [
              { range: '18-24', percentage: 28 },
              { range: '25-34', percentage: 46 },
              { range: '35-44', percentage: 18 },
              { range: '45-54', percentage: 6 },
              { range: '55+', percentage: 2 },
            ]
            genderData = { female: 39, male: 57, other: 4 }
            citiesData = [
              { city: 'São Paulo, SP', percentage: 42 },
              { city: 'Rio de Janeiro, RJ', percentage: 19 },
              { city: 'Belo Horizonte, MG', percentage: 12 },
              { city: 'Brasília, DF', percentage: 11 },
              { city: 'Curitiba, PR', percentage: 7 },
            ]
            bestTimesData = [
              { day: 'Segunda-feira', hour: '12:30', score: 93 },
              { day: 'Terça-feira', hour: '10:00', score: 95 },
              { day: 'Quarta-feira', hour: '15:00', score: 97 },
              { day: 'Quinta-feira', hour: '21:00', score: 91 },
            ]
            peakDay = 'Quarta-feira'
            peakHour = '15:00'
            totalTracked = 11200
          } else if (net === 'youtube') {
            ageData = [
              { range: '18-24', percentage: 22 },
              { range: '25-34', percentage: 41 },
              { range: '35-44', percentage: 24 },
              { range: '45-54', percentage: 9 },
              { range: '55+', percentage: 4 },
            ]
            genderData = { female: 47, male: 50, other: 3 }
            citiesData = [
              { city: 'São Paulo, SP', percentage: 36 },
              { city: 'Rio de Janeiro, RJ', percentage: 18 },
              { city: 'Belo Horizonte, MG', percentage: 10 },
              { city: 'Curitiba, PR', percentage: 9 },
              { city: 'Porto Alegre, RS', percentage: 8 },
            ]
            bestTimesData = [
              { day: 'Terça-feira', hour: '18:00', score: 92 },
              { day: 'Quinta-feira', hour: '19:30', score: 96 },
              { day: 'Sábado', hour: '14:00', score: 94 },
              { day: 'Domingo', hour: '17:00', score: 99 },
            ]
            peakDay = 'Domingo'
            peakHour = '17:00'
            totalTracked = 22400
          } else if (net === 'linkedin') {
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
  },
  (app) => {
    // Reverter apenas registros de twitter adicionados nesta migration
    try {
      const records = app.findRecordsByFilter(
        'audience_insights',
        'network = "twitter"',
        '',
        200,
        0,
      )
      for (let i = 0; i < records.length; i++) {
        app.delete(records[i])
      }
    } catch (_) {}
  },
)
