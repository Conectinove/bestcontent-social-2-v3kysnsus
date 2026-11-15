/// <reference path="../pb_data/types.d.ts" />
// 0124: labs_blog_posts — artigos do Labs (aba BLOG): rascunho/publicado por usuário,
// com capa (cover_url) e conteúdo em texto. Padrão idempotente da casa (0111/0115):
// coleção nova só se não existir, campos com getByName check, objetos planos nos fields.
migrate(
  (app) => {
    let col = null
    try {
      col = app.findCollectionByNameOrId('labs_blog_posts')
    } catch (_) {
      col = null
    }
    if (!col) {
      col = new Collection({
        name: 'labs_blog_posts',
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
            required: false,
            collectionId: app.findCollectionByNameOrId('brands').id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'title', type: 'text', required: true, max: 200 },
          { name: 'cover_url', type: 'text' },
          { name: 'content', type: 'text' },
          { name: 'status', type: 'select', values: ['draft', 'published'], maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_labs_blog_posts_user ON labs_blog_posts (user, updated DESC)',
          'CREATE INDEX idx_labs_blog_posts_status ON labs_blog_posts (user, status)',
        ],
      })
      app.save(col)
    } else {
      if (!col.fields.getByName('title')) {
        col.fields.add(new TextField({ name: 'title', required: true, max: 200 }))
      }
      if (!col.fields.getByName('cover_url')) {
        col.fields.add(new TextField({ name: 'cover_url' }))
      }
      if (!col.fields.getByName('content')) {
        col.fields.add(new TextField({ name: 'content' }))
      }
      app.save(col)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('labs_blog_posts'))
    } catch (_) {}
  },
)
