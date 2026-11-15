/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0113 — Link externo de preset (compartilhar por link).
 *
 * Adiciona `share_token` (text) à coleção studio_edit_presets (0101/0112).
 * O token é gerado pelo hook /backend/v1/presets/share e serve o preset
 * publicamente (sem expor o id) via GET /backend/v1/presets/share/{token}.
 * Regenerar o token no painel invalida o link anterior; apagar revoga.
 *
 * Padrão idempotente da casa: Field + getByName check. Id >= 0113.
 */
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('studio_edit_presets')

    // Campo share_token (text, opcional) — idempotente.
    if (!collection.fields.getByName('share_token')) {
      collection.fields.add(new TextField({ name: 'share_token' }))
    }

    // Índice para a busca pública por token (rota do hook preset_share.js).
    const idxName = 'idx_studio_edit_presets_share_token'
    const hasIndex = (collection.indexes || []).some((idx) => idx.includes(idxName))
    if (!hasIndex) {
      collection.indexes = (collection.indexes || []).concat([
        'CREATE INDEX idx_studio_edit_presets_share_token ON studio_edit_presets (share_token)',
      ])
    }

    app.save(collection)
  },
  (app) => {
    // Down: remove o campo e o índice.
    try {
      const collection = app.findCollectionByNameOrId('studio_edit_presets')
      try {
        const f = collection.fields.getByName('share_token')
        if (f) collection.fields.removeByName('share_token')
      } catch (_) {}
      app.save(collection)
    } catch (_) {}
  },
)
