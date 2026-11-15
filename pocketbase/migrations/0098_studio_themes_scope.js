/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0098 — Escopo por usuário na coleção studio_themes.
 *
 * Novo campo `scope` (select, opcional, default efetivo "team"):
 * - "team": comportamento atual — visível para a equipe quando is_shared = true
 *   (tema da equipe, aparece na lista de todos os membros da mesma company).
 * - "personal": tema atribuído a UM usuário específico — o dono o vê e aplica
 *   só na própria conta; a equipe NÃO o recebe (mesmo com is_shared = true,
 *   o filtro de equipe do serviço ignora registros com scope = "personal").
 *
 * Backfill idempotente: registros antigos (sem scope) viram "team", para que
 * nenhum tema compartilhado existente mude de comportamento.
 */
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('studio_themes')

    if (!collection.fields.getByName('scope')) {
      collection.fields.add(
        new SelectField({
          name: 'scope',
          required: false,
          maxSelect: 1,
          values: ['team', 'personal'],
        }),
      )
    }

    collection.indexes = [
      ...(collection.indexes || []),
      'CREATE INDEX IF NOT EXISTS idx_studio_themes_scope ON studio_themes (scope)',
    ]

    // Salva primeiro (a coluna só passa a existir no SQLite após o save)
    app.save(collection)

    // Backfill: tudo que já existia é tema de equipe (comportamento anterior)
    app
      .db()
      .newQuery("UPDATE studio_themes SET scope = 'team' WHERE scope = '' OR scope IS NULL")
      .execute()
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('studio_themes')
    const f = collection.fields.getByName('scope')
    if (f) collection.fields.removeByName('scope')
    try {
      collection.removeIndex('idx_studio_themes_scope')
    } catch (_) {}
    app.save(collection)
  },
)
