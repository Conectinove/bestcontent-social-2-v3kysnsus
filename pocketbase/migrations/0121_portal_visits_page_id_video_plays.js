/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0121 — analytics por página + métricas de vídeo:
 *  1. portal_visits.page_id (text): id da página interna visitada (analytics
 *     filtrável por página; page_slug continua para compatibilidade).
 *  2. Coleção portal_video_plays: um record por play de vídeo próprio na
 *     página pública (page_id + media), gravado pelo hook público.
 * Padrão idempotente da casa (getByName check / findCollectionByNameOrId).
 */
migrate(
  (app) => {
    // ---- 1. portal_visits.page_id ------------------------------------------
    try {
      const visitsCol = app.findCollectionByNameOrId('portal_visits')
      if (!visitsCol.fields.getByName('page_id')) {
        visitsCol.fields.add(new TextField({ name: 'page_id' }))
      }
      app.save(visitsCol)
    } catch (e) {
      console.log('0121: erro ao expandir portal_visits: ' + e)
    }

    // ---- 2. coleção portal_video_plays --------------------------------------
    let playsCol = null
    try {
      playsCol = app.findCollectionByNameOrId('portal_video_plays')
    } catch (_) {
      playsCol = null
    }
    if (!playsCol) {
      playsCol = new Collection({
        name: 'portal_video_plays',
        type: 'base',
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: null,
        updateRule: null,
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
            name: 'portal',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('brand_portals').id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'brand',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('brands').id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'page_slug', type: 'text' },
          { name: 'page_id', type: 'text' },
          { name: 'media', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_portal_video_plays_portal ON portal_video_plays (portal, created DESC)',
          'CREATE INDEX idx_portal_video_plays_user ON portal_video_plays (user)',
        ],
      })
      app.save(playsCol)
    }
  },
  (app) => {
    try {
      const playsCol = app.findCollectionByNameOrId('portal_video_plays')
      app.delete(playsCol)
    } catch (_) {}
    try {
      const visitsCol = app.findCollectionByNameOrId('portal_visits')
      if (visitsCol.fields.getByName('page_id')) {
        visitsCol.fields.removeByName('page_id')
        app.save(visitsCol)
      }
    } catch (_) {}
  },
)
