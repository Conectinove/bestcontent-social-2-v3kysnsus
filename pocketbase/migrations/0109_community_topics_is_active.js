/// <reference path="../pb_data/types.d.ts" />
// 0109: is_active em community_topics (curadoria admin do feed) + users.role (admin real).
// Idempotente: só adiciona o campo quando ele ainda não existe; backfill cobre registros antigos.
migrate(
  (app) => {
    // 1) community_topics.is_active (bool) — ativo por padrão via backfill
    const topics = app.findCollectionByNameOrId('community_topics')
    if (!topics.fields.getByName('is_active')) {
      topics.fields.add(new Field({ name: 'is_active', type: 'bool' }))
      app.save(topics)
    }
    const inativos = app.findRecordsByFilter(
      'community_topics',
      'is_active != true',
      '-created',
      0,
      0,
    )
    for (const record of inativos) {
      record.set('is_active', true)
      app.save(record)
    }

    // 2) users.role (member|admin) — substitui o e-mail hardcoded de admin
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new Field({
          name: 'role',
          type: 'select',
          values: ['member', 'admin'],
          maxSelect: 1,
        }),
      )
      app.save(users)
    }
    const semRole = app.findRecordsByFilter('users', 'role = "" || role = null', '-created', 0, 0)
    for (const record of semRole) {
      record.set('role', 'member')
      app.save(record)
    }
  },
  (app) => {
    const topics = app.findCollectionByNameOrId('community_topics')
    if (topics.fields.getByName('is_active')) {
      topics.fields.removeByName('is_active')
      app.save(topics)
    }
  },
)
