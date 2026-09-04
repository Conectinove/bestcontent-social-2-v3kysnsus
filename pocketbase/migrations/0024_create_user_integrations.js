migrate(
  (app) => {
    // 1. Create user_integrations collection
    const collection = new Collection({
      name: 'user_integrations',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'network',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['instagram', 'tiktok', 'linkedin', 'youtube', 'facebook'],
        },
        {
          name: 'connected',
          type: 'bool',
        },
        {
          name: 'connected_at',
          type: 'date',
        },
        {
          name: 'display_name',
          type: 'text',
        },
        {
          name: 'external_id',
          type: 'text',
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_user_integrations_user_network ON user_integrations (user, network)',
        'CREATE INDEX idx_user_integrations_user ON user_integrations (user)',
      ],
    })
    app.save(collection)

    const userIntegrationsCol = app.findCollectionByNameOrId('user_integrations')

    // 2. Seed initial state for default admin user:
    // Reference state:
    // - Instagram Graph API: connected
    // - TikTok Creator API: connected
    // - LinkedIn API: connected
    // - YouTube Data API: disconnected
    // - Facebook Pages API: disconnected
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      if (admin) {
        const initialStates = [
          {
            network: 'instagram',
            connected: true,
            display_name: 'Instagram Graph API',
            external_id: 'ig_ronaldo_barreto',
          },
          {
            network: 'tiktok',
            connected: true,
            display_name: 'TikTok Creator API',
            external_id: 'tt_ronaldo_barreto',
          },
          {
            network: 'linkedin',
            connected: true,
            display_name: 'LinkedIn API',
            external_id: 'li_ronaldo_barreto',
          },
          {
            network: 'youtube',
            connected: false,
            display_name: 'YouTube Data API',
            external_id: '',
          },
          {
            network: 'facebook',
            connected: false,
            display_name: 'Facebook Pages API',
            external_id: '',
          },
        ]

        const now = new Date().toISOString()
        for (let i = 0; i < initialStates.length; i++) {
          const item = initialStates[i]
          const record = new Record(userIntegrationsCol)
          record.set('user', admin.id)
          record.set('network', item.network)
          record.set('connected', item.connected)
          if (item.connected) {
            record.set('connected_at', now)
          }
          record.set('display_name', item.display_name)
          record.set('external_id', item.external_id)
          app.save(record)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('user_integrations')
      app.delete(col)
    } catch (_) {}
  },
)
