/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0120 — corretiva da 0119: o vídeo próprio passa a viver na
 * coleção `portal_media` (um record por arquivo de vídeo, permite VÁRIOS
 * blocos de vídeo por página sem colisão de campo único). Remove o field
 * `video_file` de portal_pages (mantém publish_at e portal_page_versions).
 *
 * Upload pelo padrão do logo: FormData direto do SDK contra a coleção
 * (createRule já garante user = dono). Public page resolve a URL no hook.
 */
migrate(
  (app) => {
    // remove o campo único da 0119 (substituído pela coleção portal_media)
    try {
      const pages = app.findCollectionByNameOrId('portal_pages')
      if (pages.fields.getByName('video_file')) {
        pages.fields.removeByName('video_file')
        app.save(pages)
      }
    } catch (_) {}

    // coleção de mídias de vídeo próprias do portal
    let media = null
    try {
      media = app.findCollectionByNameOrId('portal_media')
    } catch (_) {
      media = null
    }
    if (!media) {
      media = new Collection({
        name: 'portal_media',
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
            name: 'portal',
            type: 'relation',
            required: false,
            collectionId: app.findCollectionByNameOrId('brand_portals').id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'brand',
            type: 'relation',
            required: false,
            collectionId: app.findCollectionByNameOrId('brands').id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'file', type: 'file', required: true, maxSelect: 1, maxSize: 104857600 },
          { name: 'name', type: 'text', required: false, max: 255 },
          { name: 'size', type: 'number' },
          { name: 'mime', type: 'text', required: false, max: 120 },
        ],
      })
      app.save(media)
    }
  },
  (app) => {
    try {
      const media = app.findCollectionByNameOrId('portal_media')
      app.delete(media)
    } catch (_) {}
    try {
      const pages = app.findCollectionByNameOrId('portal_pages')
      if (!pages.fields.getByName('video_file')) {
        pages.fields.add(new FileField({ name: 'video_file', maxSelect: 1, maxSize: 104857600 }))
        app.save(pages)
      }
    } catch (_) {}
  },
)
