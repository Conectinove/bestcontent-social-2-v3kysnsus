migrate(
  (app) => {
    var usersColId = '_pb_users_auth_'
    var brandsColId = app.findCollectionByNameOrId('brands').id
    var postsColId = app.findCollectionByNameOrId('posts').id

    var collection = new Collection({
      name: 'ab_tests',
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
          collectionId: usersColId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'brand',
          type: 'relation',
          required: false,
          collectionId: brandsColId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'post_a',
          type: 'relation',
          required: true,
          collectionId: postsColId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'post_b',
          type: 'relation',
          required: true,
          collectionId: postsColId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['running', 'completed', 'draft'],
        },
        {
          name: 'goal',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['clicks', 'conversions'],
        },
        { name: 'start_date', type: 'date', required: false },
        { name: 'end_date', type: 'date', required: false },
        {
          name: 'winner',
          type: 'relation',
          required: false,
          collectionId: postsColId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ab_tests_user ON ab_tests (user)',
        'CREATE INDEX idx_ab_tests_brand ON ab_tests (brand)',
        'CREATE INDEX idx_ab_tests_status ON ab_tests (status)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      var col = app.findCollectionByNameOrId('ab_tests')
      app.delete(col)
    } catch (_) {}
  },
)
