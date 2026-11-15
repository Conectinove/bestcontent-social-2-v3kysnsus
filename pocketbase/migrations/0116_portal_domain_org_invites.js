/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0116 — 4 pedidos em /app/brands (evolução do portal):
 *  1. Gráfico de visitas por dia: nada de schema — a série vem do hook de métricas.
 *  2. Domínio próprio por marca: campo `custom_domain` em brand_portals.
 *  3. Páginas em blocos arrastáveis: nada de schema (content já é json).
 *  4. Convite de membros: coleção `org_invites` (email, token, org_role, user).
 *
 * Padrão idempotente da casa (getByName check), objetos planos nos fields,
 * relação user obrigatória via _pb_users_auth_.
 */
migrate(
  (app) => {
    // ---- 1. brand_portals.custom_domain -------------------------------------
    try {
      const portals = app.findCollectionByNameOrId('brand_portals')
      if (!portals.fields.getByName('custom_domain')) {
        portals.fields.add(new TextField({ name: 'custom_domain' }))
      }
      app.save(portals)
    } catch (e) {
      console.log('0116: erro ao expandir brand_portals: ' + e)
    }

    // ---- 2. org_invites -------------------------------------------------------
    let invitesCol = null
    try {
      invitesCol = app.findCollectionByNameOrId('org_invites')
    } catch (_) {
      invitesCol = null
    }
    if (!invitesCol) {
      invitesCol = new Collection({
        name: 'org_invites',
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
          { name: 'email', type: 'text', required: true, max: 200 },
          { name: 'token', type: 'text' },
          { name: 'org_role', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_org_invites_token ON org_invites (token)',
          'CREATE INDEX idx_org_invites_user ON org_invites (user)',
        ],
      })
      app.save(invitesCol)
    } else {
      // Idempotência p/ installs antigos.
      if (!invitesCol.fields.getByName('email')) {
        invitesCol.fields.add(new TextField({ name: 'email', required: true, max: 200 }))
      }
      if (!invitesCol.fields.getByName('token')) {
        invitesCol.fields.add(new TextField({ name: 'token' }))
      }
      if (!invitesCol.fields.getByName('org_role')) {
        invitesCol.fields.add(new TextField({ name: 'org_role' }))
      }
      if (!invitesCol.fields.getByName('status')) {
        invitesCol.fields.add(new TextField({ name: 'status' }))
      }
      app.save(invitesCol)
    }
  },
  (app) => {
    try {
      const invitesCol = app.findCollectionByNameOrId('org_invites')
      app.delete(invitesCol)
    } catch (_) {}
    try {
      const portals = app.findCollectionByNameOrId('brand_portals')
      if (portals.fields.getByName('custom_domain')) {
        portals.fields.removeByName('custom_domain')
        app.save(portals)
      }
    } catch (_) {}
  },
)
