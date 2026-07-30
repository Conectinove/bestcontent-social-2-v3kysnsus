migrate(
  (app) => {
    var brandsCol = app.findCollectionByNameOrId('brands')

    var socialAccounts = new Collection({
      name: 'social_accounts',
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
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'brand',
          type: 'relation',
          required: false,
          collectionId: brandsCol.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'platform',
          type: 'select',
          required: true,
          values: ['Instagram', 'Facebook'],
          maxSelect: 1,
        },
        {
          name: 'external_handle',
          type: 'text',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['connected', 'disconnected'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_social_accounts_user ON social_accounts (user)'],
    })
    app.save(socialAccounts)

    var socialMetrics = new Collection({
      name: 'social_metrics',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'brand',
          type: 'relation',
          required: false,
          collectionId: brandsCol.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'platform',
          type: 'select',
          required: true,
          values: ['Instagram', 'Facebook'],
          maxSelect: 1,
        },
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'followers_count',
          type: 'number',
        },
        {
          name: 'engagement_rate',
          type: 'number',
        },
        {
          name: 'posts_count',
          type: 'number',
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_social_metrics_brand_date ON social_metrics (brand, date)',
        'CREATE INDEX idx_social_metrics_user_date ON social_metrics (user, date)',
      ],
    })
    app.save(socialMetrics)
  },
  (app) => {
    try {
      var col1 = app.findCollectionByNameOrId('social_metrics')
      app.delete(col1)
    } catch (_) {}
    try {
      var col2 = app.findCollectionByNameOrId('social_accounts')
      app.delete(col2)
    } catch (_) {}
  },
)
