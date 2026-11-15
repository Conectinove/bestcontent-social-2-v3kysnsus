/// <reference path="../pb_data/types.d.ts" />
// 0096: Fila de publicação automática (per-user) — social_publications.
// Cada registro é um disparo pendente/executado/falho de um post numa rede,
// usando a conta de CADA usuário via $connectors (nunca a conta do builder).
migrate(
  (app) => {
    const collection = new Collection({
      name: 'social_publications',
      type: 'base',
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',
      createRule: 'user = @request.auth.id',
      updateRule: 'user = @request.auth.id',
      deleteRule: 'user = @request.auth.id',
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
          collectionId: app.findCollectionByNameOrId('posts').id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'scheduled_post',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('scheduled_posts').id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'network',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['instagram', 'facebook'],
        },
        { name: 'target_account_id', type: 'text', required: false, max: 255 },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['pending', 'published', 'failed'],
        },
        { name: 'scheduled_at', type: 'date', required: true },
        { name: 'published_at', type: 'date', required: false },
        { name: 'error_message', type: 'text', required: false, max: 2000 },
        { name: 'attempts', type: 'number', required: false, min: 0, max: 10, onlyInt: true },
        { name: 'external_post_id', type: 'text', required: false, max: 255 },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_socialpub_schedpost_network ON social_publications (scheduled_post, network)',
        'CREATE INDEX idx_socialpub_user_status ON social_publications (user, status)',
        'CREATE INDEX idx_socialpub_due ON social_publications (scheduled_at)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('social_publications')
    app.delete(col)
  },
)
