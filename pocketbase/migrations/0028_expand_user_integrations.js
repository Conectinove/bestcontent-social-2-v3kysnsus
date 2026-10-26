migrate(
  (app) => {
    // 1. Atualizar select values da coleção user_integrations
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
      ]
      app.save(userIntegrationsCol)
    }

    // 2. Semear registros das novas redes para o admin se ainda não existirem
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      if (admin) {
        const newNetworks = [
          {
            network: 'twitter',
            connected: false,
            display_name: 'X (antigo Twitter) API v2',
            external_id: '',
          },
          {
            network: 'threads',
            connected: false,
            display_name: 'Threads API',
            external_id: '',
          },
          {
            network: 'pinterest',
            connected: false,
            display_name: 'Pinterest API',
            external_id: '',
          },
          {
            network: 'whatsapp',
            connected: false,
            display_name: 'WhatsApp Cloud Business API',
            external_id: '',
          },
          {
            network: 'telegram',
            connected: false,
            display_name: 'Telegram Bot & Channel API',
            external_id: '',
          },
          {
            network: 'kwai',
            connected: false,
            display_name: 'Kwai Open Platform API',
            external_id: '',
          },
          {
            network: 'reddit',
            connected: false,
            display_name: 'Reddit Data API',
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
  },
  (app) => {
    // Revert opcional
    try {
      const userIntegrationsCol = app.findCollectionByNameOrId('user_integrations')
      const networkField = userIntegrationsCol.fields.getByName('network')
      if (networkField) {
        networkField.values = ['instagram', 'tiktok', 'linkedin', 'youtube', 'facebook']
        app.save(userIntegrationsCol)
      }
    } catch (_) {}
  },
)
