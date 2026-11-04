migrate(
  (app) => {
    let usersCol
    try {
      usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    } catch (_) {
      usersCol = app.findCollectionByNameOrId('users')
    }

    if (!app.hasTable('saved_report_templates')) {
      const collection = new Collection({
        name: 'saved_report_templates',
        type: 'base',
        listRule: "@request.auth.id != '' && user = @request.auth.id",
        viewRule: "@request.auth.id != '' && user = @request.auth.id",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != '' && user = @request.auth.id",
        deleteRule: "@request.auth.id != '' && user = @request.auth.id",
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'name', type: 'text', required: true },
          { name: 'description', type: 'text', required: false },
          { name: 'channels', type: 'json', required: false },
          { name: 'sections', type: 'json', required: false },
          { name: 'period', type: 'text', required: false },
          { name: 'frequency', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_saved_templates_user ON saved_report_templates (user)',
          'CREATE INDEX idx_saved_templates_created ON saved_report_templates (created DESC)',
        ],
      })
      app.save(collection)
    }

    // Seeding inicial de modelos pré-configurados para o primeiro usuário
    try {
      const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (firstUser) {
        const templatesCol = app.findCollectionByNameOrId('saved_report_templates')
        const existing = app.findFirstRecordByFilter(
          'saved_report_templates',
          `user = "${firstUser.id}"`,
        )
        if (!existing) {
          const defaultTemplates = [
            {
              user: firstUser.id,
              name: 'Diretoria & ROAS Executivo',
              description: 'Visão executiva focada em receita, ROAS, investimento e leads',
              channels: ['google_ads', 'meta_ads', 'linkedin_ads', 'instagram'],
              sections: ['monetization', 'roas', 'executive_summary', 'leads_cpl'],
              period: '30d',
              frequency: 'mensal',
            },
            {
              user: firstUser.id,
              name: 'Social Engagement & Retenção',
              description: 'Métricas completas de alcance, salvamentos, comentários e seguidores',
              channels: ['instagram', 'tiktok', 'youtube', 'x', 'pinterest'],
              sections: ['reach', 'engagement', 'audience_growth', 'top_posts'],
              period: '7d',
              frequency: 'semanal',
            },
          ]

          defaultTemplates.forEach((t) => {
            const record = new Record(templatesCol, t)
            app.save(record)
          })
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('saved_report_templates')
      if (col) app.delete(col)
    } catch (_) {}
  },
)
