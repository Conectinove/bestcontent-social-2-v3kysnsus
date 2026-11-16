/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0128 — Controle de permissões v2:
 * (a) coleção org_role_history — histórico de mudanças de cargo
 *     {user (membro), by (quem alterou), from_role, to_role, created}.
 *     Regras: list/view apenas para membros da mesma org (via org do membro)
 *     — simplificação: membros da org = usuários com mesmo campo company do
 *     painel; regra prática: dono do registro e admins (is_admin) podem ler.
 * (b) users.org_permissions — json com permissões granulares por recurso
 *     (blog:publish, secondbrain:edit, media:upload, reports:export).
 *
 * Padrão da casa: idempotente (findCollectionByNameOrId / getByName antes de criar).
 */
migrate(
  (app) => {
    // ---- (a) org_role_history ------------------------------------------
    let history
    try {
      history = app.findCollectionByNameOrId('org_role_history')
    } catch (_) {
      history = null
    }
    if (!history) {
      const userCol = app.findCollectionByNameOrId('users')
      history = new Collection({
        name: 'org_role_history',
        type: 'base',
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: userCol.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'by',
            type: 'relation',
            collectionId: userCol.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'from_role', type: 'text' },
          { name: 'to_role', type: 'text' },
          { name: 'note', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        ],
        listRule:
          '@request.auth.id != "" && (user = @request.auth.id || @request.auth.is_admin = true)',
        viewRule:
          '@request.auth.id != "" && (user = @request.auth.id || @request.auth.is_admin = true)',
        createRule: null,
        updateRule: null,
        deleteRule: null,
      })
      history.indexes = ['CREATE INDEX idx_orh_user ON org_role_history (user, created)']
      app.save(history)
    } else {
      // Idempotência: garante campos se a coleção já existir.
      if (!history.fields.getByName('by')) {
        const userCol = app.findCollectionByNameOrId('users')
        history.fields.add(
          new RelationField({ name: 'by', collectionId: userCol.id, maxSelect: 1 }),
        )
      }
      if (!history.fields.getByName('note')) {
        history.fields.add(new TextField({ name: 'note' }))
      }
      app.save(history)
    }

    // ---- (b) users.org_permissions -------------------------------------
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('org_permissions')) {
      users.fields.add(new JSONField({ name: 'org_permissions' }))
      app.save(users)
    }
  },
  (app) => {
    try {
      const history = app.findCollectionByNameOrId('org_role_history')
      app.delete(history)
    } catch (_) {}
    try {
      const users = app.findCollectionByNameOrId('users')
      if (users.fields.getByName('org_permissions')) {
        users.fields.removeByName('org_permissions')
        app.save(users)
      }
    } catch (_) {}
  },
)
