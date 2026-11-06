migrate(
  (app) => {
    // 1. Criar coleção studio_creations
    const collection = new Collection({
      name: 'studio_creations',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'brand',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('brands').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['video', 'image', 'audio'],
          maxSelect: 1,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'prompt',
          type: 'text',
          required: true,
        },
        {
          name: 'model_id',
          type: 'text',
          required: true,
        },
        {
          name: 'model_name',
          type: 'text',
          required: true,
        },
        {
          name: 'relative_cost',
          type: 'number',
        },
        {
          name: 'credits_used',
          type: 'number',
        },
        {
          name: 'preview_url',
          type: 'text',
        },
        {
          name: 'output_content',
          type: 'text',
        },
        {
          name: 'metadata_json',
          type: 'json',
        },
        {
          name: 'synced_to_library',
          type: 'bool',
        },
        {
          name: 'synced_post_id',
          type: 'text',
        },
        {
          name: 'ai_sync_status',
          type: 'select',
          values: ['pendente', 'sincronizado', 'enriquecido'],
          maxSelect: 1,
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
        'CREATE INDEX idx_studio_creations_user ON studio_creations (user)',
        'CREATE INDEX idx_studio_creations_type ON studio_creations (type)',
        'CREATE INDEX idx_studio_creations_created ON studio_creations (created DESC)',
      ],
    })
    app.save(collection)

    // 2. Expandir coleção posts para suportar metadados do Studio e sincronização de IA avançada
    const postsCol = app.findCollectionByNameOrId('posts')
    if (!postsCol.fields.getByName('origin')) {
      postsCol.fields.add(
        new TextField({
          name: 'origin',
        }),
      )
    }
    if (!postsCol.fields.getByName('studio_metadata')) {
      postsCol.fields.add(
        new JSONField({
          name: 'studio_metadata',
        }),
      )
    }
    if (!postsCol.fields.getByName('ai_synced')) {
      postsCol.fields.add(
        new BoolField({
          name: 'ai_synced',
        }),
      )
    }
    if (!postsCol.fields.getByName('ai_enrichment')) {
      postsCol.fields.add(
        new JSONField({
          name: 'ai_enrichment',
        }),
      )
    }
    app.save(postsCol)
  },
  (app) => {
    try {
      const studioCol = app.findCollectionByNameOrId('studio_creations')
      app.delete(studioCol)
    } catch (_) {}

    try {
      const postsCol = app.findCollectionByNameOrId('posts')
      const fieldsToRemove = ['origin', 'studio_metadata', 'ai_synced', 'ai_enrichment']
      fieldsToRemove.forEach((f) => {
        const field = postsCol.fields.getByName(f)
        if (field) postsCol.fields.remove(field)
      })
      app.save(postsCol)
    } catch (_) {}
  },
)
