/// <reference path="../pb_data/types.d.ts" />
// 0131: labs_ai_briefing_templates — briefings de IA salvos pelo usuário no
// diálogo "Gerar com IA" do Labs (Blog/Email/Web/Post), reutilizáveis com um
// clique. Padrão idempotente da casa (0111/0124/0126): coleção só se não
// existir, campos com getByName check, objetos planos {name, type} —
// JsonField não existe (é JSONField) e todo record exige user (record@pb).
migrate(
  (app) => {
    let col = null
    try {
      col = app.findCollectionByNameOrId('labs_ai_briefing_templates')
    } catch (_) {
      col = null
    }
    if (!col) {
      col = new Collection({
        name: 'labs_ai_briefing_templates',
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
          { name: 'name', type: 'text', required: true, max: 120 },
          { name: 'briefing', type: 'text', required: true },
          { name: 'kind', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_labs_ai_briefing_user ON labs_ai_briefing_templates (user, updated DESC)',
          'CREATE UNIQUE INDEX idx_labs_ai_briefing_user_name ON labs_ai_briefing_templates (user, name)',
        ],
      })
      app.save(col)
    } else {
      let changed = false
      if (!col.fields.getByName('name')) {
        col.fields.add(new TextField({ name: 'name', required: true, max: 120 }))
        changed = true
      }
      if (!col.fields.getByName('briefing')) {
        col.fields.add(new TextField({ name: 'briefing', required: true }))
        changed = true
      }
      if (!col.fields.getByName('kind')) {
        col.fields.add(new TextField({ name: 'kind' }))
        changed = true
      }
      if (changed) app.save(col)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('labs_ai_briefing_templates'))
    } catch (_) {}
  },
)
