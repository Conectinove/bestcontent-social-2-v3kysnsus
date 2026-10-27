migrate(
  (app) => {
    // Criação idempotente da coleção performance_reports
    if (!app.hasTable('performance_reports')) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const brandsCol = app.findCollectionByNameOrId('brands')

      const collection = new Collection({
        name: 'performance_reports',
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
          {
            name: 'brand',
            type: 'relation',
            required: false,
            collectionId: brandsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true },
          {
            name: 'frequency',
            type: 'select',
            required: true,
            values: ['semanal', 'mensal', 'avulso'],
            maxSelect: 1,
          },
          {
            name: 'period_range',
            type: 'text',
            required: false,
          },
          {
            name: 'channels_included',
            type: 'json',
            required: false,
          },
          {
            name: 'executive_summary',
            type: 'text',
            required: false,
          },
          {
            name: 'kpis_json',
            type: 'json',
            required: false,
          },
          {
            name: 'highlights_json',
            type: 'json',
            required: false,
          },
          {
            name: 'is_scheduled',
            type: 'bool',
            required: false,
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_perf_reports_user ON performance_reports (user)',
          'CREATE INDEX idx_perf_reports_freq ON performance_reports (frequency)',
          'CREATE INDEX idx_perf_reports_created ON performance_reports (created DESC)',
        ],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('performance_reports')
      if (col) app.delete(col)
    } catch (_) {}
  },
)
