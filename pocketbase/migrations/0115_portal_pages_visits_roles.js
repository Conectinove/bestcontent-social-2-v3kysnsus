/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0115 — 4 pedidos em /app/settings:
 *  1. Permissões por membro: campo `org_role` (owner/admin/editor/viewer) em users.
 *  2. Analytics de visitas do portal: coleção `portal_visits`.
 *  3. Cor de tema por marca: campo `accent_color` em brands.
 *  4. Páginas internas do portal: coleção `portal_pages`.
 *
 * Padrão idempotente da casa (getByName check), objetos planos nos fields,
 * relação user obrigatória via _pb_users_auth_.
 */
migrate(
  (app) => {
    // ---- 1. users.org_role -------------------------------------------------
    try {
      const users = app.findCollectionByNameOrId('users')
      if (!users.fields.getByName('org_role')) {
        users.fields.add(
          new SelectField({
            name: 'org_role',
            values: ['owner', 'admin', 'editor', 'viewer'],
            maxSelect: 1,
          }),
        )
      }
      app.save(users)
    } catch (e) {
      console.log('0115: erro ao expandir users: ' + e)
    }

    // ---- 2. portal_visits --------------------------------------------------
    let visitsCol = null
    try {
      visitsCol = app.findCollectionByNameOrId('portal_visits')
    } catch (_) {
      visitsCol = null
    }
    if (!visitsCol) {
      visitsCol = new Collection({
        name: 'portal_visits',
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
          { name: 'referrer', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_portal_visits_portal ON portal_visits (portal, created DESC)',
          'CREATE INDEX idx_portal_visits_user ON portal_visits (user)',
        ],
      })
      app.save(visitsCol)
    }

    // ---- 3. brands.accent_color --------------------------------------------
    try {
      const brands = app.findCollectionByNameOrId('brands')
      if (!brands.fields.getByName('accent_color')) {
        brands.fields.add(new TextField({ name: 'accent_color' }))
      }
      app.save(brands)
    } catch (e) {
      console.log('0115: erro ao expandir brands: ' + e)
    }

    // ---- 4. portal_pages ---------------------------------------------------
    let pagesCol = null
    try {
      pagesCol = app.findCollectionByNameOrId('portal_pages')
    } catch (_) {
      pagesCol = null
    }
    if (!pagesCol) {
      pagesCol = new Collection({
        name: 'portal_pages',
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
            collectionId: app.findCollectionByNameOrId('brands').id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'title', type: 'text', required: true, max: 120 },
          { name: 'slug', type: 'text', required: true, max: 120 },
          { name: 'content', type: 'json' },
          { name: 'sort_order', type: 'number', onlyInt: true },
          { name: 'is_visible', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_portal_pages_brand ON portal_pages (brand, sort_order)',
          'CREATE UNIQUE INDEX idx_portal_pages_brand_slug ON portal_pages (brand, slug)',
        ],
      })
      app.save(pagesCol)
    } else {
      // Idempotência p/ installs antigos + correção de nome de coluna no índice.
      if (!pagesCol.fields.getByName('title')) {
        pagesCol.fields.add(new TextField({ name: 'title', required: true, max: 120 }))
      }
      if (!pagesCol.fields.getByName('slug')) {
        pagesCol.fields.add(new TextField({ name: 'slug', required: true, max: 120 }))
      }
      if (!pagesCol.fields.getByName('content')) {
        pagesCol.fields.add(new JSONField({ name: 'content' }))
      }
      if (!pagesCol.fields.getByName('sort_order')) {
        pagesCol.fields.add(new NumberField({ name: 'sort_order', onlyInt: true }))
      }
      if (!pagesCol.fields.getByName('is_visible')) {
        pagesCol.fields.add(new BoolField({ name: 'is_visible' }))
      }
      app.save(pagesCol)
    }
  },
  (app) => {
    // Revert: remove o que foi adicionado (campos simples; coleções novas inteiras).
    try {
      const pagesCol = app.findCollectionByNameOrId('portal_pages')
      app.delete(pagesCol)
    } catch (_) {}
    try {
      const visitsCol = app.findCollectionByNameOrId('portal_visits')
      app.delete(visitsCol)
    } catch (_) {}
    try {
      const brands = app.findCollectionByNameOrId('brands')
      if (brands.fields.getByName('accent_color')) {
        brands.fields.removeByName('accent_color')
        app.save(brands)
      }
    } catch (_) {}
    try {
      const users = app.findCollectionByNameOrId('users')
      if (users.fields.getByName('org_role')) {
        users.fields.removeByName('org_role')
        app.save(users)
      }
    } catch (_) {}
  },
)
