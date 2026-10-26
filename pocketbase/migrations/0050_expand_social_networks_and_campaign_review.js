migrate(
  (app) => {
    // 1. Expandir valores do select 'network' na collection user_integrations
    try {
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
          // 5 Novas Redes
          'google_business',
          'bluesky',
          'mastodon',
          'tumblr',
          'dribbble',
        ]
        app.save(userIntegrationsCol)
      }

      // Semear registros das 5 novas redes para o admin se ainda não existirem
      try {
        const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
        if (admin) {
          const newNetworks = [
            {
              network: 'google_business',
              connected: false,
              display_name: 'Google Business Profile API',
              external_id: '',
            },
            {
              network: 'bluesky',
              connected: false,
              display_name: 'Bluesky AT Protocol',
              external_id: '',
            },
            {
              network: 'mastodon',
              connected: false,
              display_name: 'Mastodon Fediverse API',
              external_id: '',
            },
            {
              network: 'tumblr',
              connected: false,
              display_name: 'Tumblr v2 API',
              external_id: '',
            },
            {
              network: 'dribbble',
              connected: false,
              display_name: 'Dribbble API v2',
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
    } catch (_) {}

    // 2. Expandir valores do select 'rede' em post_metrics se existir
    try {
      const postMetricsCol = app.findCollectionByNameOrId('post_metrics')
      const redeField = postMetricsCol.fields.getByName('rede')
      if (redeField) {
        redeField.values = [
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
          // 5 Novas Redes
          'google_business',
          'bluesky',
          'mastodon',
          'tumblr',
          'dribbble',
        ]
        app.save(postMetricsCol)
      }
    } catch (_) {}

    // 3. Adicionar campos de revisão na collection 'posts'
    try {
      const postsCol = app.findCollectionByNameOrId('posts')
      let changed = false

      if (!postsCol.fields.getByName('is_reviewed')) {
        postsCol.fields.add(
          new BoolField({
            name: 'is_reviewed',
            required: false,
          }),
        )
        changed = true
      }

      if (!postsCol.fields.getByName('review_notes')) {
        postsCol.fields.add(
          new TextField({
            name: 'review_notes',
            required: false,
          }),
        )
        changed = true
      }

      if (!postsCol.fields.getByName('campaign_format')) {
        postsCol.fields.add(
          new TextField({
            name: 'campaign_format',
            required: false,
          }),
        )
        changed = true
      }

      if (changed) {
        app.save(postsCol)
      }

      // Adicionar índice para filtragem rápida por status de revisão
      try {
        postsCol.addIndex('idx_posts_reviewed', false, 'is_reviewed', '')
        app.save(postsCol)
      } catch (_) {}
    } catch (_) {}
  },
  (app) => {
    try {
      const postsCol = app.findCollectionByNameOrId('posts')
      try {
        postsCol.removeIndex('idx_posts_reviewed')
      } catch (_) {}
      if (postsCol.fields.getByName('is_reviewed')) {
        postsCol.fields.removeByName('is_reviewed')
      }
      if (postsCol.fields.getByName('review_notes')) {
        postsCol.fields.removeByName('review_notes')
      }
      if (postsCol.fields.getByName('campaign_format')) {
        postsCol.fields.removeByName('campaign_format')
      }
      app.save(postsCol)
    } catch (_) {}
  },
)
