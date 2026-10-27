migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const topicsCol = app.findCollectionByNameOrId('community_topics')

    // 1. Tabela de curtidas da comunidade (para controle idempotente por usuário e tópico)
    if (!app.hasTable('community_likes')) {
      const likesCol = new Collection({
        name: 'community_likes',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != '' && user = @request.auth.id",
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
            name: 'topic',
            type: 'relation',
            required: true,
            collectionId: topicsCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_comm_likes_user_topic ON community_likes (user, topic)',
          'CREATE INDEX idx_comm_likes_topic ON community_likes (topic)',
        ],
      })
      app.save(likesCol)
    }

    // 2. Expandir community_topics com campo opcional de imagem/mídia se ainda não tiver
    const topicCol = app.findCollectionByNameOrId('community_topics')
    if (!topicCol.fields.getByName('image_url')) {
      topicCol.fields.add(
        new TextField({
          name: 'image_url',
          required: false,
        }),
      )
      app.save(topicCol)
    }
  },
  (app) => {
    try {
      const likesCol = app.findCollectionByNameOrId('community_likes')
      app.delete(likesCol)
    } catch (_) {}

    try {
      const topicCol = app.findCollectionByNameOrId('community_topics')
      const imgField = topicCol.fields.getByName('image_url')
      if (imgField) {
        topicCol.fields.removeByName('image_url')
        app.save(topicCol)
      }
    } catch (_) {}
  },
)
