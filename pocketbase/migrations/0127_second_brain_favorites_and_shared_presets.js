/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0127 — Grade de mídias do Segundo Cérebro:
 * (a) coleção second_brain_favorites para favoritar mídias de QUALQUER fonte
 *     (documento, acervo, uploads, biblioteca, drive, unsplash, pexels);
 *     {user relation obrigatório, source, media_id, meta json} + índice único
 *     (user+media_id) para o toggle ser idempotente.
 * (b) studio_edit_presets: nada a mudar — 0112 já criou is_shared e as regras
 *     de leitura por company; aqui só garantimos o índice composto (idempotente).
 *
 * Padrão da casa: idempotente (getByName / check antes de criar).
 */
migrate(
  (app) => {
    // ---- (a) second_brain_favorites ------------------------------------
    let favorites
    try {
      favorites = app.findCollectionByNameOrId('second_brain_favorites')
    } catch (_) {
      favorites = null
    }
    if (!favorites) {
      const userCol = app.findCollectionByNameOrId('users')
      favorites = new Collection({
        name: 'second_brain_favorites',
        type: 'base',
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: userCol.id,
            maxSelect: 1,
          },
          { name: 'source', type: 'text' },
          { name: 'media_id', type: 'text', required: true },
          { name: 'name', type: 'text' },
          { name: 'url', type: 'text' },
          { name: 'meta', type: 'json' },
        ],
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      })
      favorites.indexes = [
        'CREATE UNIQUE INDEX idx_sbf_user_media ON second_brain_favorites (user, media_id)',
        'CREATE INDEX idx_sbf_user ON second_brain_favorites (user)',
      ]
      app.save(favorites)
    } else {
      // Idempotência: garante campos e índice único se a coleção já existir.
      if (!favorites.fields.getByName('name')) {
        favorites.fields.add(new TextField({ name: 'name' }))
      }
      if (!favorites.fields.getByName('url')) {
        favorites.fields.add(new TextField({ name: 'url' }))
      }
      if (!favorites.fields.getByName('meta')) {
        favorites.fields.add(new JSONField({ name: 'meta' }))
      }
      const hasUnique = (favorites.indexes || []).some((i) => i.includes('idx_sbf_user_media'))
      if (!hasUnique) {
        favorites.indexes = (favorites.indexes || []).concat([
          'CREATE UNIQUE INDEX idx_sbf_user_media ON second_brain_favorites (user, media_id)',
        ])
      }
      app.save(favorites)
    }

    // ---- (b) studio_edit_presets: índice composto (is_shared) ----------
    try {
      const presets = app.findCollectionByNameOrId('studio_edit_presets')
      const idxName = 'idx_sbp_shared_created'
      const hasIdx = (presets.indexes || []).some((i) => i.includes(idxName))
      if (!hasIdx) {
        presets.indexes = (presets.indexes || []).concat([
          'CREATE INDEX idx_sbp_shared_created ON studio_edit_presets (is_shared, created)',
        ])
        app.save(presets)
      }
    } catch (_) {
      // coleção ausente: nada a fazer (0101/0112 cuidam dela)
    }
  },
  (app) => {
    try {
      const favorites = app.findCollectionByNameOrId('second_brain_favorites')
      app.delete(favorites)
    } catch (_) {}
  },
)
