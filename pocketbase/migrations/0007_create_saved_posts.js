migrate(
  (app) => {
    const trendsColId = app.findCollectionByNameOrId('trends').id
    const collection = new Collection({
      name: 'saved_posts',
      type: 'base',
      listRule: '@request.auth.id = user',
      viewRule: '@request.auth.id = user',
      createRule: '@request.auth.id = user',
      updateRule: '@request.auth.id = user',
      deleteRule: '@request.auth.id = user',
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
          name: 'trend',
          type: 'relation',
          required: true,
          collectionId: trendsColId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'saved_at', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_saved_posts_trend_user ON saved_posts (trend, user)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('saved_posts')
    app.delete(collection)
  },
)
