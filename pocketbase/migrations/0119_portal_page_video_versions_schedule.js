/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0119 — 4 pedidos do usuário nas páginas do portal de marca:
 *  1. Upload de vídeo próprio: file field `video_file` em portal_pages
 *     (arquivos de vídeo enviados pelo editor de blocos; o portal público
 *     reproduz com <video>; limite de tamanho ~100MB, mimeTypes comuns).
 *  2. Agendamento de publicação: datetime field `publish_at` em portal_pages
 *     (vazio = já publicada; preenchido = só aparece na pública depois da hora).
 *  3. Histórico de versões de páginas: coleção `portal_page_versions`
 *     (padrão do versionamento studio_edit_versions, migration 0103 —
 *     snapshot por salvamento com possibilidade de restaurar).
 *
 * Padrão idempotente da casa (getByName check) sobre a coleção existente
 * portal_pages (migration 0115) — nunca recria a coleção. Todo record exige
 * user (relation _pb_users_auth_, padrão 00090/00092).
 */
migrate(
  (app) => {
    // ---- 1+2. portal_pages: video_file + publish_at ------------------------
    const pages = app.findCollectionByNameOrId('portal_pages')
    if (!pages.fields.getByName('video_file')) {
      pages.fields.add(
        new FileField({
          name: 'video_file',
          maxSelect: 1,
          maxSize: 104857600, // ~100MB
          mimeTypes: [
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-matroska',
          ],
        }),
      )
    }
    if (!pages.fields.getByName('publish_at')) {
      pages.fields.add(new DateField({ name: 'publish_at' }))
    }
    app.save(pages)

    // ---- 3. portal_page_versions (snapshot por salvamento) -----------------
    let versionsCol = null
    try {
      versionsCol = app.findCollectionByNameOrId('portal_page_versions')
    } catch (_) {
      versionsCol = null
    }
    if (!versionsCol) {
      versionsCol = new Collection({
        name: 'portal_page_versions',
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
            name: 'page',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('portal_pages').id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'title', type: 'text', required: false, max: 120 },
          { name: 'slug', type: 'text', required: false, max: 120 },
          { name: 'content', type: 'json', required: false, maxSize: 2000000 },
          { name: 'publish_at', type: 'date' },
          { name: 'is_visible', type: 'bool' },
          { name: 'sort_order', type: 'number', onlyInt: true },
          { name: 'user_name', type: 'text', required: false, max: 160 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_portal_page_versions_page ON portal_page_versions (page, created DESC)',
          'CREATE INDEX idx_portal_page_versions_user ON portal_page_versions (user)',
        ],
      })
      app.save(versionsCol)
    }
  },
  (app) => {
    try {
      const versionsCol = app.findCollectionByNameOrId('portal_page_versions')
      app.delete(versionsCol)
    } catch (_) {}
    try {
      const pages = app.findCollectionByNameOrId('portal_pages')
      for (const name of ['video_file', 'publish_at']) {
        if (pages.fields.getByName(name)) pages.fields.removeByName(name)
      }
      app.save(pages)
    } catch (_) {}
  },
)
