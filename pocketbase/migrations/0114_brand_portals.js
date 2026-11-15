/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0114 — Portal público de marca (pedido "gerar portais / incorporar").
 *
 * Cria a coleção `brand_portals`:
 *  - brand: relation única → brands (cascadeDelete)
 *  - share_token: text único (link público tipo /portal/{token})
 *  - theme_snapshot: json com as cores/tema da marca no momento da publicação
 *  - published: bool (ligado/desligado pelo dono)
 *  - user: relation obrigatória (dono)
 *
 * Padrão idempotente da casa: getByName check. Id >= 0114.
 * Regras: dono faz tudo; leitura pública só via hook portal_share.js (token).
 */
migrate(
  (app) => {
    let collection
    let brandsColId = ''
    try {
      brandsColId = app.findCollectionByNameOrId('brands').id
    } catch (_) {
      brandsColId = ''
    }

    try {
      collection = app.findCollectionByNameOrId('brand_portals')
    } catch (_) {
      collection = null
    }

    if (!collection) {
      collection = new Collection({
        name: 'brand_portals',
        type: 'base',
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id',
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
            name: 'brand',
            type: 'relation',
            required: true,
            collectionId: brandsColId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'share_token', type: 'text' },
          { name: 'theme_snapshot', type: 'json' },
          { name: 'published', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_brand_portals_token ON brand_portals (share_token)',
          'CREATE INDEX idx_brand_portals_brand ON brand_portals (brand)',
        ],
      })
      app.save(collection)
    } else {
      // Idempotência: garante campos em installs antigos.
      if (!collection.fields.getByName('share_token')) {
        collection.fields.add(new Field({ name: 'share_token', type: 'text' }))
      }
      if (!collection.fields.getByName('theme_snapshot')) {
        collection.fields.add(new Field({ name: 'theme_snapshot', type: 'json' }))
      }
      if (!collection.fields.getByName('published')) {
        collection.fields.add(new Field({ name: 'published', type: 'bool' }))
      }
      app.save(collection)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('brand_portals')
      app.delete(collection)
    } catch (_) {}
  },
)
