/// <reference path="../pb_data/types.d.ts" />
// 0126: Labs refinements —
// 1) Nova coleção labs_email_templates (aba EMAIL): templates de email
//    customizáveis por usuário com variáveis {{nome}}, {{empresa}} etc.
// 2) Expansão do select `platform` da coleção posts (aba BLOG → compartilhar
//    em mais redes + aba POST). Mantém os 6 valores existentes e acrescenta
//    os que o app já suporta em user_integrations.
// Padrão idempotente da casa (0111/0124): coleção só se não existir, campos
// com getByName check, objetos planos {name, type}.
migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 1. labs_email_templates
    // ------------------------------------------------------------------
    let tplCol = null
    try {
      tplCol = app.findCollectionByNameOrId('labs_email_templates')
    } catch (_) {
      tplCol = null
    }
    if (!tplCol) {
      tplCol = new Collection({
        name: 'labs_email_templates',
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
          { name: 'description', type: 'text' },
          { name: 'subject', type: 'text' },
          { name: 'html', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_labs_email_templates_user ON labs_email_templates (user, updated DESC)',
          'CREATE UNIQUE INDEX idx_labs_email_templates_user_name ON labs_email_templates (user, name)',
        ],
      })
      app.save(tplCol)
    } else {
      let changed = false
      if (!tplCol.fields.getByName('name')) {
        tplCol.fields.add(new TextField({ name: 'name', required: true, max: 120 }))
        changed = true
      }
      if (!tplCol.fields.getByName('description')) {
        tplCol.fields.add(new TextField({ name: 'description' }))
        changed = true
      }
      if (!tplCol.fields.getByName('subject')) {
        tplCol.fields.add(new TextField({ name: 'subject' }))
        changed = true
      }
      if (!tplCol.fields.getByName('html')) {
        tplCol.fields.add(new TextField({ name: 'html' }))
        changed = true
      }
      if (changed) app.save(tplCol)
    }

    // ------------------------------------------------------------------
    // 2. Expandir select `platform` da coleção posts (idempotente)
    // ------------------------------------------------------------------
    try {
      const postsCol = app.findCollectionByNameOrId('posts')
      const platformField = postsCol.fields.getByName('platform')
      if (platformField) {
        const desired = [
          'Instagram',
          'TikTok',
          'YouTube',
          'Facebook',
          'LinkedIn',
          'Twitter/X',
          'WhatsApp',
          'Threads',
          'Pinterest',
          'Telegram',
          'Kwai',
          'Google Business',
        ]
        let needsSave = false
        const current = platformField.values || []
        for (let i = 0; i < desired.length; i++) {
          if (current.indexOf(desired[i]) === -1) {
            current.push(desired[i])
            needsSave = true
          }
        }
        if (needsSave) {
          platformField.values = current
          app.save(postsCol)
        }
      }
    } catch (_) {}
  },
  (app) => {
    // Down: remove apenas a coleção nova; o select de platform volta sem os extras
    try {
      app.delete(app.findCollectionByNameOrId('labs_email_templates'))
    } catch (_) {}
    try {
      const postsCol = app.findCollectionByNameOrId('posts')
      const platformField = postsCol.fields.getByName('platform')
      if (platformField) {
        platformField.values = [
          'Instagram',
          'TikTok',
          'YouTube',
          'Facebook',
          'LinkedIn',
          'Twitter/X',
        ]
        app.save(postsCol)
      }
    } catch (_) {}
  },
)
