migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. community_categories
    const categories = new Collection({
      name: 'community_categories',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'color', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_comm_cat_slug ON community_categories (slug)'],
    })
    app.save(categories)

    const catCol = app.findCollectionByNameOrId('community_categories')

    // 2. community_topics
    const topics = new Collection({
      name: 'community_topics',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'category',
          type: 'relation',
          required: true,
          collectionId: catCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text', required: true },
        { name: 'tags', type: 'json' },
        { name: 'views_count', type: 'number' },
        { name: 'likes_count', type: 'number' },
        { name: 'is_pinned', type: 'bool' },
        { name: 'vector', type: 'vector', dimensions: 1536, distance: 'cosine' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_comm_topics_user ON community_topics (user)',
        'CREATE INDEX idx_comm_topics_cat ON community_topics (category)',
        'CREATE INDEX idx_comm_topics_pinned ON community_topics (is_pinned)',
      ],
    })
    app.save(topics)

    const topicCol = app.findCollectionByNameOrId('community_topics')

    // 3. community_replies
    const replies = new Collection({
      name: 'community_replies',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'topic',
          type: 'relation',
          required: true,
          collectionId: topicCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'content', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_comm_replies_topic ON community_replies (topic)',
        'CREATE INDEX idx_comm_replies_user ON community_replies (user)',
      ],
    })
    app.save(replies)
  },
  (app) => {
    try {
      const replies = app.findCollectionByNameOrId('community_replies')
      app.delete(replies)
    } catch (_) {}
    try {
      const topics = app.findCollectionByNameOrId('community_topics')
      app.delete(topics)
    } catch (_) {}
    try {
      const categories = app.findCollectionByNameOrId('community_categories')
      app.delete(categories)
    } catch (_) {}
  },
)
