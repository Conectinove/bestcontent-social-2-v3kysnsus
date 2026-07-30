migrate(
  (app) => {
    const categoriesColId = app.findCollectionByNameOrId('categories').id
    const brandsColId = app.findCollectionByNameOrId('brands').id
    const collection = new Collection({
      name: 'ideas',
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
        { name: 'brand', type: 'relation', collectionId: brandsColId, maxSelect: 1 },
        { name: 'category', type: 'relation', collectionId: categoriesColId, maxSelect: 1 },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'source', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ideas_user ON ideas (user)',
        'CREATE INDEX idx_ideas_brand ON ideas (brand)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('ideas')
    app.delete(collection)
  },
)
