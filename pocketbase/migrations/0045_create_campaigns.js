migrate(
  (app) => {
    // 1. Obter IDs das collections relacionadas
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const brandsCol = app.findCollectionByNameOrId('brands')
    const postsCol = app.findCollectionByNameOrId('posts')

    // 2. Criar a collection 'campaigns'
    let campaignsCol
    try {
      campaignsCol = app.findCollectionByNameOrId('campaigns')
    } catch (_) {
      campaignsCol = new Collection({
        name: 'campaigns',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
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
            name: 'brand',
            type: 'relation',
            required: false,
            collectionId: brandsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'objective',
            type: 'select',
            required: true,
            values: ['engajar', 'vender', 'awareness'],
            maxSelect: 1,
          },
          {
            name: 'brand_voice',
            type: 'text',
            required: false,
          },
          {
            name: 'briefing',
            type: 'text',
            required: true,
          },
          {
            name: 'target_url',
            type: 'text',
            required: false,
          },
          {
            name: 'cta',
            type: 'text',
            required: false,
          },
          {
            name: 'formats',
            type: 'json',
            required: false,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['draft', 'active', 'completed', 'archived'],
            maxSelect: 1,
          },
          {
            name: 'total_credits',
            type: 'number',
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
          'CREATE INDEX idx_campaigns_user ON campaigns (user)',
          'CREATE INDEX idx_campaigns_brand ON campaigns (brand)',
          'CREATE INDEX idx_campaigns_status ON campaigns (status)',
        ],
      })
      app.save(campaignsCol)
    }

    // 3. Vincular campo 'campaign' na collection posts
    const freshCampaigns = app.findCollectionByNameOrId('campaigns')
    if (!postsCol.fields.getByName('campaign')) {
      postsCol.fields.add(
        new RelationField({
          name: 'campaign',
          required: false,
          collectionId: freshCampaigns.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      app.save(postsCol)
      postsCol.addIndex('idx_posts_campaign', false, 'campaign', '')
      app.save(postsCol)
    }
  },
  (app) => {
    try {
      const postsCol = app.findCollectionByNameOrId('posts')
      if (postsCol.fields.getByName('campaign')) {
        postsCol.removeIndex('idx_posts_campaign')
        postsCol.fields.removeByName('campaign')
        app.save(postsCol)
      }
    } catch (_) {}

    try {
      const campaignsCol = app.findCollectionByNameOrId('campaigns')
      app.delete(campaignsCol)
    } catch (_) {}
  },
)
