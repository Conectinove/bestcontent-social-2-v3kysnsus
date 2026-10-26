migrate(
  (app) => {
    // 1. Atualizar select values da coleção user_integrations com as 6 novas redes
    const userIntegrationsCol = app.findCollectionByNameOrId('user_integrations')
    const networkField = userIntegrationsCol.fields.getByName('network')
    if (networkField) {
      networkField.values = [
        'instagram',
        'tiktok',
        'linkedin',
        'youtube',
        'facebook',
        'twitter',
        'threads',
        'pinterest',
        'whatsapp',
        'telegram',
        'kwai',
        'reddit',
        'discord',
        'twitch',
        'snapchat',
        'behance',
        'medium',
        'vimeo',
      ]
      app.save(userIntegrationsCol)
    }

    // Semear registros das 6 novas redes para o admin se ainda não existirem
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      if (admin) {
        const newNetworks = [
          {
            network: 'discord',
            connected: false,
            display_name: 'Discord Bot & Webhooks API',
            external_id: '',
          },
          {
            network: 'twitch',
            connected: false,
            display_name: 'Twitch Helix API',
            external_id: '',
          },
          {
            network: 'snapchat',
            connected: false,
            display_name: 'Snapchat Marketing API',
            external_id: '',
          },
          {
            network: 'behance',
            connected: false,
            display_name: 'Adobe Behance API',
            external_id: '',
          },
          {
            network: 'medium',
            connected: false,
            display_name: 'Medium Publishing API',
            external_id: '',
          },
          {
            network: 'vimeo',
            connected: false,
            display_name: 'Vimeo Video API',
            external_id: '',
          },
        ]

        for (let i = 0; i < newNetworks.length; i++) {
          const item = newNetworks[i]
          try {
            app.findFirstRecordByFilter(
              'user_integrations',
              `user = "${admin.id}" && network = "${item.network}"`,
            )
          } catch (_) {
            const record = new Record(userIntegrationsCol)
            record.set('user', admin.id)
            record.set('network', item.network)
            record.set('connected', item.connected)
            record.set('display_name', item.display_name)
            record.set('external_id', item.external_id)
            app.save(record)
          }
        }
      }
    } catch (_) {}

    // 2. Criar coleção post_metrics
    const usersColId = '_pb_users_auth_'
    const postsColId = app.findCollectionByNameOrId('posts').id

    let postMetricsCol
    try {
      postMetricsCol = app.findCollectionByNameOrId('post_metrics')
    } catch (_) {
      postMetricsCol = new Collection({
        name: 'post_metrics',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          {
            name: 'post',
            type: 'relation',
            required: true,
            collectionId: postsColId,
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
            name: 'rede',
            type: 'select',
            required: true,
            values: [
              'instagram',
              'tiktok',
              'linkedin',
              'youtube',
              'facebook',
              'twitter',
              'threads',
              'pinterest',
              'whatsapp',
              'telegram',
              'kwai',
              'reddit',
              'discord',
              'twitch',
              'snapchat',
              'behance',
              'medium',
              'vimeo',
            ],
            maxSelect: 1,
          },
          { name: 'alcance', type: 'number' },
          { name: 'impressoes', type: 'number' },
          { name: 'engajamento', type: 'number' },
          { name: 'cliques', type: 'number' },
          { name: 'salvamentos', type: 'number' },
          { name: 'taxa_engajamento', type: 'number' },
          { name: 'is_simulated', type: 'bool' },
          { name: 'data', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_post_metrics_post ON post_metrics (post)',
          'CREATE INDEX idx_post_metrics_rede ON post_metrics (rede)',
        ],
      })
      app.save(postMetricsCol)
    }

    // 3. Semear métricas de exemplo plausíveis para posts já publicados
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
        try {
          app.findFirstRecordByFilter('post_metrics', `post = "${postRec.id}"`)
        } catch (_) {
          const rec = new Record(postMetricsCol)
          rec.set('post', postRec.id)
          rec.set('user', postRec.getString('user'))
          const rawPlat = (postRec.getString('platform') || 'instagram').toLowerCase()
          let rede = 'instagram'
          if (rawPlat.includes('tik')) rede = 'tiktok'
          else if (rawPlat.includes('link')) rede = 'linkedin'
          else if (rawPlat.includes('you')) rede = 'youtube'
          else if (rawPlat.includes('face')) rede = 'facebook'
          else if (rawPlat.includes('twit') || rawPlat === 'x') rede = 'twitter'

          // Gerar números plausíveis baseados no id
          const seedNum = (postRec.id.charCodeAt(0) * 17 + p * 31) % 100
          const alcance = 1200 + seedNum * 48
          const impressoes = Math.round(alcance * (1.35 + (seedNum % 20) / 100))
          const cliques = Math.round(alcance * (0.045 + (seedNum % 30) / 1000))
          const salvamentos = Math.round(alcance * (0.03 + (seedNum % 25) / 1000))
          const engajamento = Math.round(alcance * (0.068 + (seedNum % 40) / 1000))
          const taxa = Number(((engajamento / Math.max(impressoes, 1)) * 100).toFixed(2))

          rec.set('rede', rede)
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
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('post_metrics')
      app.delete(col)
    } catch (_) {}
  },
)
