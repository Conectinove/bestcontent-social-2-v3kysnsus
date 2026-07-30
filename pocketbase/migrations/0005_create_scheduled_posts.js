migrate(
  (app) => {
    const postsColId = app.findCollectionByNameOrId('posts').id
    const collection = new Collection({
      name: 'scheduled_posts',
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
          name: 'post',
          type: 'relation',
          required: true,
          collectionId: postsColId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'scheduled_at', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['pending', 'published', 'failed'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_scheduled_posts_scheduled_at ON scheduled_posts (scheduled_at)',
        'CREATE INDEX idx_scheduled_posts_user ON scheduled_posts (user)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('scheduled_posts')
    app.delete(collection)
  },
)
