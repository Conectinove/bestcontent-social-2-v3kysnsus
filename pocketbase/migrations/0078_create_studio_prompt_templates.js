migrate(
  (app) => {
    // 1. Criar coleção studio_prompt_templates
    const collection = new Collection({
      name: 'studio_prompt_templates',
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
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
        },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['video', 'image', 'audio', 'geral'],
          maxSelect: 1,
        },
        {
          name: 'template_text',
          type: 'text',
          required: true,
        },
        {
          name: 'default_model_id',
          type: 'text',
        },
        {
          name: 'placeholders',
          type: 'json',
        },
        {
          name: 'is_favorite',
          type: 'bool',
        },
        {
          name: 'usage_count',
          type: 'number',
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
        'CREATE INDEX idx_prompt_templates_user ON studio_prompt_templates (user)',
        'CREATE INDEX idx_prompt_templates_cat ON studio_prompt_templates (category)',
        'CREATE INDEX idx_prompt_templates_created ON studio_prompt_templates (created DESC)',
      ],
    })
    app.save(collection)

    // 2. Expandir studio_creations com campo is_external_api se não existir
    const studioCol = app.findCollectionByNameOrId('studio_creations')
    if (!studioCol.fields.getByName('is_external_api')) {
      studioCol.fields.add(
        new BoolField({
          name: 'is_external_api',
        }),
      )
    }
    if (!studioCol.fields.getByName('api_provider')) {
      studioCol.fields.add(
        new TextField({
          name: 'api_provider',
        }),
      )
    }
    app.save(studioCol)
  },
  (app) => {
    try {
      const templateCol = app.findCollectionByNameOrId('studio_prompt_templates')
      app.delete(templateCol)
    } catch (_) {}

    try {
      const studioCol = app.findCollectionByNameOrId('studio_creations')
      const f1 = studioCol.fields.getByName('is_external_api')
      if (f1) studioCol.fields.remove(f1)
      const f2 = studioCol.fields.getByName('api_provider')
      if (f2) studioCol.fields.remove(f2)
      app.save(studioCol)
    } catch (_) {}
  },
)
