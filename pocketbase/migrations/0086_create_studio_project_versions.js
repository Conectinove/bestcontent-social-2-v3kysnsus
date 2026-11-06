migrate(
  (app) => {
    let versionsCol
    try {
      versionsCol = app.findCollectionByNameOrId('studio_project_versions')
    } catch (_) {
      versionsCol = null
    }

    if (!versionsCol) {
      const col = new Collection({
        name: 'studio_project_versions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'project_id',
            type: 'text',
            required: true,
          },
          {
            name: 'version_number',
            type: 'number',
            required: true,
          },
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            type: 'text',
            required: false,
          },
          {
            name: 'author_id',
            type: 'text',
            required: false,
          },
          {
            name: 'author_name',
            type: 'text',
            required: false,
          },
          {
            name: 'change_summary',
            type: 'text',
            required: false,
          },
          {
            name: 'snapshot',
            type: 'json',
            required: true,
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
          'CREATE INDEX idx_spv_project_version ON studio_project_versions (project_id, version_number DESC)',
        ],
      })
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('studio_project_versions')
      if (col) {
        app.delete(col)
      }
    } catch (_) {
      // Ignora se não existir
    }
  },
)
