/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0073 — Coleção notifications
 * Notificações persistidas do fluxo de aprovação:
 * - type: 'review_assigned' (revisor atribuído) | 'change_requested' (pedido de mudança)
 * - post: relation opcional para o post em questão (clicável no sino)
 * - is_read: controla contagem de não lidas no sino do header
 */
migrate(
  (app) => {
    const collection = new Collection({
      type: 'base',
      name: 'notifications',
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
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['review_assigned', 'change_requested', 'approval_flow'],
        },
        {
          name: 'post',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('posts').id,
          maxSelect: 1,
        },
        { name: 'actor_name', type: 'text', required: false },
        { name: 'message', type: 'text', required: true },
        { name: 'is_read', type: 'bool', required: false },
      ],
    })

    collection.indexes = [
      'CREATE INDEX idx_notifications_user ON notifications (user)',
      'CREATE INDEX idx_notifications_unread ON notifications (user, is_read)',
    ]

    app.save(collection)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('notifications'))
    } catch (_) {}
  },
)
