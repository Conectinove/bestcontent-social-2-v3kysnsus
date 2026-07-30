migrate(
  (app) => {
    const categoriesColId = app.findCollectionByNameOrId('categories').id
    const collection = new Collection({
      name: 'trends',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        {
          name: 'category',
          type: 'relation',
          required: true,
          collectionId: categoriesColId,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'source_url', type: 'text' },
        { name: 'image_url', type: 'text' },
        { name: 'popularity_score', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_trends_category ON trends (category)',
        'CREATE INDEX idx_trends_popularity ON trends (popularity_score)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('trends')
    app.delete(collection)
  },
)
