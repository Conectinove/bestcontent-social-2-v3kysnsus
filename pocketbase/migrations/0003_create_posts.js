migrate(
  (app) => {
    const brandsColId = app.findCollectionByNameOrId('brands').id
    const collection = new Collection({
      name: 'posts',
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
          name: 'brand',
          type: 'relation',
          required: true,
          collectionId: brandsColId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'content', type: 'text', required: true },
        { name: 'caption', type: 'text' },
        {
          name: 'platform',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Twitter/X'],
        },
        {
          name: 'media',
          type: 'file',
          maxSelect: 10,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
        },
        { name: 'scheduled_date', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['draft', 'scheduled', 'published'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_posts_user ON posts (user)',
        'CREATE INDEX idx_posts_brand ON posts (brand)',
        'CREATE INDEX idx_posts_status ON posts (status)',
        'CREATE INDEX idx_posts_scheduled_date ON posts (scheduled_date)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('posts')
    app.delete(collection)
  },
)
